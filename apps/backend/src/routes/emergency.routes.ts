import { Router } from 'express';
import { getEmergencyPassport, shareEmergencyPassport } from '../controllers/emergencyPassportController.js';

const router = Router();

router.get('/passport', getEmergencyPassport);
router.post('/share', shareEmergencyPassport);

export default router;
