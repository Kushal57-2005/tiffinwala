import { Customer } from '../models/Customer.model';
import { User } from '../models/User.model';
import { Vendor } from '../models/Vendor.model';
import { ApiError } from '../utils/api-error';
import { sendEmailOTP } from '../utils/email';
import { generateToken, sendTokenCookie } from '../utils/jwt';
import { generateOTP, getOTPExpiry, isOTPExpired } from '../utils/otp';
import { sendPhoneOTP } from '../utils/phone';
import { Response } from 'express';
import crypto from 'crypto';
import { Message } from 'twilio/lib/twiml/MessagingResponse';

export const verifyPhoneOTPService = async (userId: string, otp: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User Not Found');
    }

    if (!user.phoneOTPExpiry || isOTPExpired(user.phoneOTPExpiry)) {
        throw new ApiError(400, 'OTP is expired.Genrated New One');
    }

    if (user.phoneOTP != otp) {
        throw new ApiError(400, 'Invalid OTP');
    }

    user.isPhoneVerified = true;
    user.phoneOTP = undefined;
    user.phoneOTPExpiry = undefined;
    await user.save();

    return { message: 'Phone Verified Successfully' };
};

export const verifyEmailOTPService = async (userId: string, otp: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User Not Found');
    }

    if (!user.emailOTPExpiry || isOTPExpired(user.emailOTPExpiry)) {
        throw new ApiError(400, 'OTP is expired.Genrated New One');
    }

    if (user.emailOTP != otp) {
        throw new ApiError(400, 'Invalid OTP');
    }

    user.isEmailVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    await user.save();

    return { message: 'Email Verified Successfully' };
};

export const registerCustomerService = async (
    firstName: string,
    lastName: string,
    age: number,
    phone: string,
    email: string,
    password: string,
) => {
    const existedUser = await User.findOne({
        $or: [{ phone }, { email }],
    });
    if (existedUser) {
        throw new ApiError(400, 'Phone or email is already registered');
    }

    const phoneOTP = generateOTP();
    const phoneOTPExpiry = getOTPExpiry();

    const emailOTP = generateOTP();
    const emailOTPExpiry = getOTPExpiry();

    const user = await User.create({
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

    await Customer.create({
        userId: user._id,
    });

    await sendPhoneOTP(phone, phoneOTP);
    await sendEmailOTP(email, emailOTP);

    return {
        userId: user._id,
        message: 'OTP is send to email and phone',
    };
};

export const registerVendorService = async (
    firstName: string,
    lastName: string,
    age: number,
    phone: string,
    email: string,
    password: string,
    businessName: string,
) => {
    const existedUser = await User.findOne({ $or: [{ phone }, { email }] });
    if (existedUser) {
        throw new ApiError(400, 'Phone or Email already exist.');
    }

    const phoneOTP = generateOTP();
    const phoneOTPExpiry = getOTPExpiry();
    const emailOTP = generateOTP();
    const emailOTPExpiry = getOTPExpiry();

    const user = await User.create({
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

    await Vendor.create({
        userId: user._id,
        businessName,
    });

    await sendPhoneOTP(phone, phoneOTP);
    await sendEmailOTP(email, emailOTP);

    return {
        userId: user._id,
        message: 'OTP sent to your phone and email',
    };
};

export const loginCustomerService = async (
    emailOrPhone: string,
    password: string,
    res: Response,
) => {
    const user = await User.findOne({
        $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        role: 'customer',
    });

    if (!user) {
        throw new ApiError(404, 'Customer not found');
    }

    if (!user.isPhoneVerified || !user.isEmailVerified) {
        throw new ApiError(400, 'Please verify your phone and email first');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const token = generateToken(user._id.toString(), user.role);
    sendTokenCookie(res, token);

    return {
        userId: user._id,
        firstName: user.firstName,
        role: user.role,
    };
};

export const loginVendorService = async (
    emailOrPhone: string,
    password: string,
) => {
    const user = await User.findOne({
        $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
        role: 'vendor',
    });
    if (!user) {
        throw new ApiError(404, 'Vendor is no found.');
    }

    if (!user.isPhoneVerified || !user.isEmailVerified) {
        throw new ApiError(400, 'Please Verify your email and phone');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const vendor = await Vendor.findOne({ userId: user._id });
    if (!vendor?.isPaymentDone) {
        throw new ApiError(403, 'Registration fee not paid yet', [
            user._id.toString(),
        ]);
    }

    const emailOTP = generateOTP();
    const emailOTPExpiry = getOTPExpiry();

    user.emailOTP = emailOTP;
    user.emailOTPExpiry = emailOTPExpiry;
    await user.save();
    await sendEmailOTP(user.email, emailOTP);

    return {
        userId: user._id,
        message: 'OTP sent to your email',
    };
};

export const loginVendorStep2Service = async (
    userId: string,
    otp: string,
    res: Response,
) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User Not Found');
    }
    if (!user.emailOTPExpiry || isOTPExpired(user.emailOTPExpiry)) {
        throw new ApiError(400, 'OTP expired, please login again');
    }

    if (user.emailOTP !== otp) {
        throw new ApiError(400, 'Invalid OTP');
    }

    user.emailOTP = undefined;
    user.emailOTPExpiry = undefined;
    await user.save();

    const token = generateToken(user._id.toString(), user.role);
    sendTokenCookie(res, token);

    return {
        userId: user._id,
        firstName: user.firstName,
        role: user.role,
    };
};

export const logoutService = async (res: Response) => {
    res.clearCookie('token');
    return { message: 'Logged out successfully' };
};

export const forgetPasswordService = async (email: string) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const emailOTP = generateOTP();
    const emailOTPExpiry = getOTPExpiry();

    user.emailOTP = emailOTP;
    user.emailOTPExpiry = emailOTPExpiry;
    await user.save();

    await sendEmailOTP(user.email, emailOTP);

    return {
        userId: user._id,
        message: 'OTP sent to your email for password reset',
    };
};

export const verifyResetOTPService = async (email: string, otp: string) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, 'User Not Found');
    }

    if (!user.emailOTPExpiry || isOTPExpired(user.emailOTPExpiry)) {
        throw new ApiError(400, 'OTP is expired.Genrated New One');
    }

    if (user.emailOTP !== otp) {
        throw new ApiError(400, 'Wrong OTP');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
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

export const resetPasswordService = async (
    email: string,
    resetToken: string,
    password: string,
) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, 'User Not Found');
    }

    if (
        !user.resetToken ||
        !user.resetTokenExpiry ||
        isOTPExpired(user.resetTokenExpiry)
    ) {
        throw new ApiError(400, 'Reset token expired, please try again');
    }

    const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    if (hashedToken !== user.resetToken) {
        throw new ApiError(400, 'Invalid reset token');
    }

    user.password = password;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return {
        message: 'Password changed successfully',
    };
};

export const changePasswordService = async (
    userId: string,
    oldPassword: string,
    newPassword: string,
) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
        throw new ApiError(401, 'Old password is incorrect');
    }

    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
        throw new ApiError(
            400,
            'New password must be different from old password',
        );
    }

    user.password = newPassword;
    await user.save();

    return {
        message: 'Password changed successfully',
    };
};
