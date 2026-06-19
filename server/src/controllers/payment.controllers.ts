import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { ApiResponse } from '../utils/api-response';
import {
  addMoneyToWalletService,
  createVendorPaymentOrderService,
  verifyaddMoneyToWalletService,
  verifyVendorPaymentService,
} from '../services/payment.services';
import { ApiError } from '../utils/api-error';

export const createVendorPaymentOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId } = req.body;

    if (!userId) {
      throw new ApiError(400, 'userId is required');
    }

    const result = await createVendorPaymentOrderService(userId);

    return res.status(200).json(new ApiResponse(200, result, 'Order created'));
  },
);

export const verifyVendorPayment = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !userId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      throw new ApiError(400, 'All payment fields are required');
    }

    const result = await verifyVendorPaymentService(
      userId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Payment verified'));
  },
);

export const addMoneyToWallet = asyncHandler(
  async (req: Request, res: Response) => {
    const { userId, amount } = req.body;
    console.log('BODY:', req.body);

    const parsedAmount = Number(amount);

    if (!userId || !parsedAmount) {
      throw new ApiError(400, 'Valid fields required');
    }
    console.log('Parsed Data:', { userId, amount, type: typeof amount });
    const result = await addMoneyToWalletService(userId, parsedAmount);

    return res.status(200).json(new ApiResponse(200, result, 'Order created'));
  },
);

export const verifyAddMoneyToWallet = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      userId,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !userId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      throw new ApiError(400, 'All payment fields are required');
    }

    const result = await verifyaddMoneyToWalletService(
      userId,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    );

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          ` Payment verified for adding ₹${amount} to the wallet`,
        ),
      );
  },
);
