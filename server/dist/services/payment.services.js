"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyVendorPaymentService = exports.createVendorPaymentOrderService = void 0;
const rozorpay_1 = require("../config/rozorpay");
const api_error_1 = require("../utils/api-error");
const User_model_1 = require("../models/User.model");
const Vendor_model_1 = require("../models/Vendor.model");
const crypto_1 = __importDefault(require("crypto"));
const createVendorPaymentOrderService = async (userId) => {
    const user = await User_model_1.User.findById(userId);
    if (!user || user.role !== 'vendor') {
        throw new api_error_1.ApiError(404, 'Vendor not found');
    }
    if (!user.isPhoneVerified || !user.isEmailVerified) {
        throw new api_error_1.ApiError(400, 'Please verify phone and email first');
    }
    const vendor = await Vendor_model_1.Vendor.findOne({ userId });
    if (!vendor) {
        throw new api_error_1.ApiError(404, 'Vendor profile not found');
    }
    if (vendor.isPaymentDone) {
        throw new api_error_1.ApiError(400, 'Registration fee already paid');
    }
    const order = await rozorpay_1.razorpay.orders.create({
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
exports.createVendorPaymentOrderService = createVendorPaymentOrderService;
const verifyVendorPaymentService = async (userId, razorpay_order_id, razorpay_payment_id, razorpay_signature) => {
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto_1.default
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
    if (expectedSignature !== razorpay_signature) {
        throw new api_error_1.ApiError(400, 'Payment verification failed');
    }
    const vendor = await Vendor_model_1.Vendor.findOneAndUpdate({ userId }, { walletBalance: 9999, isPaymentDone: true }, { new: true });
    if (!vendor) {
        throw new api_error_1.ApiError(404, 'Vendor not found');
    }
    return { message: 'Payment successful, account activated' };
};
exports.verifyVendorPaymentService = verifyVendorPaymentService;
//# sourceMappingURL=payment.services.js.map