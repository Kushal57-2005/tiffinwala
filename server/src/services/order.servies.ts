import mongoose from 'mongoose';
import { Customer } from '../models/Customer.model';
import { MenuItem } from '../models/MenuItem.model';
import { Order } from '../models/Order.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { getTodayUTC } from '../utils/getTodayUTC';
import { getCurrentSession } from '../utils/session';
import { Subscription } from '../models/Subscription.model';
import { Connection } from '../models/Connection.model';
import { createNotification } from '../utils/notification';

interface PlaceOrderInput {
  userId: string;
  vendorId: string;
  tiers: { tierName: string; forProfile: string; quantity: number }[];
  addOns?: { addOnName: string; forProfile: string; quantity: number }[];
  note?: string;
  paymentMethod?: 'wallet' | 'token' | 'payLater';
}

export const placeOrderService = async (input: PlaceOrderInput) => {
  const { userId, vendorId, tiers, addOns, note, paymentMethod } = input;

  const customer = await Customer.findOne({ userId });
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }
  if (!vendor.isOpen) {
    throw new ApiError(400, 'Vendor is currenlty closed');
  }

  const today = getTodayUTC();
  const session = getCurrentSession();

  const todaysMenu = await MenuItem.findOne({
    vendorId: vendor._id,
    session,
    date: today,
    isExpired: false,
  });

  if (!todaysMenu) {
    throw new ApiError(400, 'No available menu for this session today');
  }

  // Count tier occurrences for stock check
  const tierCounts: Record<string, number> = {};
  for (const t of tiers) {
    tierCounts[t.tierName] = (tierCounts[t.tierName] || 0) + (t.quantity || 1);
  }

  for (const [tierName, count] of Object.entries(tierCounts)) {
    const menuTier = todaysMenu.tiers.find((t) => t.name === tierName);
    if (!menuTier) throw new ApiError(400, `Tier "${tierName}" not found`);
    if (menuTier.remainingQuantity < count) {
      throw new ApiError(400, `Not enough stock for "${tierName}"`);
    }
  }

  const orderTiers = tiers.map((t) => {
    const menuTier = todaysMenu.tiers.find((mt) => mt.name === t.tierName)!;
    return {
      tierName: t.tierName,
      pricePerUnit: menuTier.price,
      forProfile: t.forProfile,
      quantity: t.quantity || 1,
    };
  });

  // Validate + build addons (no stock check needed — addons aren't stock-limited per your model)
  const orderAddOns = (addOns || []).map((a) => {
    const menuAddOn = todaysMenu.addOns.find((ad) => ad.name === a.addOnName);
    if (!menuAddOn)
      throw new ApiError(400, `Add-on "${a.addOnName}" not found`);
    return {
      addOnName: a.addOnName,
      pricePerUnit: menuAddOn.price,
      forProfile: a.forProfile,
      quantity: a.quantity || 1,
    };
  });

  const tiersTotal = orderTiers.reduce(
    (sum, t) => sum + t.pricePerUnit * t.quantity,
    0,
  );
  const addOnsTotal = orderAddOns.reduce(
    (sum, a) => sum + a.pricePerUnit * a.quantity,
    0,
  );
  const totalAmount = tiersTotal + addOnsTotal;
  const connection = await Connection.findOne({
    customerId: customer._id,
    vendorId: vendor._id,
  });

  if (paymentMethod == 'payLater') {
    if (connection?.status === 'pending' || connection?.status === 'rejected')
      throw new ApiError(401, 'Connection is not established yet');
  }

  if (paymentMethod === 'wallet') {
    if (customer.walletBalance < totalAmount) {
      throw new ApiError(
        400,
        `Insufficient wallet balance. Required: ₹${totalAmount}, Available: ₹${customer.walletBalance}`,
      );
    }
  }

  if (paymentMethod === 'token') {
    const token = await Subscription.findOne({
      customerId: customer._id,
      vendorId: vendor._id,
      expiryDate: { $gte: today },
    });
    if (!token) throw new ApiError(404, 'Token are not valid or not found');

    const totalTiffins = tiers.reduce((sum, t) => sum + (t.quantity || 1), 0);
    if (token.remainingTokens < totalTiffins) {
      throw new ApiError(
        400,
        `Insufficient Tokens. Required: ${totalTiffins}, Available: ${token.remainingTokens}`,
      );
    }

    if (customer.walletBalance < addOnsTotal) {
      throw new ApiError(
        400,
        `Insufficient wallet balance for add-ons. Required: ₹${addOnsTotal}, Available: ₹${customer.walletBalance}`,
      );
    }
  }

  const order = await Order.create({
    customerId: customer._id,
    vendorId: vendor._id,
    menuItemId: todaysMenu._id,
    session,
    tiers: orderTiers,
    addOns: orderAddOns,
    totalAmount,
    paymentMethod,
    note,
    status: 'pending',
    customerLocation: {
      type: 'Point',
      coordinates: customer.location?.coordinates || [0, 0],
      address: customer.location?.address || '',
    },
    date: today,
  });

  await createNotification({
    userId: vendor.userId,
    title: 'New Order Received',
    message: `You have a new tiffin order for ${session}.`,
    type: 'order',
    data: {
      orderId: order._id,
      customerId: customer._id,
    },
  });

  await createNotification({
    userId: customer.userId,
    title: 'Order Placed Successfully',
    message: `Your order for ${session} has been placed and is pending vendor acceptance.`,
    type: 'order',
    data: {
      orderId: order._id,
      vendorId: vendor._id,
    },
  });

  return order;
};

