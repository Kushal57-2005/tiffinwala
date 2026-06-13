"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendPhoneOTP = exports.resendEmailOTP = exports.changePassword = exports.resetPassword = exports.verifyResetOTP = exports.forgetPassword = exports.getMe = exports.logout = exports.loginVendorStep2 = exports.loginVendorStep1 = exports.loginCustomer = exports.registerVendor = exports.registerCustomer = exports.verifyEmailOTP = exports.verifyPhoneOTP = void 0;
const async_handler_1 = require("../utils/async-handler");
const api_error_1 = require("../utils/api-error");
const auth_services_1 = require("../services/auth.services");
const api_response_1 = require("../utils/api-response");
const User_model_1 = require("../models/User.model");
exports.verifyPhoneOTP = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        throw new api_error_1.ApiError(400, 'UserId and OTP are required');
    }
    const result = await (0, auth_services_1.verifyPhoneOTPService)(userId, otp);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Phone Verified'));
});
exports.verifyEmailOTP = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        throw new api_error_1.ApiError(400, 'UserId and OTP are required');
    }
    const result = await (0, auth_services_1.verifyEmailOTPService)(userId, otp);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Email Verified'));
});
exports.registerCustomer = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { firstName, lastName, age, phone, email, password } = req.body;
    if (!firstName || !lastName || !age || !phone || !email || !password) {
        throw new api_error_1.ApiError(400, 'All fields are required');
    }
    const result = await (0, auth_services_1.registerCustomerService)(firstName, lastName, age, phone, email, password);
    return res
        .status(201)
        .json(new api_response_1.ApiResponse(201, result, 'Registration successful'));
});
exports.registerVendor = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { firstName, lastName, age, phone, email, password, businessName, } = req.body;
    if (!firstName ||
        !lastName ||
        !age ||
        !phone ||
        !email ||
        !password ||
        !businessName) {
        throw new api_error_1.ApiError(400, 'All fields are required');
    }
    const result = await (0, auth_services_1.registerVendorService)(firstName, lastName, age, phone, email, password, businessName);
    return res
        .status(201)
        .json(new api_response_1.ApiResponse(201, result, 'Registration successful'));
});
exports.loginCustomer = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
        throw new api_error_1.ApiError(400, 'Email/Phone and password are required');
    }
    const result = await (0, auth_services_1.loginCustomerService)(emailOrPhone, password, res);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Login successful'));
});
exports.loginVendorStep1 = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
        throw new api_error_1.ApiError(400, 'Email/Phone and password are required');
    }
    const result = await (0, auth_services_1.loginVendorService)(emailOrPhone, password);
    return res.status(200).json(new api_response_1.ApiResponse(200, result, 'OTP sent'));
});
exports.loginVendorStep2 = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
        throw new api_error_1.ApiError(400, 'userId and otp are required');
    }
    const result = await (0, auth_services_1.loginVendorStep2Service)(userId, otp, res);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Login successful'));
});
exports.logout = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const result = await (0, auth_services_1.logoutService)(res);
    return res.status(200).json(new api_response_1.ApiResponse(200, result, 'Logged out'));
});
exports.getMe = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const user = await User_model_1.User.findById(req.user?.userId).select('-password -phoneOTP -emailOTP');
    if (!user) {
        throw new api_error_1.ApiError(404, 'User not found');
    }
    return res.status(200).json(new api_response_1.ApiResponse(200, user, 'User fetched'));
});
exports.forgetPassword = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new api_error_1.ApiError(400, 'Email is required');
    }
    const result = await (0, auth_services_1.forgetPasswordService)(email);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'OTP sent to your email'));
});
exports.verifyResetOTP = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) {
        throw new api_error_1.ApiError(400, 'Email and OTP are required');
    }
    const result = await (0, auth_services_1.verifyResetOTPService)(email, otp);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'OTP verified successfully'));
});
exports.resetPassword = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { email, resetToken, password } = req.body;
    if (!email || !resetToken || !password) {
        throw new api_error_1.ApiError(400, 'Email, resetToken and password are required');
    }
    const result = await (0, auth_services_1.resetPasswordService)(email, resetToken, password);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Password reset successful'));
});
exports.changePassword = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
        throw new api_error_1.ApiError(400, 'Old password and new password are required');
    }
    const userId = req.user.userId;
    const result = await (0, auth_services_1.changePasswordService)(userId, oldPassword, newPassword);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'Password changed successfully'));
});
exports.resendEmailOTP = (0, async_handler_1.asyncHandler)(async (req, res) => {
    console.log('OTP c is s');
    const { userId } = req.body;
    if (!userId) {
        throw new api_error_1.ApiError(400, 'userId is required');
    }
    const result = await (0, auth_services_1.resendEmailOTPService)(userId);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'OTP resent to email'));
});
exports.resendPhoneOTP = (0, async_handler_1.asyncHandler)(async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
        throw new api_error_1.ApiError(400, 'userId is required');
    }
    const result = await (0, auth_services_1.resendPhoneOTPService)(userId);
    return res
        .status(200)
        .json(new api_response_1.ApiResponse(200, result, 'OTP resent to phone'));
});
//# sourceMappingURL=auth.controllers.js.map