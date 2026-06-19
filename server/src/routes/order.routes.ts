import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  acceptOrder,
  deliveredOrder,
  getOrders,
  placeOrder,
  receivedOrder,
  rejectOrder,
} from '../controllers/order.contollers';

const router = Router();

router.post('/', authMiddleware, requireRole('customer'), placeOrder);
router.get('/:vendorId', authMiddleware, requireRole('vendor'), getOrders);
router.put(
  '/:orderId/accept',
  authMiddleware,
  requireRole('vendor'),
  acceptOrder,
);

router.put(
  '/:orderId/reject',
  authMiddleware,
  requireRole('vendor'),
  rejectOrder,
);

router.put(
  '/:orderId/delivered',
  authMiddleware,
  requireRole('vendor'),
  deliveredOrder,
);

router.put(
  '/:orderId/received',
  authMiddleware,
  requireRole('customer'),
  receivedOrder,
);
export default router;
