import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireRole } from '../middlewares/role.middleware';
import { getAllRating, rateVendor } from '../controllers/rating.controllers';

const router = Router();

router.post('/', authMiddleware, requireRole('customer'), rateVendor);
router.get('/vendor/:vendorId', authMiddleware, getAllRating);

export default router;
