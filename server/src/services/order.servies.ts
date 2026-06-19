import mongoose from 'mongoose';
import { Customer } from '../models/Customer.model';
import { MenuItem } from '../models/MenuItem.model';
import { Order } from '../models/Order.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { getTodayUTC } from '../utils/getTodayUTC';
import { getCurrentSession } from '../utils/session';

interface PlaceOrderInput {
  userId: string;
  vendorId: string;
  tiers: { tierName: string; quantity: number }[];
  addOns?: { addOnName: string; quantity: number }[];
  forProfiles?: string[];
  note?: string;
  paymentMethod?: 'wallet';
}

export const placeOrderService = async (input: PlaceOrderInput) => {
  const { userId, vendorId, tiers, addOns, forProfiles, note, paymentMethod } =
    input;

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

  const orderTiers: {
    tierName: string;
    quantity: number;
    pricePerUnit: number;
  }[] = [];

  for (const orderedTier of tiers) {
    const menuTier = todaysMenu.tiers.find(
      (t) => t.name === orderedTier.tierName,
    );

    if (!menuTier) {
      throw new ApiError(
        400,
        `Tier "${orderedTier.tierName}" not found in today's menu`,
      );
    }

    if (menuTier.remainingQuantity < orderedTier.quantity) {
      throw new ApiError(
        400,
        `Not enough stock for "${orderedTier.tierName}". Only ${menuTier.remainingQuantity} left`,
      );
    }

    orderTiers.push({
      tierName: orderedTier.tierName,
      quantity: orderedTier.quantity,
      pricePerUnit: menuTier.price,
    });
  }

  const orderAddOns: {
    addOnName: string;
    quantity: number;
    pricePerUnit: number;
  }[] = [];

  if (addOns) {
    for (const orderedAddOn of addOns) {
      const menuAddOn = todaysMenu.addOns.find(
        (a) => a.name === orderedAddOn.addOnName,
      );

      if (!menuAddOn) {
        throw new ApiError(
          400,
          `Add-on "${orderedAddOn.addOnName}" not found in today's menu`,
        );
      }

      orderAddOns.push({
        addOnName: orderedAddOn.addOnName,
        quantity: orderedAddOn.quantity,
        pricePerUnit: menuAddOn.price,
      });
    }
  }

  const tiersTotal = orderTiers.reduce(
    (sum, t) => sum + t.pricePerUnit * t.quantity,
    0,
  );

  const addOnsTotal = orderAddOns.reduce(
    (sum, a) => sum + a.pricePerUnit * a.quantity,
    0,
  );

  const totalAmount = tiersTotal + addOnsTotal;

  if (paymentMethod === 'wallet') {
    if (customer.walletBalance < totalAmount) {
      throw new ApiError(
        400,
        `Insufficient wallet balance. Required: ₹${totalAmount}, Available: ₹${customer.walletBalance}`,
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
    forProfiles,
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

    for (const orderedTier of order.tiers) {
      const menuTier = menu.tiers.find((t) => t.name === orderedTier.tierName);

      if (!menuTier) {
        throw new ApiError(
          400,
          `Tier "${orderedTier.tierName}" no longer exists`,
        );
      }
      if (menuTier.remainingQuantity < orderedTier.quantity) {
        throw new ApiError(
          400,
          `Not enough stock for "${orderedTier.tierName}". Only ${menuTier.remainingQuantity} left — reject this order`,
        );
      }

      menuTier.remainingQuantity -= orderedTier.quantity;
    }
    await menu.save({ session });

    // Deduct wallet
    const customer = await Customer.findById(order.customerId).session(session);
    if (!customer) throw new ApiError(404, 'Customer not found');

    if (order.paymentMethod === 'wallet') {
      if (customer.walletBalance < order.totalAmount) {
        throw new ApiError(400, `Insufficient wallet balance`);
      }
      customer.walletBalance -= order.totalAmount;
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

  order.status = 'rejected';
  await order.save();
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

    vendor.walletBalance += order.totalAmount;
    await vendor.save({ session });

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
