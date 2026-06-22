import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllReadNotifications,
} from '../controllers/notification.controller';

const router = Router();

// Secure all notification routes with authMiddleware
router.use(authMiddleware);

router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.delete('/clear-read', deleteAllReadNotifications);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

export default router;
