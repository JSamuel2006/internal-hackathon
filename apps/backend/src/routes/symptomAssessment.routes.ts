import { Router } from 'express';
import { runSymptomAssessment } from '../controllers/symptomAssessmentController.js';

const router = Router();

router.post('/', runSymptomAssessment);

export default router;
