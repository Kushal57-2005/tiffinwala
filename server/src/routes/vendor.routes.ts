import { Router } from 'express';
import {
    createMenu,
    getTodaysMenu,
    getVendorProfile,
    toggleVendorOpen,
    updateVendorProfile,
} from '../controllers/vendor.contoller';
import { requireRole } from '../middlewares/role.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';
import { getNearbyVendors } from '../controllers/customer.contoller';

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

export default router;
