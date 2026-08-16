import { Router } from 'express';
import { registerPregnancy, registerChild, getVaccinations, getGrowthRecords, addVaccination } from '../controllers/motherChildController.js';

const router = Router();

router.post('/pregnancy', registerPregnancy);
router.post('/child', registerChild);
router.get('/vaccinations/:id', getVaccinations);
router.post('/vaccinations', addVaccination);
router.get('/growth/:childId', getGrowthRecords);

export default router;
