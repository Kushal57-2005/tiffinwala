import { Router } from 'express';
import {
    registerCustomer,
    registerVendor,
    verifyEmailOTP,
    verifyPhoneOTP,
    loginCustomer,
    loginVendorStep1,
    loginVendorStep2,
    logout,
    getMe,
    forgetPassword,
    verifyResetOTP,
    resetPassword,
    changePassword,
    resendEmailOTP,
    resendPhoneOTP,
} from '../controllers/auth.controllers';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register/customer', registerCustomer);
router.post('/register/vendor', registerVendor);
router.post('/verify-phone-otp', verifyPhoneOTP);
router.post('/verify-email-otp', verifyEmailOTP);
router.post('/login/customer', loginCustomer);
router.post('/login/vendor', loginVendorStep1);
router.post('/login/vendor/verify-otp', loginVendorStep2);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);
router.post('/forget-password', forgetPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);
router.post('/change-password', authMiddleware, changePassword);
router.post('/resend-email-otp', resendEmailOTP);
router.post('/resend-phone-otp', resendPhoneOTP);

export default router;
