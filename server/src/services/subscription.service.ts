import mongoose from 'mongoose';
import { Customer } from '../models/Customer.model';
import { Subscription } from '../models/Subscription.model';
import { SubscriptionPlan } from '../models/SubscriptionPlan.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { getTodayUTC } from '../utils/getTodayUTC';
import { getCurrentSession } from '../utils/session';
import { MenuItem } from '../models/MenuItem.model';

export const createSubscriptionPlanService = async (
  userId: string,
  name: string,
  totalTokens: number,
  price: number,
) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new ApiError(404, 'Vendor Not Found');

  const subscription = await SubscriptionPlan.create({
    vendorId: vendor._id,
    name: name,
    totalTokens: totalTokens,
    price: price,
    isActive: true,
  });

  return subscription;
};

export const getSubscriptionsForVendorService = async (userId: string) => {
  const vendor = await Vendor.findOne({ userId });
  if (!vendor) throw new ApiError(404, 'Vendor Not Found');

  const subscription = await SubscriptionPlan.find({ vendorId: vendor._id });
  return subscription;
};

export const getSubscriptionsPlansForCustomersService = async (
  vendorId: string,
) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new ApiError(404, 'Vendor Not Found');

  const subscription = await SubscriptionPlan.find({ vendorId: vendor._id });
  return subscription;
};

export const buyPlansService = async (
  userId: string,
  subscriptionPlanId: string,
) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const subscriptionPlan =
      await SubscriptionPlan.findById(subscriptionPlanId).session(session);
    if (!subscriptionPlan) throw new ApiError(404, 'Plan not found');

    const customer = await Customer.findOne({ userId }).session(session);
    if (!customer) throw new ApiError(404, 'Customer not found');

    if (customer.walletBalance < subscriptionPlan.price) {
      throw new ApiError(
        400,
        `Insufficient balance. Add at least ₹${subscriptionPlan.price - customer.walletBalance}`,
      );
    }

    const vendor = await Vendor.findById(subscriptionPlan.vendorId).session(
      session,
    );
    if (!vendor) throw new ApiError(404, 'Vendor not found');

    customer.walletBalance -= subscriptionPlan.price;
    vendor.walletBalance += subscriptionPlan.price;

    await customer.save({ session });
    await vendor.save({ session });

    const today = getTodayUTC();

    const expiryDate = new Date(today);
    expiryDate.setDate(today.getDate() + subscriptionPlan.totalTokens * 2);

    const subscription = await Subscription.create(
      [
        {
          customerId: customer._id,
          vendorId: subscriptionPlan.vendorId,
          planId: subscriptionPlan._id,
          planName: subscriptionPlan.name,
          totalTokens: subscriptionPlan.totalTokens,
          remainingTokens: subscriptionPlan.totalTokens,
          pricePaid: subscriptionPlan.price,
          purchaseDate: today,
          expiryDate,
          status: 'active',
        },
      ],
      { session },
    );

    await session.commitTransaction();

    return subscription[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const getPlansService = async (userId: string) => {
  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  const subscriptions = await Subscription.find({
    customerId: customer._id,
  }).populate('vendorId', 'businessName');
  return subscriptions;
};
