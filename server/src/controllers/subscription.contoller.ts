import { Response, Request } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/api-error';
import {
  buyPlansService,
  createSubscriptionPlanService,
  getPlansService,
  getSubscriptionsForVendorService,
  getSubscriptionsPlansForCustomersService,
} from '../services/subscription.service';
import { ApiResponse } from '../utils/api-response';

export const createSubscriptionPlan = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const { name, totalTokens, price } = req.body;

    if (!name || !totalTokens || !price)
      throw new ApiError(400, 'All fields are required');

    const result = await createSubscriptionPlanService(
      userId,
      name,
      totalTokens,
      price,
    );

    return res
      .status(201)
      .json(new ApiResponse(201, result, `Plan is created as ${name}`));
  },
);

export const getSubscriptionsForVendor = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const result = await getSubscriptionsForVendorService(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'All plans are fetched'));
  },
);

export const getSubscriptionsPlansForCustomers = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { vendorId } = req.params;

    const result = await getSubscriptionsPlansForCustomersService(vendorId as string);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          'All Subscription for selected vendor are fetched',
        ),
      );
  },
);

export const buyPlans = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const { subscriptionPlanId } = req.body;

    if (!subscriptionPlanId) throw new ApiError(404, 'all field must needed');

    const result = await buyPlansService(userId, subscriptionPlanId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Plan buy successfully'));
  },
);

export const getPlans = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const result = await getPlansService(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'All Plans are fetch successfully'));
  },
);

