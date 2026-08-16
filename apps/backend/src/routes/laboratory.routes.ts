import { Router } from 'express';
import { getLabOrders, placeLabOrder, addLabResult } from '../controllers/laboratoryController.js';

const router = Router();

router.get('/orders', getLabOrders);
router.post('/orders', placeLabOrder);
router.post('/results', addLabResult);

export default router;
