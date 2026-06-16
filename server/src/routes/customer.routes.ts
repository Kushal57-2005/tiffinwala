import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
    getNearbyVendors,
    getCustomerProfile,
    updateCustomerLocation,
    updateCustomerProfile,
    getVendorMenuForCustomer,
} from '../controllers/customer.contoller';
import { searchVendors } from '../controllers/vendor.contoller';

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

export default router;