export const getOrdersDetailsService = async (vendorId: string) => {
  const start = getTodayUTC();
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const orders = await Order.aggregate([
    {
      $match: {
        vendorId: new mongoose.Types.ObjectId(vendorId),
        session: getCurrentSession(),
        createdAt: { $gte: start, $lte: end },
      },
    },
    // 🔗 Join customer
    {
      $lookup: {
        from: 'customers',
        localField: 'customerId',
        foreignField: '_id',
        as: 'customer',
      },
    },
    { $unwind: '$customer' },

    // 🔗 Join user
    {
      $lookup: {
        from: 'users',
        localField: 'customer.userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },

    // 🎯 Shape response
    {
      $project: {
        _id: 1,
        firstName: '$user.firstName',
        lastName: '$user.lastName',
        tiers: 1,
        addOns: 1,
        status: 1,
        coordinates: '$customerLocation.coordinates',
        address: '$customerLocation.address',
        totalAmount: 1,
        paymentMethod: 1,
        orderTime: '$createdAt',
      },
    },

    // (optional) sort latest first
    {
      $sort: { orderTime: -1 },
    },
  ]);

  return orders;
};

export const acceptOrderService = async (orderId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.status === 'accepted' || order.status === 'rejected') {
      throw new ApiError(400, `Order is already ${order.status}`);
    }

    const menu = await MenuItem.findById(order.menuItemId).session(session);
    if (!menu) throw new ApiError(404, 'Menu not found');

    // Count tier occurrences in the order for stock validation/deduction
    const tierCounts: Record<string, number> = {};
    for (const t of order.tiers) {
      tierCounts[t.tierName] =
        (tierCounts[t.tierName] || 0) + (t.quantity || 1);
    }

    for (const [tierName, count] of Object.entries(tierCounts)) {
      const menuTier = menu.tiers.find((t) => t.name === tierName);

      if (!menuTier) {
        throw new ApiError(400, `Tier "${tierName}" no longer exists`);
      }
      if (menuTier.remainingQuantity < count) {
        throw new ApiError(
          400,
          `Not enough stock for "${tierName}". Only ${menuTier.remainingQuantity} left — reject this order`,
        );
      }

      menuTier.remainingQuantity -= count;
    }
    await menu.save({ session });

    // Deduct wallet
    const customer = await Customer.findById(order.customerId).session(session);
    if (!customer) throw new ApiError(404, 'Customer not found');
    const vendor = await Vendor.findById(order.vendorId).session(session);
    if (!vendor) throw new ApiError(404, 'Vendor not found');
    const connection = await Connection.findOne({
      customerId: customer._id,
      vendorId: vendor._id,
    }).session(session);

    if (order.paymentMethod == 'payLater') {
      if (connection?.status === 'pending' || connection?.status === 'rejected')
        throw new ApiError(404, 'Connection is not established yet');

      if (connection?.status === 'accepted') {
        connection.pendingDue += order.totalAmount;
        await connection.save({ session });
      }
    }

    if (order.paymentMethod === 'wallet') {
      if (customer.walletBalance < order.totalAmount) {
        throw new ApiError(400, `Insufficient wallet balance`);
      }
      customer.walletBalance -= order.totalAmount;
    }

    if (order.paymentMethod === 'token') {
      const today = getTodayUTC();
      const token = await Subscription.findOne({
        customerId: customer._id,
        vendorId: vendor._id,
        expiryDate: { $gte: today },
      }).session(session);
      if (!token) throw new ApiError(404, 'Token are not valid or not found');

      const totalTiffins = order.tiers.reduce(
        (sum, t) => sum + (t.quantity || 1),
        0,
      );
      if (token.remainingTokens < totalTiffins) {
        throw new ApiError(
          400,
          `Insufficient Token Balance. Required: ${totalTiffins}, Available: ${token.remainingTokens}`,
        );
      }
      token.remainingTokens -= totalTiffins;
      console.log(`Token Deducted remaining Token ${token.remainingTokens}`);
      await token.save({ session });

      const addOnsTotal = order.addOns.reduce(
        (sum, a) => sum + a.pricePerUnit * (a.quantity || 1),
        0,
      );
      if (addOnsTotal > 0) {
        if (customer.walletBalance < addOnsTotal) {
          throw new ApiError(
            400,
            `Insufficient wallet balance for add-ons. Required: ₹${addOnsTotal}, Available: ₹${customer.walletBalance}`,
          );
        }
        customer.walletBalance -= addOnsTotal;
      }
    }

    // Add vendor to customer's myVendors if it's a new vendor
    if (!customer.myVendors) {
      customer.myVendors = [];
    }
    const vendorObjectId = new mongoose.Types.ObjectId(order.vendorId);
    const isNewVendor = !customer.myVendors.some(
      (vId) => vId.toString() === vendorObjectId.toString(),
    );
    if (isNewVendor) {
      customer.myVendors.push(vendorObjectId);
    }
    await customer.save({ session });

    order.status = 'accepted';
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    await createNotification({
      userId: customer.userId,
      title: 'Order Accepted! 🎉',
      message: `${vendor.businessName || 'Your vendor'} has accepted your order. Get ready for your tiffin!`,
      type: 'order',
      data: {
        orderId: order._id,
        vendorId: vendor._id,
      },
    });

    return { message: 'Order accepted', order };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};

export const rejectOrderService = async (orderId: string) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.status === 'accepted' || order.status === 'rejected') {
    throw new ApiError(
      400,
      `Order is already ${order.status} — cannot reject again`,
    );
  }

  const vendor = await Vendor.findById(order.vendorId);
  const customer = await Customer.findById(order.customerId);

  order.status = 'rejected';
  await order.save();

  if (customer) {
    await createNotification({
      userId: customer.userId,
      title: 'Order Rejected',
      message: `Sorry, your order has been rejected by ${vendor?.businessName || 'the vendor'}.`,
      type: 'order',
      data: {
        orderId: order._id,
        vendorId: vendor?._id,
      },
    });
  }

  return {
    message: 'Order is rejected',
  };
};

