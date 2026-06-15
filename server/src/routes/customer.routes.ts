import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import {
    getNearbyVendors,
    getCustomerProfile,
    getVendorMenuForCustomer,
} from '../controllers/customer.contoller';
import { searchVendors } from '../controllers/vendor.contoller';

const router = Router();

router.get(
    '/profile',
    authMiddleware,
    requireRole('customer'),
    getCustomerProfile,
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
