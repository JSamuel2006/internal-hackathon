import { Router } from 'express';
import { getAshaOverview, getAshaWorkers, getAshaScreenings } from '../controllers/officerAshaController.js';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Secure all Officer ASHA endpoints: only ROLE_OFFICER and ROLE_ADMIN
router.use(authenticateJWT);
router.use(requireRole(['ROLE_OFFICER', 'ROLE_ADMIN']));

router.get('/overview', getAshaOverview);
router.get('/workers', getAshaWorkers);
router.get('/screenings', getAshaScreenings);

export default router;
