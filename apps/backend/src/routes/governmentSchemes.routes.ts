import { Router } from 'express';
import { getSchemes, checkEligibility } from '../controllers/governmentSchemeController.js';

const router = Router();

router.get('/', getSchemes);
router.post('/eligibility', checkEligibility);

export default router;
