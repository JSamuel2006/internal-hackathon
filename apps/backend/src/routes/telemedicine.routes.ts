import { Router } from 'express';
import { createTelemedicineSession, getTelemedicineHistory } from '../controllers/telemedicineController.js';

const router = Router();

router.post('/create', createTelemedicineSession);
router.get('/history', getTelemedicineHistory);

export default router;
