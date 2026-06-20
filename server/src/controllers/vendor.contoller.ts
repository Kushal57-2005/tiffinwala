import {
  createMenuService,
  getSubscribersService,
  getTodayMenuService,
  getVendorProfileService,
  toggleVendorOpenService,
  updateVendorProfileService,
} from '../services/vendor.services';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/api-error';
import { ApiResponse } from '../utils/api-response';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';
import { Vendor } from '../models/Vendor.model';
import { searchVendorsService } from '../services/customer.services';

export const toggleVendorOpen = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const result = await toggleVendorOpenService(userId);
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          `vendor is currently ${result.isOpen ? 'OPEN' : 'CLOSED'}`,
        ),
      );
  },
);

export const createMenu = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const { tiers, addOns, description, session } = req.body;

    if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
      throw new ApiError(400, 'At least one tier is required');
    }
    if (!session || !['lunch', 'dinner'].includes(session)) {
      throw new ApiError(400, 'session must be "lunch" or "dinner"');
    }

    const userId = req.user?.userId as string;

    const result = await createMenuService(
      userId,
      tiers,
      addOns,
      description,
      session,
    );

    return res
      .status(201)
      .json(new ApiResponse(201, result, `Menu created for ${result.session}`));
  },
);

export const getTodaysMenu = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const session = req.query.session as 'lunch' | 'dinner';
    if (!session || !['lunch', 'dinner'].includes(session)) {
      throw new ApiError(
        400,
        'session query param must be "lunch" or "dinner"',
      );
    }

    const vendor = await Vendor.findOne({ userId });
    if (!vendor) {
      throw new ApiError(404, 'Vendor not found');
    }

    const result = await getTodayMenuService(vendor._id.toString(), session);

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          result,
          result
            ? 'Menu fetched successfully'
            : 'No menu uploaded for this session yet',
        ),
      );
  },
);

export const getVendorProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;

    const result = await getVendorProfileService(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Vendor profile fetched'));
  },
);

export const updateVendorProfile = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;

    const {
      firstname,
      lastname,
      email,
      phone,
      businessName,
      deliveryRadiuskm,
      address,
      coordinates,
    } = req.body;

    const result = await updateVendorProfileService(
      userId,
      firstname,
      lastname,
      email,
      phone,
      businessName,
      deliveryRadiuskm,
      address,
      coordinates,
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Vendor profile updated'));
  },
);
export const searchVendors = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const query = req.query.q as string;

    const result = await searchVendorsService(query);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Search results fetched'));
  },
);

export const getSubscribersPlans = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const result = await getSubscribersService(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'All Plans are fetch successfully'));
  },
);
