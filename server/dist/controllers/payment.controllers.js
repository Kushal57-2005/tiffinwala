"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyVendorPayment = exports.createVendorPaymentOrder = void 0;
const async_handler_1 = require("../utils/async-handler");
const api_response_1 = require("../utils/api-response");
const payment_services_1 = require("../services/payment.services");
const api_error_1 = require("../utils/api-error");
exports.createVendorPaymentOrder = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        throw new api_error_1.ApiError(400, 'userId is required');
    }
    const result = await (0, payment_services_1.createVendorPaymentOrderService)(userId);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Order created'));
});
exports.verifyVendorPayment = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId, razorpay_order_id, razorpay_payment_id, razorpay_signature, } = req.body;
    if (!userId ||
        !razorpay_order_id ||
        !razorpay_payment_id ||
        !razorpay_signature) {
        throw new api_error_1.ApiError(400, 'All payment fields are required');
    }
    const result = await (0, payment_services_1.verifyVendorPaymentService)(userId, razorpay_order_id, razorpay_payment_id, razorpay_signature);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Payment verified'));
});
//# sourceMappingURL=payment.controllers.js.map