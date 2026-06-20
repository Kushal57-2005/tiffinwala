import { Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  getAllRatingService,
  rateVendorService,
} from '../services/rating.services';
import { ApiResponse } from '../utils/api-response';

export const rateVendor = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const { vendorId, stars, review } = req.body;
    const result = await rateVendorService(userId, vendorId, stars, review);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Vendor rated successfully'));
  },
);

export const getAllRating = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const vendorId = req.params.vendorId as string;
    const result = await getAllRatingService(vendorId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'All rating are fetched'));
  },
);
