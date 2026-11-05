import { Router } from 'express';
import { login, me, register, resendUnlock, resetPassword, skipPasswordReset, verifyUnlock } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.post('/verify-unlock', verifyUnlock);
router.post('/resend-unlock', resendUnlock);
router.post('/reset-password', resetPassword);
router.post('/skip-password-reset', skipPasswordReset);
router.get('/me', authMiddleware, me);
export default router;
