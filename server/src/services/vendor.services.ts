import mongoose from 'mongoose';
import { IAddOn, ITier, MenuItem } from '../models/MenuItem.model';
import { User } from '../models/User.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { getTodayUTC } from '../utils/getTodayUTC';
import { getCurrentSession } from '../utils/session';
import { Subscription } from '../models/Subscription.model';
import { Order } from '../models/Order.model';

export const toggleVendorOpenService = async (userId: string) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  vendor.isOpen = !vendor.isOpen;
  await vendor.save();

  return {
    isOpen: vendor.isOpen,
    message: `Vendor is now ${vendor.isOpen ? 'OPEN' : 'CLOSED'}`,
  };
};

export const createMenuService = async (
  userId: string,
  tiers: ITier[],
  addOns: IAddOn[],
  description: string,
  session: 'lunch' | 'dinner',
) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  if (!tiers || tiers.length === 0) {
    throw new ApiError(400, 'At least one tier is required');
  }

  for (const tier of tiers) {
    if (!tier.items || tier.items.length === 0) {
      throw new ApiError(
        400,
        `Tier "${tier.name}" must have at least one item`,
      );
    }
  }

  if (!session || !['lunch', 'dinner'].includes(session)) {
    throw new ApiError(400, 'session must be "lunch" or "dinner"');
  }

  const today = getTodayUTC();

  const existing = await MenuItem.findOne({
    vendorId: vendor._id,
    session,
    date: today,
    isExpired: false,
  });

  await MenuItem.updateMany(
    {
      vendorId: vendor._id,
      session,
      _id: { $ne: existing?._id },
      date: { $lt: today },
    },
    { $set: { isExpired: true } },
  );

  if (existing) {
    // Locked fields (name, price, items, maxQuantity, remainingQuantity)
    // for tiers that already exist — only NEW tiers get added as-is
    const existingNames = new Set(existing.tiers.map((t) => t.name));

    const newTiers = tiers
      .filter((t) => !existingNames.has(t.name))
      .map((t) => ({ ...t, remainingQuantity: t.maxQuantity }));

    existing.tiers = [...existing.tiers, ...newTiers];
    existing.addOns = addOns || [];
    existing.description = description;
    await existing.save();
    return existing;
  }

  const tiersWithRemaining = tiers.map((tier) => ({
    ...tier,
    remainingQuantity: tier.maxQuantity,
  }));

  const menuItem = await MenuItem.create({
    vendorId: vendor._id,
    session,
    tiers: tiersWithRemaining,
    addOns: addOns || [],
    description,
    date: today,
    isExpired: false,
  });

  return menuItem;
};

export const getTodayMenuService = async (
  vendorId: string,
  session: 'lunch' | 'dinner',
) => {
  const today = getTodayUTC();

  const result = await MenuItem.findOne({
    vendorId,
    session,
    date: today,
    isExpired: false,
  });
  return result;
};

export const getVendorProfileService = async (userId: string) => {
  const vendor = await Vendor.findOne({ userId }).populate(
    'userId',
    'firstName lastName email phone',
  );

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found.');
  }

  return vendor;
};

