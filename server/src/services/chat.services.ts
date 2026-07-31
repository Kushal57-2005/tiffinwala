import mongoose from 'mongoose';
import { Customer } from '../models/Customer.model';
import { Message } from '../models/Message.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';

export const getChatCustomerService = async (
  userId: string,
  vendorId: string,
) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const messages = await Message.aggregate([
    {
      $match: {
        customerId: customer._id,
        vendorId: new mongoose.Types.ObjectId(vendorId),
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ]);

  return messages;
};

export const getChatVendorService = async (
  userId: string,
  customerId: string,
) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new ApiError(404, 'Vendor not found');
  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const messages = await Message.aggregate([
    {
      $match: {
        customerId: new mongoose.Types.ObjectId(customerId),
        vendorId: vendor._id,
      },
    },
    {
      $sort: {
        createdAt: 1,
      },
    },
  ]);

  return messages;
};

export const customerConvoService = async (userId: string) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const result = await Message.aggregate([
    {
      $match: {
        customerId: customer._id,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $group: {
        _id: '$vendorId',

        latestMessage: { $first: '$text' },
        latestMessageTime: { $first: '$createdAt' },
        latestSender: { $first: '$senderRole' },

        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$senderRole', 'vendor'] },
                  { $eq: ['$isRead', false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'vendors',
        localField: '_id',
        foreignField: '_id',
        as: 'vendor',
      },
    },
    { $unwind: '$vendor' },
    {
      $project: {
        _id: 0,
        vendorId: '$_id',
        businessName: '$vendor.businessName',
        latestMessage: 1,
        latestMessageTime: 1,
        latestSender: 1,
        unreadCount: 1,
      },
    },
    {
      $sort: {
        latestMessageTime: -1,
      },
    },
  ]);

  return result;
};

export const vendorConvoService = async (userId: string) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const result = await Message.aggregate([
    {
      $match: {
        vendorId: vendor._id,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $group: {
        _id: '$customerId',
        latestMessage: { $first: '$text' },
        latestSender: { $first: '$senderRole' },
        latestMessageTime: { $first: '$createdAt' },
        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$senderRole', 'customer'] },
                  { $eq: ['$isRead', false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: 'customers',
        localField: '_id',
        foreignField: '_id',
        as: 'customer',
      },
    },
    {
      $unwind: '$customer',
    },
    {
      $lookup: {
        from: 'users',
        localField: 'customer.userId',
        foreignField: '_id',
        as: 'user',
      },
    },
    {
      $unwind: '$user',
    },
    {
      $project: {
        _id: 0,
        customerId: '$_id',
        customerName: {
          $concat: ['$user.firstName', ' ', '$user.lastName'],
        },
        latestMessage: 1,
        latestMessageTime: 1,
        latestSender: 1,
        unreadCount: 1,
      },
    },
    {
      $sort: {
        latestMessageTime: -1,
      },
    },
  ]);
  return result;
};

export const markAsReadService = async (messageId: string) => {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, 'message does not exist');

  message.isRead = true;
  await message.save();
};

export const customerComplaintService = async (messageId: string) => {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, 'message does not exist');

  if (message.isComplaint === true || message.complaintStatus === 'raised')
    throw new ApiError(400, 'Complaint is raised already');

  message.isComplaint = true;
  message.complaintStatus = 'raised';
  await message.save();

  return {
    message: 'Complaint is successfully raised',
  };
};

export const VendorUpdateComplaintService = async (
  messageId: string,
  status: string,
) => {
  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, 'message does not exist');

  if (status == 'acknowledged' || status === 'resolved') {
    message.complaintStatus = status;
    await message.save();
  } else {
    console.log(status);
    throw new ApiError(400, 'Something is wrong try again');
  }
  return {
    message: `Complaint is successfully ${message.complaintStatus} by vendor`,
  };
};
