"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendPhoneOTPService = exports.resendEmailOTPService = exports.changePasswordService = exports.resetPasswordService = exports.verifyResetOTPService = exports.forgetPasswordService = exports.logoutService = exports.loginVendorStep2Service = exports.loginVendorService = exports.loginCustomerService = exports.registerVendorService = exports.registerCustomerService = exports.verifyEmailOTPService = exports.verifyPhoneOTPService = void 0;
const Customer_model_1 = require("../models/Customer.model");
const User_model_1 = require("../models/User.model");
const Vendor_model_1 = require("../models/Vendor.model");
const api_error_1 = require("../utils/api-error");
const email_1 = require("../utils/email");
const jwt_1 = require("../utils/jwt");
const otp_1 = require("../utils/otp");
const phone_1 = require("../utils/phone");
const crypto_1 = __importDefault(require("crypto"));
const verifyPhoneOTPService = async (userId, otp) => {
    const user = await User_model_1.User.findById(userId);
    if (!user) {
        throw new api_error_1.ApiError(404, 'User Not Found');
    }
    if (!user.phoneOTPExpiry || (0, otp_1.isOTPExpired)(user.phoneOTPExpiry)) {
        throw new api_error_1.ApiError(400, 'OTP is expired.Genrated New One');
    }
    if (user.phoneOTP != otp) {
        throw new api_error_1.ApiError(400, 'Invalid OTP');
    }
    user.isPhoneVerified = true;
    user.phoneOTP = undefined;
    user.phoneOTPExpiry = undefined;
    await user.save();
    return { message: 'Phone Verified Successfully' };
};
exports.verifyPhoneOTPService = verifyPhoneOTPService;
const verifyEmailOTPService = async (userId, otp) => {
    const user = await User_model_1.User.findById(userId);
    if (!user) {
        throw new api_error_1.ApiError(404, 'User Not Found');
    }
    if (!user.emailOTPExpiry || (0, otp_1.isOTPExpired)(user.emailOTPExpiry)) {
        throw new api_error_1.ApiError(400, 'OTP is expired.Genrated New One');
    }
    if (user.emailOTP != otp) {
        throw new api_error_1.ApiError(400, 'Invalid OTP');
    }
    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    await user.save();
    return { message: 'Email Verified Successfully' };
};
exports.verifyEmailOTPService = verifyEmailOTPService;
const registerCustomerService = async (firstName, lastName, age, phone, email, password) => {
    const existedUser = await User_model_1.User.findOne({
        $or: [{ phone }, { email }],
    });
    if (existedUser) {
        throw new api_error_1.ApiError(400, 'Phone or email is already registered');
    }
    const phoneOTP = (0, otp_1.generateOTP)();
    const phoneOTPExpiry = (0, otp_1.getOTPExpiry)();
    const emailOTP = (0, otp_1.generateOTP)();
    const emailOTPExpiry = (0, otp_1.getOTPExpiry)();
    const user = await User_model_1.User.create({
        firstName,
        lastName,
        age,
        phone,
        email,
        password,
        role: 'customer',
        phoneOTP,
        phoneOTPExpiry,
        emailOTP,
        emailOTPExpiry,
    });
    await Customer_model_1.Customer.create({
        userId: user._id,
    });
    await (0, phone_1.sendPhoneOTP)(phone, phoneOTP);
    await (0, email_1.sendEmailOTP)(email, emailOTP);
    return {
        userId: user._id,
        message: 'OTP is send to email and phone',
    };
};
exports.registerCustomerService = registerCustomerService;
const registerVendorService = async (firstName, lastName, age, phone, email, password, businessName) => {
    const existedUser = await User_model_1.User.findOne({ $or: [{ phone }, { email }] });
    if (existedUser) {
        throw new api_error_1.ApiError(400, 'Phone or Email already exist.');
    }
    const phoneOTP = (0, otp_1.generateOTP)();
    const phoneOTPExpiry = (0, otp_1.getOTPExpiry)();
    const emailOTP = (0, otp_1.generateOTP)();
    const emailOTPExpiry = (0, otp_1.getOTPExpiry)();
    const user = await User_model_1.User.create({
        firstName,
        lastName,
        age,
        phone,
        email,
        password,
        role: 'vendor',
        phoneOTP,
        phoneOTPExpiry,
        emailOTP,
        emailOTPExpiry,
    });
    await Vendor_model_1.Vendor.create({
        userId: user._id,
        businessName,
    });
    await (0, phone_1.sendPhoneOTP)(phone, phoneOTP);
    await (0, email_1.sendEmailOTP)(email, emailOTP);
    return {
        userId: user._id,
        message: 'OTP sent to your phone and email',
    };
};
exports.registerVendorService = registerVendorService;
const loginCustomerService = async (emailOrPhone, password, res) => {
    const user = await User_model_1.User.findOne({
        $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        role: 'customer',
    });
    if (!user) {
        throw new api_error_1.ApiError(404, 'Customer not found');
    }
    if (!user.isPhoneVerified || !user.isEmailVerified) {
        throw new api_error_1.ApiError(400, 'Please verify your phone and email first');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new api_error_1.ApiError(401, 'Invalid credentials');
    }
    const token = (0, jwt_1.generateToken)(user._id.toString(), user.role);
    (0, jwt_1.sendTokenCookie)(res, token);
    return {
        userId: user._id,
        firstName: user.firstName,
        role: user.role,
    };
};
exports.loginCustomerService = loginCustomerService;
const loginVendorService = async (emailOrPhone, password) => {
    const user = await User_model_1.User.findOne({
        $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        role: 'vendor',
    });
    if (!user) {
        throw new api_error_1.ApiError(404, 'Vendor is no found.');
    }
    if (!user.isPhoneVerified || !user.isEmailVerified) {
        throw new api_error_1.ApiError(400, 'Please Verify your email and phone');
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new api_error_1.ApiError(401, 'Invalid credentials');
    }
    const vendor = await Vendor_model_1.Vendor.findOne({ userId: user._id });
    if (!vendor?.isPaymentDone) {
        throw new api_error_1.ApiError(403, 'Registration fee not paid yet', [
            user._id.toString(),
        ]);
    }
    const emailOTP = (0, otp_1.generateOTP)();
    const emailOTPExpiry = (0, otp_1.getOTPExpiry)();
    user.emailOTP = emailOTP;
    user.emailOTPExpiry = emailOTPExpiry;
    await user.save();
    await (0, email_1.sendEmailOTP)(user.email, emailOTP);
    return {
        userId: user._id,
        message: 'OTP sent to your email',
    };
};
exports.loginVendorService = loginVendorService;
const loginVendorStep2Service = async (userId, otp, res) => {
    const user = await User_model_1.User.findById(userId);
    if (!user) {
        throw new api_error_1.ApiError(404, 'User Not Found');
    }
    if (!user.emailOTPExpiry || (0, otp_1.isOTPExpired)(user.emailOTPExpiry)) {
        throw new api_error_1.ApiError(400, 'OTP expired, please login again');
    }
    if (user.emailOTP !== otp) {
        throw new api_error_1.ApiError(400, 'Invalid OTP');
    }
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    await user.save();
    const token = (0, jwt_1.generateToken)(user._id.toString(), user.role);
    (0, jwt_1.sendTokenCookie)(res, token);
    return {
        userId: user._id,
        firstName: user.firstName,
        role: user.role,
    };
};
exports.loginVendorStep2Service = loginVendorStep2Service;
const logoutService = async (res) => {
    res.clearCookie('token');
    return { message: 'Logged out successfully' };
};
exports.logoutService = logoutService;
const forgetPasswordService = async (email) => {
    const user = await User_model_1.User.findOne({ email });
    if (!user) {
        throw new api_error_1.ApiError(404, 'User not found');
    }
    const emailOTP = (0, otp_1.generateOTP)();
    const emailOTPExpiry = (0, otp_1.getOTPExpiry)();
    user.emailOTP = emailOTP;
    user.emailOTPExpiry = emailOTPExpiry;
    await user.save();
    await (0, email_1.sendEmailOTP)(user.email, emailOTP);
    return {
        userId: user._id,
        message: 'OTP sent to your email for password reset',
    };
};
exports.forgetPasswordService = forgetPasswordService;
const verifyResetOTPService = async (email, otp) => {
    const user = await User_model_1.User.findOne({ email });
    if (!user) {
        throw new api_error_1.ApiError(404, 'User Not Found');
    }
    if (!user.emailOTPExpiry || (0, otp_1.isOTPExpired)(user.emailOTPExpiry)) {
        throw new api_error_1.ApiError(400, 'OTP is expired.Genrated New One');
    }
    if (user.emailOTP !== otp) {
        throw new api_error_1.ApiError(400, 'Wrong OTP');
    }
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    user.resetToken = hashedToken;
    user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save();
    return {
        message: 'OTP verified successfully',
        resetToken,
    };
};
exports.verifyResetOTPService = verifyResetOTPService;
const resetPasswordService = async (email, resetToken, password) => {
    const user = await User_model_1.User.findOne({ email });
    if (!user) {
        throw new api_error_1.ApiError(404, 'User Not Found');
    }
    if (!user.resetToken ||
        !user.resetTokenExpiry ||
        (0, otp_1.isOTPExpired)(user.resetTokenExpiry)) {
        throw new api_error_1.ApiError(400, 'Reset token expired, please try again');
    }
    const hashedToken = crypto_1.default
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    if (hashedToken !== user.resetToken) {
        throw new api_error_1.ApiError(400, 'Invalid reset token');
    }
    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();
    return {
        message: 'Password changed successfully',
    };
};
exports.resetPasswordService = resetPasswordService;
const changePasswordService = async (userId, oldPassword, newPassword) => {
    const user = await User_model_1.User.findById(userId);
    if (!user) {
        throw new api_error_1.ApiError(404, 'User not found');
    }
    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
        throw new api_error_1.ApiError(401, 'Old password is incorrect');
    }
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
        throw new api_error_1.ApiError(400, 'New password must be different from old password');
    }
    user.password = newPassword;
    await user.save();
    return {
        message: 'Password changed successfully',
    };
};
exports.changePasswordService = changePasswordService;
const resendEmailOTPService = async (userId) => {
    console.log("OTP service S");
    const user = await User_model_1.User.findById(userId);
    if (!user) {
        throw new api_error_1.ApiError(404, 'User not found');
    }
    if (user.isEmailVerified === true) {
        throw new api_error_1.ApiError(400, 'User is already verified to email');
    }
    const lastSentTime = user.emailOTPExpiry
        ? new Date(user.emailOTPExpiry.getTime() - 10 * 60 * 1000) // expiry was set 10 min after send
        : null;
    if (lastSentTime && Date.now() - lastSentTime.getTime() < 60 * 1000) {
        throw new api_error_1.ApiError(429, 'Please wait before requesting another OTP');
    }
    const emailOTP = (0, otp_1.generateOTP)();
    const emailOTPExpiry = (0, otp_1.getOTPExpiry)();
    user.emailOTP = emailOTP;
    user.emailOTPExpiry = emailOTPExpiry;
    await user.save();
    await (0, email_1.sendEmailOTP)(user.email, emailOTP);
    return {
        userId: user._id,
        message: 'OTP is send to email',
    };
};
exports.resendEmailOTPService = resendEmailOTPService;
const resendPhoneOTPService = async (userId) => {
    const user = await User_model_1.User.findById(userId);
    if (!user) {
        throw new api_error_1.ApiError(400, 'User not found');
    }
    if (user.isPhoneVerified === true) {
        throw new api_error_1.ApiError(404, 'User is already verified to phone');
    }
    const lastSentTime = user.phoneOTPExpiry
        ? new Date(user.phoneOTPExpiry.getTime() - 10 * 60 * 1000) // expiry was set 10 min after send
        : null;
    if (lastSentTime && Date.now() - lastSentTime.getTime() < 60 * 1000) {
        throw new api_error_1.ApiError(429, 'Please wait before requesting another OTP');
    }
    const phoneOTP = (0, otp_1.generateOTP)();
    const phoneOTPExpiry = (0, otp_1.getOTPExpiry)();
    user.phoneOTP = phoneOTP;
    user.phoneOTPExpiry = phoneOTPExpiry;
    await user.save();
    await (0, phone_1.sendPhoneOTP)(user.phone, phoneOTP);
    return {
        userId: user._id,
        message: 'OTP is send to phone',
    };
};
exports.resendPhoneOTPService = resendPhoneOTPService;
//# sourceMappingURL=auth.services.js.map