import { Router } from 'express';
import { buyPlans, getPlans } from '../controllers/subscription.contoller';
import { requireRole } from '../middlewares/role.middleware';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/buy', authMiddleware, requireRole('customer'), buyPlans);
router.get('/my', authMiddleware, requireRole('customer'), getPlans);



export default router;
