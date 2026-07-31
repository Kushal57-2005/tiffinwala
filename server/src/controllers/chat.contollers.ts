import {
  getChatCustomerService,
  getChatVendorService,
  customerConvoService,
  vendorConvoService,
  markAsReadService,
  customerComplaintService,
  VendorUpdateComplaintService,
} from '../services/chat.services';
import { asyncHandler } from '../utils/async-handler';
import { ApiResponse } from '../utils/api-response';
import { ApiError } from '../utils/api-error';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Response } from 'express';

export const getChatCustomer = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const vendorId = Array.isArray(req.params.vendorId)
      ? req.params.vendorId[0]
      : req.params.vendorId;

    if (!vendorId) throw new ApiError(400, 'Vendor ID is required');

    const result = await getChatCustomerService(userId, vendorId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Chat history fetched'));
  },
);

export const getChatVendor = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;
    const customerId = Array.isArray(req.params.customerId)
      ? req.params.customerId[0]
      : req.params.customerId;

    if (!customerId) throw new ApiError(400, 'Customer ID is required');

    const result = await getChatVendorService(userId, customerId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Chat history fetched'));
  },
);

export const getCustomerConversations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;

    const result = await customerConvoService(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Conversations fetched'));
  },
);

export const getVendorConversations = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId as string;

    const result = await vendorConvoService(userId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Conversations fetched'));
  },
);

export const markAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const messageId = Array.isArray(req.params.messageId)
      ? req.params.messageId[0]
      : req.params.messageId;

    if (!messageId) throw new ApiError(400, 'Message ID is required');

    await markAsReadService(messageId);

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Message marked as read'));
  },
);

export const raiseComplaint = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const messageId = Array.isArray(req.params.messageId)
      ? req.params.messageId[0]
      : req.params.messageId;

    if (!messageId) throw new ApiError(400, 'Message ID is required');

    const result = await customerComplaintService(messageId);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Complaint raised'));
  },
);

export const updateComplaintStatus = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const messageId = Array.isArray(req.params.messageId)
      ? req.params.messageId[0]
      : req.params.messageId;
    const { status } = req.body;

    if (!messageId) throw new ApiError(400, 'Message ID is required');
    if (!status) throw new ApiError(400, 'Status is required');

    const result = await VendorUpdateComplaintService(messageId, status);

    return res
      .status(200)
      .json(new ApiResponse(200, result, 'Complaint status updated'));
  },
);
