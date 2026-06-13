import { razorpay } from '../config/rozorpay';
import { ApiError } from '../utils/api-error';
import { User } from '../models/User.model';
import { Vendor } from '../models/Vendor.model';
import crypto from 'crypto';

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
        { walletBalance: 9999, isPaymentDone: true },
        { new: true },
    );

    if (!vendor) {
        throw new ApiError(404, 'Vendor not found');
    }

    return { message: 'Payment successful, account activated' };
};
