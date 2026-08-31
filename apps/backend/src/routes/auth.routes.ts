import { Router } from 'express';
import { handleLogin, getCurrentUser, handleRegister } from '../controllers/authController.js';

const router = Router();

router.post('/login', handleLogin);
router.get('/me', getCurrentUser);
router.post('/register', handleRegister);
router.post('/signup', handleRegister);

export default router;
