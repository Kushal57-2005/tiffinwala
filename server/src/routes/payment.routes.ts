import { Router } from 'express';
import {
  addMoneyToWallet,
  createVendorPaymentOrder,
  verifyAddMoneyToWallet,
  verifyVendorPayment,
} from '../controllers/payment.controllers';

const router = Router();

router.post('/create-order', createVendorPaymentOrder);
router.post('/verify', verifyVendorPayment);
router.post('/add-wallet', addMoneyToWallet);
router.post('/verify-wallet', verifyAddMoneyToWallet);

export default router;
