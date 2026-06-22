import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
  getNearbyVendors,
  getCustomerProfile,
  updateCustomerLocation,
  updateCustomerProfile,
  getVendorMenuForCustomer,
  getFriendProfiles,
  addFriendProfile,
  editFriendProfile,
  removeFriendProfile,
  getVendorPublicDetails,
  getOrderForCustomer,
  customerDashboard,
} from '../controllers/customer.contoller';
import { searchVendors } from '../controllers/vendor.contoller';
import { getSubscriptionsPlansForCustomers } from '../controllers/subscription.contoller';

const router = Router();

router
  .route('/profile')
  .get(authMiddleware, requireRole('customer'), getCustomerProfile)
  .put(authMiddleware, requireRole('customer'), updateCustomerProfile);

router.patch(
  '/profile/location',
  authMiddleware,
  requireRole('customer'),
  updateCustomerLocation,
);
router.get(
  '/vendors/nearby',
  authMiddleware,
  requireRole('customer'),
  getNearbyVendors,
);
router.get(
  '/vendors/search',
  authMiddleware,
  requireRole('customer'),
  searchVendors,
);
router.get(
  '/vendors/:vendorId/menu',
  authMiddleware,
  requireRole('customer'),
  getVendorMenuForCustomer,
);

router.get(
  '/friends',
  authMiddleware,
  requireRole('customer'),
  getFriendProfiles,
);
router.post(
  '/friends',
  authMiddleware,
  requireRole('customer'),
  addFriendProfile,
);
router.put(
  '/friends/:friendId',
  authMiddleware,
  requireRole('customer'),
  editFriendProfile,
);
router.delete(
  '/friends/:friendId',
  authMiddleware,
  requireRole('customer'),
  removeFriendProfile,
);

router.get(
  '/vendors/:vendorId',
  authMiddleware,
  requireRole('customer'),
  getVendorPublicDetails,
);

router.get(
  '/my-today',
  authMiddleware,
  requireRole('customer'),
  getOrderForCustomer,
);

router.get(
  '/vendors/:vendorId/plans',
  authMiddleware,
  requireRole('customer'),
  getSubscriptionsPlansForCustomers,
);
export default router;

router.get(
  '/dashboard',
  authMiddleware,
  requireRole('customer'),
  customerDashboard,
);
