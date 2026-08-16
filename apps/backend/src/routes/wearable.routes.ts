import { Router } from 'express';
import { syncWearableData, getWearableTrends } from '../controllers/wearableController.js';

const router = Router();

router.post('/sync', syncWearableData);
router.get('/trends', getWearableTrends);

export default router;
