import { Request, Response, NextFunction } from 'express';
import { officerAshaService } from '../services/officerAshaService.js';

export async function getAshaOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const overview = await officerAshaService.getOverview();
    return res.status(200).json({ success: true, data: overview });
  } catch (error) {
    next(error);
  }
}

export async function getAshaWorkers(req: Request, res: Response, next: NextFunction) {
  try {
    const workers = await officerAshaService.getWorkers();
    return res.status(200).json({ success: true, data: workers });
  } catch (error) {
    next(error);
  }
}

export async function getAshaScreenings(req: Request, res: Response, next: NextFunction) {
  try {
    const { workerId, riskLevel, dateRange, search, limit, offset } = req.query;

    const result = await officerAshaService.getScreenings({
      workerId: workerId ? String(workerId) : undefined,
      riskLevel: riskLevel ? String(riskLevel) : undefined,
      dateRange: dateRange as any,
      search: search ? String(search) : undefined,
      limit: limit ? parseInt(String(limit), 10) : 20,
      offset: offset ? parseInt(String(offset), 10) : 0,
    });

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}
