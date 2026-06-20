import { Router } from 'express';
import {
  createMenu,
  getSubscribersPlans,
  getTodaysMenu,
  getVendorProfile,
  toggleVendorOpen,
  updateVendorProfile,
} from '../controllers/vendor.contoller';
import { requireRole } from '../middlewares/role.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getNearbyVendors } from '../controllers/customer.contoller';
import {
  createSubscriptionPlan,
  getSubscriptionsForVendor,
} from '../controllers/subscription.contoller';

const router = Router();

router.post(
  '/menu/create-menu',
  authMiddleware,
  requireRole('vendor'),
  createMenu,
);
router.get('/menu/today', authMiddleware, requireRole('vendor'), getTodaysMenu);
router.put('/toggle', authMiddleware, requireRole('vendor'), toggleVendorOpen);
router
  .route('/profile')
  .get(authMiddleware, requireRole('vendor'), getVendorProfile)
  .put(authMiddleware, requireRole('vendor'), updateVendorProfile);

router.post(
  '/subscription-plan',
  authMiddleware,
  requireRole('vendor'),
  createSubscriptionPlan,
);

router.post(
  '/subscription-plans',
  authMiddleware,
  requireRole('vendor'),
  createSubscriptionPlan,
);

router.get(
  '/subscription-plans',
  authMiddleware,
  requireRole('vendor'),
  getSubscriptionsForVendor,
);

router.get(
  '/subscriptions/customers',
  authMiddleware,
  requireRole('vendor'),
  getSubscribersPlans,
);

export default router;