export const deliveredOrderService = async (orderId: string) => {
  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, 'Order not found');

  if (order.status == 'rejected') {
    throw new ApiError(401, 'Order is rejected ');
  }

  if (order.status == 'accepted') {
    order.status = 'delivered';
    await order.save();
  }

  const vendor = await Vendor.findById(order.vendorId);
  const customer = await Customer.findById(order.customerId);
  const currentSess = getCurrentSession();

  if (customer) {
    await createNotification({
      userId: customer.userId,
      title: 'Order Out for Delivery',
      message: `Your ${currentSess} tiffin from ${vendor?.businessName || 'your vendor'} is on its way!`,
      type: 'order',
      data: {
        orderId: order._id,
        vendorId: vendor?._id,
      },
    });
  }

  return {
    message: 'Order is delivered successfully',
  };
};

export const receivedOrderService = async (orderId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findById(orderId).session(session);
    if (!order) throw new ApiError(404, 'Order not found');

    if (order.status !== 'delivered') {
      throw new ApiError(401, 'Order is not mark delivered yet');
    }

    order.status = 'received';
    await order.save({ session });

    const vendor = await Vendor.findById(order.vendorId).session(session);
    if (!vendor) throw new ApiError(404, 'Vendor not found');

    if (order.paymentMethod === 'wallet') {
      vendor.walletBalance += order.totalAmount;
      await vendor.save({ session });
    }

    if (order.paymentMethod === 'token') {
      const addOnsTotal = order.addOns.reduce(
        (sum, a) => sum + a.pricePerUnit * (a.quantity || 1),
        0,
      );
      if (addOnsTotal > 0) {
        vendor.walletBalance += addOnsTotal;
        await vendor.save({ session });
      }
    }

    const customer = await Customer.findById(order.customerId).session(session);
    if (customer) {
      await createNotification({
        userId: customer.userId,
        title: 'Order Received ✓',
        message: `You have confirmed receiving your tiffin from ${vendor?.businessName || 'your vendor'}. Enjoy your meal!`,
        type: 'order',
        data: {
          orderId: order._id,
          vendorId: vendor?._id,
        },
      });
    }

    // Notify vendor too
    await createNotification({
      userId: vendor.userId,
      title: 'Order Marked Received',
      message: `A customer has confirmed receipt of their tiffin order.`,
      type: 'order',
      data: {
        orderId: order._id,
      },
    });

    await session.commitTransaction();
    session.endSession();
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }

  return {
    message: 'Order is received successfully',
  };
};
