import { Notification } from '../models/Notification.model';
import mongoose from 'mongoose';
import { sendRealtimeNotification } from '../socket/socketManager';

type NotificationType =
  | 'order'
  | 'payment'
  | 'subscription'
  | 'system'
  | 'menu'
  | 'chat';

interface CreateNotificationInput {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  type?: NotificationType;
  data?: Record<string, any>;
}

export const createNotification = async ({
  userId,
  title,
  message,
  type = 'system',
  data = {},
}: CreateNotificationInput) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      data,
    });

    if (notification) {
      // Immediately call sendRealtimeNotification()
      sendRealtimeNotification(userId.toString(), notification);
    }

    return notification;
  } catch (error) {
    console.error('Notification Error:', error);
    return null;
  }
};
