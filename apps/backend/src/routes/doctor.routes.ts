import { Router } from 'express';
import { getDoctors, getDoctorById, getDoctorProfile, updateAvailability } from '../controllers/doctorController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getDoctors);
router.get('/profile', authenticateJWT, getDoctorProfile);
router.post('/availability', authenticateJWT, updateAvailability);
router.get('/:id', getDoctorById);

export default router;
