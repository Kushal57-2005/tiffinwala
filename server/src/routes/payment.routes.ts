import { Router } from 'express';
import {
    createVendorPaymentOrder,
    verifyVendorPayment,
} from '../controllers/payment.controllers';

const router = Router();

router.post('/create-order', createVendorPaymentOrder);
router.post('/verify', verifyVendorPayment);

export default router;
