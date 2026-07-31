import mongoose from 'mongoose';
import { IAddOn, ITier, MenuItem } from '../models/MenuItem.model';
import { User } from '../models/User.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { getTodayUTC } from '../utils/getTodayUTC';
import { getCurrentSession } from '../utils/session';
import { Subscription } from '../models/Subscription.model';
import { Order } from '../models/Order.model';
import { DuePayment } from '../models/DuePayment.model';
import { createNotification } from '../utils/notification';
import { Customer } from '../models/Customer.model';
import { Notification } from '../models/Notification.model';
import { sendRealtimeNotification } from '../socket/socketManager';
import { Connection } from '../models/Connection.model';

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

  let menuItem;

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
    menuItem = existing;
  } else {
    const tiersWithRemaining = tiers.map((tier) => ({
      ...tier,
      remainingQuantity: tier.maxQuantity,
    }));

    menuItem = await MenuItem.create({
      vendorId: vendor._id,
      session,
      tiers: tiersWithRemaining,
      addOns: addOns || [],
      description,
      date: today,
      isExpired: false,
    });
  }

  // Find all customers who have an active (status: 'accepted') connection with this vendor
  const connections = await Connection.find({
    vendorId: vendor._id,
    status: 'accepted',
  });

  const customerIds = connections.map((conn) => conn.customerId);
  const customers = await Customer.find({
    _id: { $in: customerIds },
  }).select('userId');

  const notifications = customers.map((customer) => ({
    userId: customer.userId,
    title: `Menu uploaded by ${vendor.businessName}`,
    message: `${vendor.businessName} uploaded menu for ${session}. Order fast.`,
    type: 'menu',
    data: {
      menuId: menuItem._id,
      vendorId: menuItem.vendorId,
      tiers,
    },
  }));

  const insertedNotifications = await Notification.insertMany(notifications);
  insertedNotifications.forEach((notif) => {
    sendRealtimeNotification(notif.userId.toString(), notif);
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

  // 1. Fetch Order Stats
  const orderStats = await Order.aggregate([
    {
      $match: {
        vendorId: vendor._id,
        status: { $in: ['accepted', 'delivered', 'received'] },
        date: { $gte: start, $lte: end },
      },
    },
    {
      $facet: {
        totalTiffins: [
          { $unwind: '$tiers' },
          {
            $group: {
              _id: null,
              total: { $sum: '$tiers.quantity' },
            },
          },
        ],
        totalRevenue: [
          {
            $match: { paymentMethod: { $ne: 'payLater' } },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$totalAmount' },
            },
          },
        ],
        customerStats: [
          {
            $group: {
              _id: '$customerId',
              totalSpent: {
                $sum: {
                  $cond: [
                    { $eq: ['$paymentMethod', 'payLater'] },
                    0,
                    '$totalAmount',
                  ],
                },
              },
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
        monthlyPayslip: [
          {
            $group: {
              _id: {
                year: { $year: '$date' },
                month: { $month: '$date' },
              },
              revenue: {
                $sum: {
                  $cond: [
                    { $eq: ['$paymentMethod', 'payLater'] },
                    0,
                    '$totalAmount',
                  ],
                },
              },
            },
          },
          {
            $project: {
              year: '$_id.year',
              month: '$_id.month',
              revenue: 1,
              _id: 0,
            },
          },
        ],
      },
    },
  ]);

  // 2. Fetch Subscription Stats
  const subscriptionStats = await Subscription.aggregate([
    {
      $match: {
        vendorId: vendor._id,
        purchaseDate: { $gte: start, $lte: end },
      },
    },
    {
      $facet: {
        totalRevenue: [
          {
            $group: {
              _id: null,
              total: { $sum: '$pricePaid' },
            },
          },
        ],
        customerStats: [
          {
            $group: {
              _id: '$customerId',
              totalSpent: { $sum: '$pricePaid' },
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
              orders: { $literal: 0 },
              _id: 0,
            },
          },
        ],
        monthlyPayslip: [
          {
            $group: {
              _id: {
                year: { $year: '$purchaseDate' },
                month: { $month: '$purchaseDate' },
              },
              revenue: { $sum: '$pricePaid' },
            },
          },
          {
            $project: {
              year: '$_id.year',
              month: '$_id.month',
              revenue: 1,
              _id: 0,
            },
          },
        ],
      },
    },
  ]);

  // 3. Fetch Due Payment Stats
  const duePaymentStats = await DuePayment.aggregate([
    {
      $match: {
        vendorId: vendor._id,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $facet: {
        totalRevenue: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ],
        customerStats: [
          {
            $group: {
              _id: '$customerId',
              totalSpent: { $sum: '$amount' },
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
              orders: { $literal: 0 },
              _id: 0,
            },
          },
        ],
        monthlyPayslip: [
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' },
              },
              revenue: { $sum: '$amount' },
            },
          },
          {
            $project: {
              year: '$_id.year',
              month: '$_id.month',
              revenue: 1,
              _id: 0,
            },
          },
        ],
      },
    },
  ]);

  const orderRes = orderStats[0];
  const subRes = subscriptionStats[0];
  const dueRes = duePaymentStats[0];

  const orderRev = orderRes.totalRevenue[0]?.total || 0;
  const subRev = subRes.totalRevenue[0]?.total || 0;
  const dueRev = dueRes.totalRevenue[0]?.total || 0;

  const totalRevenue = orderRev + subRev + dueRev;
  const totalTiffins = orderRes.totalTiffins[0]?.total || 0;

  const platformFee = (totalRevenue * PLATFORM_FEE_PERCENT) / 100;
  const netEarnings = totalRevenue - platformFee;

  // Merge Customer Stats
  const customerMap = new Map<
    string,
    { customerId: any; name: string; totalSpent: number; orders: number }
  >();

  const addCustomerStats = (stats: any[]) => {
    for (const item of stats) {
      if (!item.customerId) continue;
      const key = item.customerId.toString();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          customerId: item.customerId,
          name: item.name,
          totalSpent: item.totalSpent || 0,
          orders: item.orders || 0,
        });
      } else {
        const exist = customerMap.get(key)!;
        exist.totalSpent += item.totalSpent || 0;
        exist.orders += item.orders || 0;
      }
    }
  };

  addCustomerStats(orderRes.customerStats || []);
  addCustomerStats(subRes.customerStats || []);
  addCustomerStats(dueRes.customerStats || []);

  const customerStats = Array.from(customerMap.values());

  // Merge Monthly Payslips
  const payslipMap = new Map<
    string,
    { year: number; month: number; revenue: number }
  >();

  const addPayslipStats = (slips: any[]) => {
    for (const slip of slips) {
      if (!slip.year || !slip.month) continue;
      const key = `${slip.year}-${slip.month}`;
      if (!payslipMap.has(key)) {
        payslipMap.set(key, {
          year: slip.year,
          month: slip.month,
          revenue: slip.revenue || 0,
        });
      } else {
        payslipMap.get(key)!.revenue += slip.revenue || 0;
      }
    }
  };

  addPayslipStats(orderRes.monthlyPayslip || []);
  addPayslipStats(subRes.monthlyPayslip || []);
  addPayslipStats(dueRes.monthlyPayslip || []);

  const monthlyPayslip = Array.from(payslipMap.values())
    .map((slip) => {
      const revenue = slip.revenue;
      const platformFee = (revenue * PLATFORM_FEE_PERCENT) / 100;
      const netEarnings = revenue - platformFee;
      return {
        year: slip.year,
        month: slip.month,
        revenue,
        platformFee,
        netEarnings,
      };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);

  return {
    totalTiffins,
    totalRevenue,
    platformFee,
    netEarnings,
    customerStats,
    monthlyPayslip,
  };
};

