import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/api-error';
import {
    registerCustomerService,
    verifyPhoneOTPService,
    verifyEmailOTPService,
    registerVendorService,
    loginCustomerService,
    loginVendorService,
    loginVendorStep2Service,
    logoutService,
    forgetPasswordService,
    verifyResetOTPService,
    resetPasswordService,
    changePasswordService,
} from '../services/auth.services';
import { ApiResponse } from '../utils/api-response';
import { AuthRequest } from '../middlewares/auth.middleware';
import { User } from '../models/User.model';

export const verifyPhoneOTP = asyncHandler(
    async (req: Request, res: Response) => {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            throw new ApiError(400, 'UserId and OTP are required');
        }

        const result = await verifyPhoneOTPService(userId, otp);

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Phone Verified'));
    },
);

export const verifyEmailOTP = asyncHandler(
    async (req: Request, res: Response) => {
        const { userId, otp } = req.body;
        if (!userId || !otp) {
            throw new ApiError(400, 'UserId and OTP are required');
        }

        const result = await verifyEmailOTPService(userId, otp);

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Email Verified'));
    },
);

export const registerCustomer = asyncHandler(
    async (req: Request, res: Response) => {
        const { firstName, lastName, age, phone, email, password } = req.body;
        if (!firstName || !lastName || !age || !phone || !email || !password) {
            throw new ApiError(400, 'All fields are required');
        }

        const result = await registerCustomerService(
            firstName,
            lastName,
            age,
            phone,
            email,
            password,
        );

        return res
            .status(201)
            .json(new ApiResponse(201, result, 'Registration successful'));
    },
);

export const registerVendor = asyncHandler(
    async (req: Request, res: Response) => {
        const {
            firstName,
            lastName,
            age,
            phone,
            email,
            password,
            businessName,
        } = req.body;
        if (
            !firstName ||
            !lastName ||
            !age ||
            !phone ||
            !email ||
            !password ||
            !businessName
        ) {
            throw new ApiError(400, 'All fields are required');
        }

        const result = await registerVendorService(
            firstName,
            lastName,
            age,
            phone,
            email,
            password,
            businessName,
        );

        return res
            .status(201)
            .json(new ApiResponse(201, result, 'Registration successful'));
    },
);

export const loginCustomer = asyncHandler(
    async (req: Request, res: Response) => {
        const { emailOrPhone, password } = req.body;

        if (!emailOrPhone || !password) {
            throw new ApiError(400, 'Email/Phone and password are required');
        }

        const result = await loginCustomerService(emailOrPhone, password, res);

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Login successful'));
    },
);

export const loginVendorStep1 = asyncHandler(
    async (req: Request, res: Response) => {
        const { emailOrPhone, password } = req.body;

        if (!emailOrPhone || !password) {
            throw new ApiError(400, 'Email/Phone and password are required');
        }

        const result = await loginVendorService(emailOrPhone, password);

        return res.status(200).json(new ApiResponse(200, result, 'OTP sent'));
    },
);

export const loginVendorStep2 = asyncHandler(
    async (req: Request, res: Response) => {
        const { userId, otp } = req.body;

        if (!userId || !otp) {
            throw new ApiError(400, 'userId and otp are required');
        }

        const result = await loginVendorStep2Service(userId, otp, res);

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Login successful'));
    },
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
    const result = await logoutService(res);
    return res.status(200).json(new ApiResponse(200, result, 'Logged out'));
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await User.findById(req.user?.userId).select(
        '-password -phoneOTP -emailOTP',
    );

    if (!user) {
        throw new ApiError(404, 'User not found');
    }

    return res.status(200).json(new ApiResponse(200, user, 'User fetched'));
});

export const forgetPassword = asyncHandler(
    async (req: Request, res: Response) => {
        const { email } = req.body;

        if (!email) {
            throw new ApiError(400, 'Email is required');
        }

        const result = await forgetPasswordService(email);

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'OTP sent to your email'));
    },
);

export const verifyResetOTP = asyncHandler(
    async (req: Request, res: Response) => {
        const { email, otp } = req.body;

        if (!email || !otp) {
            throw new ApiError(400, 'Email and OTP are required');
        }

        const result = await verifyResetOTPService(email, otp);

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'OTP verified successfully'));
    },
);

export const resetPassword = asyncHandler(
    async (req: Request, res: Response) => {
        const { email, resetToken, password } = req.body;

        if (!email || !resetToken || !password) {
            throw new ApiError(
                400,
                'Email, resetToken and password are required',
            );
        }

        const result = await resetPasswordService(email, resetToken, password);

        return res
            .status(200)
            .json(new ApiResponse(200, result, 'Password reset successful'));
    },
);

export const changePassword = asyncHandler(
    async (req: Request, res: Response) => {
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            throw new ApiError(
                400,
                'Old password and new password are required',
            );
        }

        const userId = (req as any).user.userId;

        const result = await changePasswordService(
            userId,
            oldPassword,
            newPassword,
        );
        

        return res
            .status(200)
            .json(
                new ApiResponse(200, result, 'Password changed successfully'),
            );
    },
);
