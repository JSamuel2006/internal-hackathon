import { Router } from 'express';
import {
  bookAppointment,
  getAppointments,
  cancelAppointment,
  rescheduleAppointment,
  addTreatmentPlan,
  getTreatmentPlans
} from '../controllers/appointmentController.js';

const router = Router();

router.post('/', bookAppointment);
router.get('/', getAppointments);
router.delete('/:id', cancelAppointment);
router.put('/:id', rescheduleAppointment);
router.post('/treatment-plans', addTreatmentPlan);
router.get('/treatment-plans', getTreatmentPlans);

export default router;
