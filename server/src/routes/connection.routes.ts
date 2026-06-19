import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  requestConnection,
  acceptConnection,
  rejectConnection,
  getMyConnections,
  payDue,
  getVendorConnections,
} from '../controllers/connection.controllers';

const router = Router();

router.post(
  '/request',
  authMiddleware,
  requireRole('customer'),
  requestConnection,
);

router.put(
  '/:id/accept',
  authMiddleware,
  requireRole('vendor'),
  acceptConnection,
);

router.put(
  '/:id/reject',
  authMiddleware,
  requireRole('vendor'),
  rejectConnection,
);

router.get('/vendor', authMiddleware, requireRole('vendor'), getVendorConnections);

router.get('/my', authMiddleware, requireRole('customer'), getMyConnections);

router.post('/:id/pay-due', authMiddleware, requireRole('customer'), payDue);

export default router;
