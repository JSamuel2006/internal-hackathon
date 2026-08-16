import { Request, Response, NextFunction } from 'express';
import { doctorService } from '../services/doctorService.js';

export async function getDoctors(req: Request, res: Response, next: NextFunction) {
  try {
    const { hospitalId } = req.query;
    const list = await doctorService.listDoctors(hospitalId as string);
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function getDoctorById(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await doctorService.getDoctorById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Doctor not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function getDoctorProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id || 'doc-demo';
    // Resolve user ID to doctor ID (e.g. if the user ID is the logged-in user for doctor@arogyamitra.demo)
    const resolvedId = userId.startsWith('usr-') ? 'doc-demo' : userId;
    const item = await doctorService.getDoctorById(resolvedId);
    if (!item) return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function updateAvailability(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.id || 'doc-demo';
    const resolvedId = userId.startsWith('usr-') ? 'doc-demo' : userId;
    const { availability } = req.body;
    if (!availability) {
      return res.status(400).json({ success: false, message: 'availability is required' });
    }
    await doctorService.updateAvailability(resolvedId, availability);
    return res.status(200).json({ success: true, message: `Availability updated to ${availability}` });
  } catch (error) {
    next(error);
  }
}
