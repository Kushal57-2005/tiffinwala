import { asyncHandler } from '../utils/async-handler';
import { ApiResponse } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';
import {
  placeOrderService,
  acceptOrderService,
  getOrdersDetailsService,
  rejectOrderService,
  receivedOrderService,
  deliveredOrderService,
} from '../services/order.servies';

export const placeOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const { vendorId, tiers, addOns, note, paymentMethod } =
      req.body;

    if (!vendorId) throw new ApiError(400, 'vendorId is required');
    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
      throw new ApiError(400, 'At least one tier must be ordered');
    }

    const result = await placeOrderService({
      userId,
      vendorId,
      tiers,
      addOns,
      note,
      paymentMethod,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, result, 'Order placed successfully'));
  },
);

export const getOrders = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const vendorId = req.params.vendorId as string;
    const result = await getOrdersDetailsService(vendorId);
    return res
      .status(200)
      .json(new ApiResponse(200, result, 'All order are fetched'));
  },
);

export const acceptOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const orderId = req.params.orderId as string;
    const result = await acceptOrderService(orderId);
    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Order accepted successfully'));
  },
);

export const rejectOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const orderId = req.params.orderId as string;
    const result = await rejectOrderService(orderId);
    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Order rejected successfully'));
  },
);

export const receivedOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const orderId = req.params.orderId as string;
    const result = await receivedOrderService(orderId);
    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Order receiveded successfully'));
  },
);

export const deliveredOrder = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const orderId = req.params.orderId as string;
    const result = await deliveredOrderService(orderId);
    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Order delivered successfully'));
  },
);
