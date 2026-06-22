import { Response } from 'express';
import { Notification } from '../models/Notification.model';
import { asyncHandler } from '../utils/async-handler';
import { ApiError } from '../utils/api-error';
import { ApiResponse } from '../utils/api-response';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50); // Get recent 50 notifications

    return res
      .status(200)
      .json(new ApiResponse(200, notifications, 'Notifications fetched successfully'));
  }
);

export const markAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    const notificationId = req.params.id;
    const notification = await Notification.findOne({ _id: notificationId, userId });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    notification.isRead = true;
    await notification.save();

    return res
      .status(200)
      .json(new ApiResponse(200, notification, 'Notification marked as read'));
  }
);

export const markAllAsRead = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    await Notification.updateMany({ userId, isRead: false }, { $set: { isRead: true } });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'All notifications marked as read'));
  }
);

export const deleteNotification = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    const notificationId = req.params.id;
    const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });

    if (!notification) {
      throw new ApiError(404, 'Notification not found');
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'Notification deleted'));
  }
);

export const deleteAllReadNotifications = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw new ApiError(401, 'User not authenticated');

    await Notification.deleteMany({ userId, isRead: true });

    return res
      .status(200)
      .json(new ApiResponse(200, null, 'All read notifications cleared'));
  }
);
