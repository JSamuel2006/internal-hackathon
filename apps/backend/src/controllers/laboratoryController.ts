import { Request, Response, NextFunction } from 'express';
import { laboratoryService } from '../services/laboratoryService.js';

export async function getLabOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await laboratoryService.listOrders('usr-901');
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
}

export async function placeLabOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const { labId, testName } = req.body;
    const item = await laboratoryService.placeOrder('usr-901', { labId, testName });
    return res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
}

export async function addLabResult(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId, result } = req.body;
    const aiResponse = await laboratoryService.addResultAndQueryAI(orderId, result);
    return res.status(200).json({ success: true, data: aiResponse });
  } catch (error) {
    next(error);
  }
}
