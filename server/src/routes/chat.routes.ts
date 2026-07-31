// chat.routes.ts
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  getChatCustomer,
  getChatVendor,
  getCustomerConversations,
  getVendorConversations,
  markAsRead,
  raiseComplaint,
  updateComplaintStatus,
} from '../controllers/chat.contollers';

const router = Router();

// Customer — fetch messages with a specific vendor
router.get(
  '/vendor/:vendorId',
  authMiddleware,
  requireRole('customer'),
  getChatCustomer,
);

// Vendor — fetch messages with a specific customer
router.get(
  '/customer/:customerId',
  authMiddleware,
  requireRole('vendor'),
  getChatVendor,
);

// Customer — list all conversations
router.get(
  '/conversations',
  authMiddleware,
  requireRole('customer'),
  getCustomerConversations,
);

// Vendor — list all conversations
router.get(
  '/conversations/vendor',
  authMiddleware,
  requireRole('vendor'),
  getVendorConversations,
);

// Mark message as read
router.put('/message/:messageId/read', authMiddleware, markAsRead);

// Customer raises complaint on a message
router.put(
  '/message/:messageId/complaint',
  authMiddleware,
  requireRole('customer'),
  raiseComplaint,
);

// Vendor updates complaint status
router.put(
  '/complaint/:messageId/status',
  authMiddleware,
  requireRole('vendor'),
  updateComplaintStatus,
);

export default router;
