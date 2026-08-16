import { Request, Response, NextFunction } from 'express';
import { hospitalService } from '../services/hospitalService.js';

export async function getHospitals(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await hospitalService.listHospitals();
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function getHospitalById(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await hospitalService.getHospitalById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Hospital not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}
