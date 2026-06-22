import mongoose from 'mongoose';
import { Connection } from '../models/Connection.model';
import { Customer } from '../models/Customer.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { createNotification } from '../utils/notification';
import { User } from '../models/User.model';

export const requestConnectionService = async (
  userId: string,
  vendorId: string,
) => {
  const user = await User.findById(userId);
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const existing = await Connection.findOne({
    customerId: customer._id,
    vendorId: vendor._id,
  });

  if (existing) {
    if (existing.status === 'pending' || existing.status === 'accepted') {
      throw new ApiError(
        400,
        `Connection already ${existing.status} with this vendor`,
      );
    }
    // Re-request after rejection
    existing.status = 'pending';
    await existing.save();

    await createNotification({
      userId: vendor.userId,
      title: 'New Connection Request',
      message: `${user?.firstName} ${user?.lastName} wants to connect with you for Pay-Later orders.`,
      type: 'system',
      data: {
        connectionId: existing._id,
        customerId: customer._id,
      },
    });

    return existing;
  }

  const connection = await Connection.create({
    customerId: customer._id,
    vendorId: vendor._id,
    status: 'pending',
  });

  // Notify vendor (use vendor.userId, not vendor._id)
  await createNotification({
    userId: vendor.userId,
    title: 'New Connection Request',
    message: `${user?.firstName} ${user?.lastName} wants to connect with you for Pay-Later orders.`,
    type: 'system',
    data: {
      connectionId: connection._id,
      customerId: customer._id,
    },
  });

  return connection;
};

export const respondConnectionService = async (
  userId: string,
  connectionId: string,
  action: 'accept' | 'reject',
) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const connection = await Connection.findById(connectionId);
  if (!connection) throw new ApiError(404, 'Connection not found');

  if (connection.vendorId.toString() !== vendor._id.toString()) {
    throw new ApiError(
      403,
      'You are not authorized to respond to this connection',
    );
  }

  if (connection.status !== 'pending') {
    throw new ApiError(400, `Connection is already ${connection.status}`);
  }

  connection.status = action === 'accept' ? 'accepted' : 'rejected';
  await connection.save();

  if (connection.status === 'accepted') {
    // Notify customer: connection accepted
    await createNotification({
      userId: connection.customerId,
      title: 'Connection Accepted ✓',
      message: `${vendor.businessName} accepted your connection request. You can now place Pay-Later orders!`,
      type: 'system',
      data: {
        vendorId: vendor._id,
        connectionId: connection._id,
      },
    });
  } else {
    // Notify customer: connection rejected
    await createNotification({
      userId: connection.customerId,
      title: 'Connection Request Declined',
      message: `${vendor.businessName} declined your connection request. You can still place Wallet or Token orders.`,
      type: 'system',
      data: {
        vendorId: vendor._id,
        connectionId: connection._id,
      },
    });
  }

  return connection;
};

export const getMyConnectionsService = async (userId: string) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const connections = await Connection.find({
    customerId: customer._id,
    status: { $in: ['accepted', 'pending'] },
  }).populate('vendorId', 'businessName');

  return connections;
};

export const payDueService = async (userId: string, connectionId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const customer = await Customer.findOne({ userId }).session(session);
    if (!customer) throw new ApiError(404, 'Customer not found');

    const connection = await Connection.findById(connectionId).session(session);
    if (!connection) throw new ApiError(404, 'Connection not found');

    if (connection.customerId.toString() !== customer._id.toString()) {
      throw new ApiError(403, 'You are not authorized to pay this due');
    }

    if (connection.status !== 'accepted') {
      throw new ApiError(400, 'Connection is not active');
    }

    if (connection.pendingDue <= 0) {
      throw new ApiError(400, 'Nothing to pay — pending due is zero');
    }

    if (customer.walletBalance < connection.pendingDue) {
      throw new ApiError(
        400,
        `Insufficient wallet balance. Required: ₹${connection.pendingDue}, Available: ₹${customer.walletBalance}`,
      );
    }

    customer.walletBalance -= connection.pendingDue;
    const amountPaid = connection.pendingDue;
    connection.pendingDue = 0;

    await customer.save({ session });
    await connection.save({ session });

    // Fetch vendor to get userId for notification
    const vendor = await Vendor.findById(connection.vendorId).session(session);

    await session.commitTransaction();
    session.endSession();

    // Notify customer: payment confirmed
    await createNotification({
      userId: customer.userId,
      title: 'Due Paid Successfully',
      message: `₹${amountPaid} has been paid to ${vendor?.businessName || 'your vendor'}. Your pending due is now cleared.`,
      type: 'payment',
      data: {
        connectionId: connection._id,
        vendorId: connection.vendorId,
        amountPaid,
      },
    });

    // Notify vendor: payment received
    if (vendor) {
      await createNotification({
        userId: vendor.userId,
        title: 'Due Payment Received',
        message: `A customer has paid ₹${amountPaid} towards their pending due.`,
        type: 'payment',
        data: {
          connectionId: connection._id,
          customerId: customer._id,
          amountPaid,
        },
      });
    }

    return connection;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const getVendorConnectionsService = async (userId: string) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const connections = await Connection.find({
    vendorId: vendor._id,
    status: { $in: ['accepted', 'pending'] },
  }).populate({
    path: 'customerId',
    populate: {
      path: 'userId',
      select: 'firstName lastName email phone age',
    },
  });

  return connections;
};
