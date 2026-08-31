import { Router } from 'express';
import { handleLogin, getCurrentUser, handleRegister, handleVerifyId } from '../controllers/authController.js';

const router = Router();

router.post('/login', handleLogin);
router.get('/me', getCurrentUser);
router.post('/register', handleRegister);
router.post('/signup', handleRegister);
router.post('/verify-id', handleVerifyId);

export default router;
