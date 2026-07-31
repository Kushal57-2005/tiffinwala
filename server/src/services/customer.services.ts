import mongoose from 'mongoose';
import { Customer } from '../models/Customer.model';
import { MenuItem } from '../models/MenuItem.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { getTodayUTC } from '../utils/getTodayUTC';
import { getCurrentSession } from '../utils/session';
import { Order } from '../models/Order.model';
import { Subscription } from '../models/Subscription.model';
import { DuePayment } from '../models/DuePayment.model';

export const getNearbyVendorService = async (userId: string) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const [lng = 0, lat = 0] = customer.location.coordinates || [];

  if (lng === 0 && lat === 0) {
    throw new ApiError(400, 'Please set your location first');
  }

  const today = getTodayUTC();
  const session = getCurrentSession();

  const vendors = await Vendor.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [lng, lat] },
        distanceField: 'distanceInMeters',
        spherical: true,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'userInfo',
      },
    },
    {
      $unwind: '$userInfo',
    },
    // Join today's menu for the current session
    {
      $lookup: {
        from: 'menuitems',
        let: { vendorId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$vendorId', '$$vendorId'] },
              session,
              date: today,
              isExpired: false,
            },
          },
          { $limit: 1 },
        ],
        as: 'todayMenu',
      },
    },
    {
      $addFields: {
        tiers: {
          $ifNull: [{ $arrayElemAt: ['$todayMenu.tiers', 0] }, []],
        },
        addOns: {
          $ifNull: [{ $arrayElemAt: ['$todayMenu.addOns', 0] }, []],
        },
        description: {
          $ifNull: [{ $arrayElemAt: ['$todayMenu.description', 0] }, ''],
        },
      },
    },
    {
      $project: {
        businessName: 1,
        isOpen: 1,
        averageRating: 1,
        totalRatings: 1,
        deliveryRadiuskm: 1,
        location: 1,
        distanceInMeters: 1,
        'userInfo.firstName': 1,
        'userInfo.lastName': 1,
        'userInfo.phone': 1,
        tiers: 1,
        addOns: 1,
        description: 1,
      },
    },
  ]);

  const nearbyVendors = vendors.filter((vendor) => {
    const distanceInKm = vendor.distanceInMeters / 1000;
    return distanceInKm <= vendor.deliveryRadiuskm;
  });

  return nearbyVendors;
};

export const updateCustomerLocationService = async (
  userId: string,
  address: string | undefined,
  coordinates: [number, number],
) => {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    throw new ApiError(400, 'Valid coordinates are required');
  }

  const [lat, lng] = coordinates.map(Number);
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    (lat === 0 && lng === 0)
  ) {
    throw new ApiError(400, 'Please choose a valid location');
  }

  const updateData: Record<string, any> = {
    'location.type': 'Point',
    'location.coordinates': [lng, lat],
  };

  if (address && address.trim()) {
    updateData['location.address'] = address.trim();
  }

  const customer = await Customer.findOneAndUpdate(
    { userId },
    { $set: updateData },
    { new: true, runValidators: true },
  )
    .populate('userId', 'firstName lastName email phone')
    .populate('myVendors', 'businessName isOpen averageRating totalRatings');

  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  return customer;
};

export const searchVendorsService = async (query: string) => {
  if (!query || query.trim().length === 0) {
    throw new ApiError(400, 'Search query is required');
  }

  const vendors = await Vendor.find({
    $or: [
      { businessName: { $regex: query, $options: 'i' } },
      { 'location.address': { $regex: query, $options: 'i' } },
    ],
  }).populate('userId', 'firstName lastName phone');

  return vendors;
};

export const getCustomerProfileService = async (userId: string) => {
  const customer = await Customer.findOne({ userId })
    .populate('userId', 'firstName lastName email phone')
    .populate('myVendors', 'businessName isOpen averageRating totalRatings');
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  return customer;
};

