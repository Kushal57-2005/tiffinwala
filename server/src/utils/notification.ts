import { Notification } from '../models/Notification.model';
import mongoose from 'mongoose';

type NotificationType = 'order' | 'payment' | 'subscription' | 'system';

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

    return notification;
  } catch (error) {
    console.error('Notification Error:', error);
    return null;
  }
};