export const updateVendorProfileService = async (
  userId: string,
  firstname?: string,
  lastname?: string,
  email?: string,
  phone?: string,
  businessName?: string,
  deliveryRadiuskm?: number,
  address?: string,
  coordinates?: [number, number],
) => {
  // STEP 1 - build User update object
  const userUpdateData: Record<string, any> = {};
  if (firstname) userUpdateData.firstName = firstname;
  if (lastname) userUpdateData.lastName = lastname;
  if (email) userUpdateData.email = email;
  if (phone) userUpdateData.phone = phone;

  // STEP 2 - build Vendor update object (with dot notation for nested fields)
  const vendorUpdateData: Record<string, any> = {};
  if (businessName) vendorUpdateData.businessName = businessName;
  if (deliveryRadiuskm) vendorUpdateData.deliveryRadiuskm = deliveryRadiuskm;
  if (address) vendorUpdateData['location.address'] = address;
  if (coordinates) vendorUpdateData['location.coordinates'] = coordinates;

  // STEP 3 - update User (if any user fields provided)
  if (Object.keys(userUpdateData).length > 0) {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: userUpdateData },
      { new: true, runValidators: true },
    );

    if (!updatedUser) {
      throw new ApiError(404, 'User not found');
    }
  }

  // STEP 4 - update Vendor (if any vendor fields provided)
  let updatedVendor = await Vendor.findOne({ userId }).populate(
    'userId',
    'firstName lastName email phone',
  );

  if (!updatedVendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  if (Object.keys(vendorUpdateData).length > 0) {
    updatedVendor = await Vendor.findOneAndUpdate(
      { userId },
      { $set: vendorUpdateData },
      { new: true, runValidators: true },
    ).populate('userId', 'firstName lastName email phone');
  }

  return updatedVendor;
};

export const getSubscribersService = async (userId: string) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const subscriptions = await Subscription.find({
    vendorId: vendor._id,
  }).populate({
    path: 'customerId',
    populate: {
      path: 'userId',
      select: 'firstName lastName email phone',
    },
  });
  return subscriptions;
};

export const vendorDashboardService = async (
  userId: string,
  filter: string,
) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const end = new Date();
  const start = new Date();

  if (filter === 'week') {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }

  start.setHours(0, 0, 0, 0);

  const PLATFORM_FEE_PERCENT = 10;

  const dashboard = await Order.aggregate([
    {
      $match: {
        vendorId: vendor._id,
        date: { $gte: start, $lte: end },
      },
    },

    {
      $facet: {
        // 🔹 1. Total Tiffins Sold
        totalTiffins: [
          { $unwind: '$tiers' },
          {
            $group: {
              _id: null,
              total: { $sum: '$tiers.quantity' },
            },
          },
        ],

        // 🔹 2. Revenue
        totalRevenue: [
          {
            $group: {
              _id: null,
              total: { $sum: '$totalAmount' },
            },
          },
        ],

        // 🔹 3. Customer-wise sales
        customerStats: [
          {
            $group: {
              _id: '$customerId',
              totalSpent: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
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
          { $unwind: '$customer' },

          {
            $lookup: {
              from: 'users',
              localField: 'customer.userId',
              foreignField: '_id',
              as: 'user',
            },
          },
          { $unwind: '$user' },

          {
            $project: {
              customerId: '$_id',
              name: {
                $concat: ['$user.firstName', ' ', '$user.lastName'],
              },
              totalSpent: 1,
              orders: 1,
              _id: 0,
            },
          },
        ],

        // 🔹 4. Monthly Payslip
        monthlyPayslip: [
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
              },
              revenue: { $sum: '$totalAmount' },
            },
          },
          {
            $project: {
              year: '$_id.year',
              month: '$_id.month',
              revenue: 1,
              platformFee: {
                $multiply: ['$revenue', PLATFORM_FEE_PERCENT / 100],
              },
              netEarnings: {
                $subtract: [
                  '$revenue',
                  {
                    $multiply: ['$revenue', PLATFORM_FEE_PERCENT / 100],
                  },
                ],
              },
              _id: 0,
            },
          },
          { $sort: { year: -1, month: -1 } },
        ],
      },
    },
  ]);

  const result = dashboard[0];

  const totalRevenue = result.totalRevenue[0]?.total || 0;
  const totalTiffins = result.totalTiffins[0]?.total || 0;

  const platformFee = (totalRevenue * PLATFORM_FEE_PERCENT) / 100;
  const netEarnings = totalRevenue - platformFee;

  return {
    totalTiffins,
    totalRevenue,
    platformFee,
    netEarnings,
    customerStats: result.customerStats || [],
    monthlyPayslip: result.monthlyPayslip || [],
  };
};
