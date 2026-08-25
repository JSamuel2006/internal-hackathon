import { Router } from 'express';
import { getCitizens, registerCitizen, saveScreening, syncScreenings, getStats, getCitizenHistory } from '../controllers/workerController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/citizens', getCitizens);
router.post('/citizens', registerCitizen);
router.post('/screenings', saveScreening);
router.post('/screenings/sync', syncScreenings);
router.get('/stats', getStats);
router.get('/citizen/:citizenId/history', getCitizenHistory);

export default router;
