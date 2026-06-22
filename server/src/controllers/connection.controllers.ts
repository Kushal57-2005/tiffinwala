import {
  requestConnectionService,
  respondConnectionService,
  getMyConnectionsService,
  payDueService,
  getVendorConnectionsService,
} from '../services/connection.services';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/api-error';
import { ApiResponse } from '../utils/api-response';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';

export const requestConnection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const { vendorId } = req.body;

    if (!vendorId) throw new ApiError(400, 'vendorId is required');

    const result = await requestConnectionService(userId, vendorId);

    return res
      .status(201)
      .json(new ApiResponse(201, result, 'Connection request sent'));
  },
);

export const acceptConnection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const connectionId = req.params.id as string;

    const result = await respondConnectionService(
      userId,
      connectionId,
      'accept',
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Connection accepted'));
  },
);

export const rejectConnection = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const connectionId = req.params.id as string;

    const result = await respondConnectionService(
      userId,
      connectionId,
      'reject',
    );

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Connection rejected'));
  },
);

export const getMyConnections = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;

    const result = await getMyConnectionsService(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Connections fetched'));
  },
);

export const payDue = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId as string;
  const connectionId = req.params.id as string;

  const result = await payDueService(userId, connectionId);

  return res
    .status(200)
    .json(new ApiResponse(200, result, 'Due paid successfully'));
});

export const getVendorConnections = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const result = await getVendorConnectionsService(userId);
    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Vendor connections fetched'));
  },
);