export const updateCustomerProfileService = async (
  userId: string,
  firstname?: string,
  lastname?: string,
  email?: string,
  phone?: string,
  address?: string,
  coordinates?: [number, number],
) => {
  // Build User update payload
  const userUpdateData: Record<string, any> = {};
  if (firstname) userUpdateData.firstName = firstname;
  if (lastname) userUpdateData.lastName = lastname;
  if (email) userUpdateData.email = email;
  if (phone) userUpdateData.phone = phone;

  if (Object.keys(userUpdateData).length > 0) {
    const updatedUser = await (
      await import('../models/User.model')
    ).User.findByIdAndUpdate(
      userId,
      { $set: userUpdateData },
      { new: true, runValidators: true },
    );
    if (!updatedUser) throw new ApiError(404, 'User not found');
  }

  // Build Customer update payload
  const customerUpdateData: Record<string, any> = {};
  if (address && address.trim()) {
    customerUpdateData['location.address'] = address.trim();
  }
  if (
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    !(coordinates[0] === 0 && coordinates[1] === 0)
  ) {
    customerUpdateData['location.type'] = 'Point';
    // coordinates expected as [lng, lat] (GeoJSON order)
    customerUpdateData['location.coordinates'] = coordinates;
  }

  const customer = await Customer.findOneAndUpdate(
    { userId },
    { $set: customerUpdateData },
    { new: true, runValidators: true },
  )
    .populate('userId', 'firstName lastName email phone')
    .populate('myVendors', 'businessName isOpen averageRating totalRatings');

  if (!customer) throw new ApiError(404, 'Customer not found');

  return customer;
};

export const addFriendProfileService = async (
  userId: string,
  name: string,
  phone?: string,
  nickname?: string,
) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  customer.friendProfiles.push({ name, phone, nickname });
  await customer.save();

  return customer.friendProfiles;
};

export const editFriendProfileService = async (
  userId: string,
  friendId: string,
  name?: string,
  phone?: string,
  nickname?: string,
) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const friend = customer.friendProfiles.id(friendId);
  if (!friend) throw new ApiError(404, 'Friend profile not found');

  if (name) friend.name = name;
  if (phone !== undefined) friend.phone = phone;
  if (nickname !== undefined) friend.nickname = nickname;

  await customer.save();
  return customer.friendProfiles;
};

export const removeFriendProfileService = async (
  userId: string,
  friendId: string,
) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const friend = customer.friendProfiles.id(friendId);
  if (!friend) throw new ApiError(404, 'Friend profile not found');

  friend.deleteOne();
  await customer.save();

  return customer.friendProfiles;
};

export const getFriendProfilesService = async (userId: string) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  return customer.friendProfiles;
};

export const getVendorPublicDetailsService = async (vendorId: string) => {
  if (!mongoose.Types.ObjectId.isValid(vendorId)) {
    throw new ApiError(400, 'Invalid vendor ID');
  }

  const vendor = await Vendor.findById(vendorId).populate(
    'userId',
    'firstName lastName phone',
  );

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  const today = getTodayUTC();
  const session = getCurrentSession();

  const todayMenu = await MenuItem.findOne({
    vendorId: vendor._id,
    date: today,
    session,
    isExpired: false,
  });

  const owner = vendor.userId as unknown as {
    firstName: string;
    lastName: string;
    phone: string;
  };

  return {
    _id: vendor._id,
    businessName: vendor.businessName,
    isOpen: vendor.isOpen,
    averageRating: vendor.averageRating,
    totalRatings: vendor.totalRatings,
    deliveryRadiuskm: vendor.deliveryRadiuskm,
    location: vendor.location,
    owner: {
      firstName: owner.firstName,
      lastName: owner.lastName,
      phone: owner.phone,
    },
    todayMenu: todayMenu || null,
  };
};

export const getOrderForCustomerService = async (userId: string) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }

  const start = getTodayUTC();
  const end = new Date();
  end.setUTCHours(23, 59, 59, 999);

  const orders = await Order.aggregate([
    {
      $match: {
        customerId: customer._id,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor',
      },
    },
    { $unwind: '$vendor' },
    {
      $project: {
        _id: 1,
        vendorId: 1,
        businessName: '$vendor.businessName',
        session: 1,
        tiers: 1,
        addOns: 1,
        status: 1,
        totalAmount: 1,
        paymentMethod: 1,
        forProfiles: 1,
        orderTime: '$createdAt',
      },
    },
    {
      $sort: { orderTime: -1 },
    },
  ]);

  return orders;
};

