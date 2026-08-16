import { appointmentRepository, AppointmentEntity, TreatmentPlanEntity } from '../repositories/appointmentRepository.js';
import { doctorService } from './doctorService.js';
import { hospitalService } from './hospitalService.js';

export class AppointmentService {
  async bookAppointment(userId: string, data: { doctorId: string; hospitalId: string; date: string; time: string }): Promise<AppointmentEntity> {
    // Seed doctors/hospitals if needed
    await doctorService.listDoctors();

    const app: AppointmentEntity = {
      id: `app-${Date.now()}`,
      userId,
      doctorId: data.doctorId,
      hospitalId: data.hospitalId,
      date: data.date,
      time: data.time,
      status: 'Pending'
    };
    return appointmentRepository.create(app);
  }

  async listAppointments(userId?: string): Promise<AppointmentEntity[]> {
    if (userId) {
      return appointmentRepository.findByUserId(userId);
    }
    return appointmentRepository.findAll();
  }

  async cancelAppointment(id: string): Promise<void> {
    await appointmentRepository.updateStatus(id, 'Cancelled');
  }

  async rescheduleAppointment(id: string, date: string, time: string): Promise<AppointmentEntity | null> {
    const app = await appointmentRepository.findById(id);
    if (!app) return null;
    app.date = date;
    app.time = time;
    app.status = 'Rescheduled';
    await appointmentRepository.create(app); // Insert updated
    return app;
  }

  async createTreatmentPlan(userId: string, doctorId: string, notes: string, medicines: string): Promise<TreatmentPlanEntity> {
    const plan: TreatmentPlanEntity = {
      id: `plan-${Date.now()}`,
      userId,
      doctorId,
      clinicalNotes: notes,
      medicines
    };
    return appointmentRepository.createTreatmentPlan(plan);
  }

  async getTreatmentPlans(userId: string): Promise<TreatmentPlanEntity[]> {
    return appointmentRepository.findTreatmentPlansByUserId(userId);
  }
}

export const appointmentService = new AppointmentService();