export const vendorHistoryService = async (userId: string) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new ApiError(404, 'Vendor not found');

  const orders = await Order.aggregate([
    {
      $match: {
        vendorId: vendor._id,
      },
    },
    {
      $lookup: {
        from: 'customers',
        localField: 'customerId',
        foreignField: '_id',
        as: 'customer',
      },
    },
    {
      $unwind: {
        path: '$customer',
        preserveNullAndEmptyArrays: true,
      },
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
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        date: 1,
        customer: {
          _id: '$customer._id',
          firstName: '$user.firstName',
          lastName: '$user.lastName',
        },
        totalAmount: 1,
        session: 1,
        status: 1,
        profile: {
          $ifNull: [{ $arrayElemAt: ['$forProfiles', 0] }, 'N/A'],
        },
        items: {
          $concatArrays: [
            {
              $map: {
                input: { $ifNull: ['$tiers', []] },
                as: 't',
                in: {
                  type: 'tier',
                  name: '$$t.tierName',
                  quantity: '$$t.quantity',
                  price: '$$t.pricePerUnit',
                },
              },
            },
            {
              $map: {
                input: { $ifNull: ['$addOns', []] },
                as: 'a',
                in: {
                  type: 'addon',
                  name: '$$a.addOnName',
                  quantity: '$$a.quantity',
                  price: '$$a.pricePerUnit',
                },
              },
            },
          ],
        },
      },
    },
    {
      $group: {
        _id: {
          date: '$date',
          customerId: '$customer._id',
        },
        customer: { $first: '$customer' },
        orders: {
          $push: {
            session: '$session',
            status: '$status',
            totalAmount: '$totalAmount',
            profile: '$profile',
            items: '$items',
          },
        },
        totalRevenue: { $sum: '$totalAmount' },
      },
    },
    {
      $sort: { '_id.date': -1 },
    },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        customer: 1,
        totalRevenue: 1,
        orders: 1,
      },
    },
  ]);

  return orders;
};