export const customerDashboardService = async (
  userId: string,
  filter: string,
) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const end = new Date();
  const start = new Date();

  if (filter === 'week') {
    start.setDate(start.getDate() - 7);
  } else {
    start.setDate(start.getDate() - 30);
  }

  start.setHours(0, 0, 0, 0);

  // 1. Fetch Order Stats
  const orderStats = await Order.aggregate([
    {
      $match: {
        customerId: customer._id,
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
        totalAmount: [
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
        vendorStats: [
          {
            $group: {
              _id: '$vendorId',
              totalAmount: {
                $sum: {
                  $cond: [
                    { $eq: ['$paymentMethod', 'payLater'] },
                    0,
                    '$totalAmount',
                  ],
                },
              },
              tiers: { $push: '$tiers' },
            },
          },
          { $unwind: '$tiers' },
          { $unwind: '$tiers' },
          {
            $group: {
              _id: '$_id',
              totalAmount: { $first: '$totalAmount' },
              totalTiffins: { $sum: '$tiers.quantity' },
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
              vendorId: '$_id',
              vendorName: '$vendor.businessName',
              totalAmount: 1,
              totalTiffins: 1,
              _id: 0,
            },
          },
        ],
        profileStats: [
          {
            $project: {
              items: { $concatArrays: ['$tiers', '$addOns'] },
              paymentMethod: 1,
            },
          },
          { $unwind: '$items' },
          {
            $match: {
              'items.forProfile': { $ne: null },
            },
          },
          {
            $group: {
              _id: '$items.forProfile',
              totalQuantity: { $sum: '$items.quantity' },
              totalAmount: {
                $sum: {
                  $cond: [
                    { $eq: ['$paymentMethod', 'payLater'] },
                    0,
                    { $multiply: ['$items.quantity', '$items.pricePerUnit'] },
                  ],
                },
              },
            },
          },
          {
            $project: {
              profile: '$_id',
              totalQuantity: 1,
              totalAmount: 1,
              _id: 0,
            },
          },
        ],
        dailyBreakdown: [
          {
            $lookup: {
              from: 'vendors',
              localField: 'vendorId',
              foreignField: '_id',
              as: 'vendor',
            },
          },
          { $unwind: '$vendor' },
          {
            $project: {
              date: 1,
              vendorName: '$vendor.businessName',
              tiers: {
                $map: {
                  input: '$tiers',
                  as: 't',
                  in: {
                    name: '$$t.tierName',
                    quantity: '$$t.quantity',
                    profile: '$$t.forProfile',
                  },
                },
              },
              addOns: {
                $map: {
                  input: '$addOns',
                  as: 'a',
                  in: {
                    name: '$$a.addOnName',
                    quantity: '$$a.quantity',
                    profile: '$$a.forProfile',
                  },
                },
              },
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
        customerId: customer._id,
        purchaseDate: { $gte: start, $lte: end },
      },
    },
    {
      $facet: {
        totalAmount: [
          {
            $group: {
              _id: null,
              total: { $sum: '$pricePaid' },
            },
          },
        ],
        vendorStats: [
          {
            $group: {
              _id: '$vendorId',
              totalAmount: { $sum: '$pricePaid' },
              totalTiffins: { $sum: 0 },
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
              vendorId: '$_id',
              vendorName: '$vendor.businessName',
              totalAmount: 1,
              totalTiffins: 1,
              _id: 0,
            },
          },
        ],
        dailyBreakdown: [
          {
            $lookup: {
              from: 'vendors',
              localField: 'vendorId',
              foreignField: '_id',
              as: 'vendor',
            },
          },
          { $unwind: '$vendor' },
          {
            $project: {
              date: '$purchaseDate',
              vendorName: '$vendor.businessName',
              tiers: [
                {
                  name: { $concat: ['Subscription: ', '$planName'] },
                  quantity: 1,
                  profile: 'Myself',
                },
              ],
              addOns: [],
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
        customerId: customer._id,
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $facet: {
        totalAmount: [
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
            },
          },
        ],
        vendorStats: [
          {
            $group: {
              _id: '$vendorId',
              totalAmount: { $sum: '$amount' },
              totalTiffins: { $sum: 0 },
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
              vendorId: '$_id',
              vendorName: '$vendor.businessName',
              totalAmount: 1,
              totalTiffins: 1,
              _id: 0,
            },
          },
        ],
        dailyBreakdown: [
          {
            $lookup: {
              from: 'vendors',
              localField: 'vendorId',
              foreignField: '_id',
              as: 'vendor',
            },
          },
          { $unwind: '$vendor' },
          {
            $project: {
              date: '$createdAt',
              vendorName: '$vendor.businessName',
              tiers: [
                {
                  name: 'Cleared Pending Dues',
                  quantity: 1,
                  profile: 'Myself',
                },
              ],
              addOns: [],
            },
          },
        ],
      },
    },
  ]);

  const orderRes = orderStats[0];
  const subRes = subscriptionStats[0];
  const dueRes = duePaymentStats[0];

  const orderAmt = orderRes.totalAmount[0]?.total || 0;
  const subAmt = subRes.totalAmount[0]?.total || 0;
  const dueAmt = dueRes.totalAmount[0]?.total || 0;

  const totalAmount = orderAmt + subAmt + dueAmt;
  const totalTiffins = orderRes.totalTiffins[0]?.total || 0;

  // Merge Vendor Stats
  const vendorMap = new Map<
    string,
    { vendorId: any; vendorName: string; totalAmount: number; totalTiffins: number }
  >();

  const addVendorStats = (stats: any[]) => {
    for (const item of stats) {
      if (!item.vendorId) continue;
      const key = item.vendorId.toString();
      if (!vendorMap.has(key)) {
        vendorMap.set(key, {
          vendorId: item.vendorId,
          vendorName: item.vendorName,
          totalAmount: item.totalAmount || 0,
          totalTiffins: item.totalTiffins || 0,
        });
      } else {
        const exist = vendorMap.get(key)!;
        exist.totalAmount += item.totalAmount || 0;
        exist.totalTiffins += item.totalTiffins || 0;
      }
    }
  };

  addVendorStats(orderRes.vendorStats || []);
  addVendorStats(subRes.vendorStats || []);
  addVendorStats(dueRes.vendorStats || []);

  const vendorStats = Array.from(vendorMap.values());

  // Merge Profile Stats
  const profileMap = new Map<
    string,
    { profile: string; totalQuantity: number; totalAmount: number }
  >();

  for (const item of orderRes.profileStats || []) {
    profileMap.set(item.profile, {
      profile: item.profile,
      totalQuantity: item.totalQuantity || 0,
      totalAmount: item.totalAmount || 0,
    });
  }

  if (subAmt > 0) {
    const exist = profileMap.get('Myself') || {
      profile: 'Myself',
      totalQuantity: 0,
      totalAmount: 0,
    };
    exist.totalAmount += subAmt;
    profileMap.set('Myself', exist);
  }

  if (dueAmt > 0) {
    const exist = profileMap.get('Myself') || {
      profile: 'Myself',
      totalQuantity: 0,
      totalAmount: 0,
    };
    exist.totalAmount += dueAmt;
    profileMap.set('Myself', exist);
  }

  const profileStats = Array.from(profileMap.values());

  // Merge and Sort Daily Breakdown
  const dailyBreakdown = [
    ...(orderRes.dailyBreakdown || []),
    ...(subRes.dailyBreakdown || []),
    ...(dueRes.dailyBreakdown || []),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    totalTiffins,
    totalAmount,
    vendorStats,
    profileStats,
    dailyBreakdown,
  };
};

export const customerHistoryService = async (userId: string) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const orders = await Order.aggregate([
    {
      $match: {
        customerId: customer._id,
      },
    },
    {
      $lookup: {
        from: 'vendors',
        localField: 'vendorId',
        foreignField: '_id',
        as: 'vendor',
      },
    },
    {
      $unwind: {
        path: '$vendor',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        date: 1,
        vendorName: '$vendor.businessName',
        totalAmount: 1,
        session: 1,
        status: 1,
        profile: { $ifNull: [{ $arrayElemAt: ['$forProfiles', 0] }, 'N/A'] },

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
          vendorId: '$vendorName',
        },
        orders: {
          $push: {
            session: '$session',
            status: '$status',
            totalAmount: '$totalAmount',
            profile: '$profile',
            items: '$items',
          },
        },
        totalSpent: { $sum: '$totalAmount' },
      },
    },
    {
      $sort: { '_id.date': -1 },
    },
    {
      $project: {
        _id: 0,
        date: '$_id.date',
        vendorName: '$_id.vendorId',
        totalSpent: 1,
        orders: 1,
      },
    },
  ]);

  return orders;
};
