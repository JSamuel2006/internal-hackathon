import { Request, Response, NextFunction } from 'express';
import { pool } from '../database/db.js';
import { logger } from '../logging/logger.js';

export async function syncWearableData(req: Request, res: Response, next: NextFunction) {
  try {
    const { heartRate, systolic, diastolic, spo2, glucose, steps, calories, deviceName } = req.body;
    const id = `wear-${Date.now()}`;
    await pool.query(
      `INSERT INTO wearable_health_logs (id, user_id, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, spo2, glucose, steps, calories, device_name) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, 'usr-901', heartRate, systolic, diastolic, spo2, glucose, steps, calories, deviceName || 'Smart Watch']
    );
    return res.status(201).json({ success: true, message: 'IoT Wearable data synchronized successfully' });
  } catch (error) {
    next(error);
  }
}

export async function getWearableTrends(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await pool.query('SELECT * FROM wearable_health_logs WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 30', ['usr-901']);
    return res.status(200).json({ success: true, data: list.rows });
  } catch (error) {
    next(error);
  }
}
