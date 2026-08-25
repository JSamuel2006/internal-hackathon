import { Request, Response, NextFunction } from 'express';
import { workerService } from '../services/workerService.js';
import { userRepository } from '../repositories/userRepository.js';
import { screeningRepository } from '../repositories/screeningRepository.js';

export async function getCitizens(req: Request, res: Response, next: NextFunction) {
  try {
    const { query = '' } = req.query;
    let list;
    if (query) {
      list = await userRepository.findCitizenByNameOrAbha(String(query));
    } else {
      list = await userRepository.findAllCitizens();
    }
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function registerCitizen(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, age, gender, village, phone, emergency_contact } = req.body;
    if (!name || !age || !gender || !village) {
      return res.status(400).json({ success: false, message: 'Missing required demographic fields' });
    }
    const citizen = await workerService.registerCitizen({
      name, age, gender, village, phone, emergency_contact
    });
    return res.status(201).json({ success: true, data: citizen });
  } catch (error) {
    next(error);
  }
}

export async function saveScreening(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = (req as any).user?.sub || 'worker-demo';
    const result = await workerService.ingestScreening(workerId, req.body);
    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function syncScreenings(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = (req as any).user?.sub || 'worker-demo';
    const { screenings = [] } = req.body;
    const results = await workerService.syncScreenings(workerId, screenings);
    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
}

export async function getStats(req: Request, res: Response, next: NextFunction) {
  try {
    const workerId = (req as any).user?.sub || 'worker-demo';
    const stats = await screeningRepository.getStatsByWorker(workerId);
    return res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

export async function getCitizenHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const { citizenId } = req.params;
    const userRole = (req as any).user?.role || 'ROLE_CITIZEN';
    const userId = (req as any).user?.sub;

    // Check authorization: worker, doctor, or matching citizen
    if (userRole !== 'ROLE_WORKER' && userRole !== 'ROLE_DOCTOR' && userId !== citizenId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to screening records' });
    }

    const history = await screeningRepository.findByCitizenId(citizenId);
    return res.status(200).json({ success: true, data: history });
  } catch (error) {
    next(error);
  }
}
