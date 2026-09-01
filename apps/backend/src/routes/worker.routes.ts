import { Router } from 'express';
import { 
  getCitizens, registerCitizen, saveScreening, syncScreenings, getStats, getCitizenHistory,
  getAssignedPatients, getPatientProfile, getPatientHealthSummary, getPatientProactiveCare
} from '../controllers/workerController.js';
import { authenticateJWT, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

router.use(authenticateJWT);

router.get('/citizens', getCitizens);
router.post('/citizens', registerCitizen);
router.post('/screenings', saveScreening);
router.post('/screenings/sync', syncScreenings);
router.get('/stats', getStats);
router.get('/citizen/:citizenId/history', getCitizenHistory);

// ASHA Patient History & Proactive Care Routes (ROLE_WORKER required)
router.get('/patients', requireRole(['ROLE_WORKER']), getAssignedPatients);
router.get('/patients/:patientId', requireRole(['ROLE_WORKER']), getPatientProfile);
router.get('/patients/:patientId/summary', requireRole(['ROLE_WORKER']), getPatientHealthSummary);
router.get('/patients/:patientId/proactive-care', requireRole(['ROLE_WORKER']), getPatientProactiveCare);

export default router;
