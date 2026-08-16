import { Request, Response, NextFunction } from 'express';
import { appointmentService } from '../services/appointmentService.js';

export async function bookAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const { doctorId, hospitalId, date, time } = req.body;
    const item = await appointmentService.bookAppointment('usr-901', { doctorId, hospitalId, date, time });
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function getAppointments(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await appointmentService.listAppointments('usr-901');
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function cancelAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    await appointmentService.cancelAppointment(req.params.id);
    return res.status(200).json({ success: true, message: 'Appointment cancelled' });
  } catch (error) {
    next(error);
  }
}

export async function rescheduleAppointment(req: Request, res: Response, next: NextFunction) {
  try {
    const { date, time } = req.body;
    const item = await appointmentService.rescheduleAppointment(req.params.id, date, time);
    if (!item) return res.status(404).json({ success: false, message: 'Appointment not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function addTreatmentPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId = 'usr-901', doctorId, clinicalNotes, medicines } = req.body;
    const item = await appointmentService.createTreatmentPlan(userId, doctorId, clinicalNotes, medicines);
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function getTreatmentPlans(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await appointmentService.getTreatmentPlans('usr-901');
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}
