import { Router } from 'express';
import { 
  getInventory, 
  dispenseMedicine, 
  getPrescriptions, 
  checkInteractions, 
  getPharmacies,
  getGenericComparison,
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  getInteractions,
  getNearby,
  sharePrescription,
  getPrescriptionPDF,
  postRefill
} from '../controllers/pharmacyController.js';

const router = Router();

router.get('/', getPharmacies);
router.get('/inventory', getInventory);
router.post('/dispense', dispenseMedicine);
router.get('/prescriptions', getPrescriptions);
router.post('/check-interactions', checkInteractions);
router.get('/generic-comparison/:id', getGenericComparison);
router.get('/reminders', getReminders);
router.post('/reminders', createReminder);
router.put('/reminders/:id', updateReminder);
router.delete('/reminders/:id', deleteReminder);
router.get('/interactions', getInteractions);
router.get('/nearby', getNearby);
router.post('/share', sharePrescription);
router.get('/prescription/:id/pdf', getPrescriptionPDF);
router.post('/refill/:id', postRefill);

export default router;
