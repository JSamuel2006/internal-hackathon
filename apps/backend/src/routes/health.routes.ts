import { Router } from 'express';
import { handleGetTimeline } from '../controllers/healthController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

// Secure chronological health timeline history
router.get('/timeline', authenticateJWT, handleGetTimeline);

export default router;
