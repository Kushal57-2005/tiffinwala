import { razorpay } from '../config/rozorpay';
import { ApiError } from '../utils/api-error';
import { User } from '../models/User.model';
import { Vendor } from '../models/Vendor.model';
import crypto from 'crypto';
import { Customer } from '../models/Customer.model';
import mongoose from 'mongoose';
import { Order } from '../models/Order.model';
import { MonthlyBill } from '../models/MonthlyBill.model';

export const createVendorPaymentOrderService = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user || user.role !== 'vendor') {
    throw new ApiError(404, 'Vendor not found');
  }

  if (!user.isPhoneVerified || !user.isEmailVerified) {
    throw new ApiError(400, 'Please verify phone and email first');
  }

  const vendor = await Vendor.findOne({ userId });
  if (!vendor) {
    throw new ApiError(404, 'Vendor profile not found');
  }

  if (vendor.isPaymentDone) {
    throw new ApiError(400, 'Registration fee already paid');
  }

  const order = await razorpay.orders.create({
    amount: 9999 * 100,
    currency: 'INR',
    receipt: `vendor_reg_${userId}`,
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.RAZORPAY_KEY_ID,
  };
};

export const verifyVendorPaymentService = async (
  userId: string,
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
) => {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, 'Payment verification failed');
  }

  const vendor = await Vendor.findOneAndUpdate(
    { userId },
    { platformBalance: 9999, isPaymentDone: true },
    { new: true },
  );

  if (!vendor) {
    throw new ApiError(404, 'Vendor not found');
  }

  return { message: 'Payment successful, account activated' };
};

export const addMoneyToWalletService = async (
  userId: string,
  amount: number,
) => {
  console.log('KEY_ID:', process.env.RAZORPAY_KEY_ID);
  console.log('KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET);
  console.log('SERVICE HIT:', { userId, amount });
  if (amount < 10) {
    throw new ApiError(400, 'Amount must be more than ₹10');
  }

  const customer = await Customer.findOne({ userId });
  if (!customer) {
    throw new ApiError(404, 'Customer not found');
  }
  console.log('Creating Razorpay order with:', {
    amount: amount * 100,
    currency: 'INR',
  });
  try {
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: 'INR',
      receipt: `wallet_${Date.now()}`,
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  } catch (err) {
    console.error('RAZORPAY ERROR:', err);
    throw err;
  }
};

export const verifyaddMoneyToWalletService = async (
  userId: string,
  amount: number,
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string,
) => {
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET as string)
    .update(body)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    throw new ApiError(400, 'Payment verification failed');
  }

  const customer = await Customer.findOne({ userId });
  if (!customer) throw new ApiError(404, 'Customer not found');

  customer.walletBalance += amount;
  await customer.save();

  return {
    message: `₹${amount} added to wallet`,
    walletBalance: customer.walletBalance,
  };
};

export const deductMyCutService = async (userId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const vendor = await Vendor.findOne({ userId }).session(session);
    if (!vendor) throw new ApiError(404, 'Vendor not found');

    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const now = new Date();
    const billMonth = now.getMonth() + 1; 
    const billYear = now.getFullYear();

    const existingBill = await MonthlyBill.findOne({
      vendorId: vendor._id,
      month: billMonth,
      year: billYear,
    }).session(session);

    if (existingBill) {
      await session.abortTransaction();
      session.endSession();
      return { message: 'Bill already generated for this month' };
    }

    const totalAmResult = await Order.aggregate([
      {
        $match: {
          vendorId: vendor._id,
          status: { $in: ['accepted', 'delivered', 'received'] },
          date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' },
        },
      },
    ]).session(session);

    const totalRevenue = totalAmResult?.[0]?.total ?? 0;

    if (totalRevenue === 0) {
      await session.abortTransaction();
      session.endSession();
      return { message: 'No revenue this month — no fee deducted' };
    }

    const platformFee = Math.round(totalRevenue * 0.1);

    let deductedFromPlatformBalance = 0;
    let deductedFromWallet = 0;
    let status: 'paid' | 'partial' | 'failed' = 'paid';

    if (vendor.platformBalance >= platformFee) {
      vendor.platformBalance -= platformFee;
      deductedFromPlatformBalance = platformFee;
    } else {
      // platformBalance partially covers — remainder from wallet
      deductedFromPlatformBalance = vendor.platformBalance;
      const remainingPay = platformFee - vendor.platformBalance;
      vendor.platformBalance = 0;

      vendor.walletBalance -= remainingPay;
      deductedFromWallet = remainingPay;

      vendor.isPlatformDebtFlagged = true;

      status = vendor.walletBalance < 0 ? 'failed' : 'partial';
    }

    await vendor.save({ session });

    await MonthlyBill.create(
      [
        {
          vendorId: vendor._id,
          month: billMonth,
          year: billYear,
          totalRevenue,
          platformFeeCharged: platformFee,
          netPaid: totalRevenue - platformFee,
          deductedFromPlatformBalance,
          deductedFromWallet,
          status,
          generatedAt: now,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    return {
      message:
        status === 'paid'
          ? `Platform fee ₹${platformFee} deducted from platform balance`
          : `Platform balance insufficient — ₹${deductedFromWallet} deducted from wallet`,
      status,
      platformFee,
      totalRevenue,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    throw err;
  }
};
