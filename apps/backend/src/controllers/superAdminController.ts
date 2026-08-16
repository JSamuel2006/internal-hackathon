import { Request, Response, NextFunction } from 'express';
import { pool } from '../database/db.js';
import { logger } from '../logging/logger.js';

export async function getSystemHealth(req: Request, res: Response, next: NextFunction) {
  try {
    return res.status(200).json({
      success: true,
      data: {
        cpuUsage: '12%',
        memoryUsage: '3.2 GB / 8.0 GB',
        storageUsage: '14 GB / 50 GB',
        databaseStatus: 'Healthy',
        apiLatency: '42ms'
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAuditLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const list = await pool.query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 50');
    return res.status(200).json({ success: true, data: list.rows });
  } catch (error) {
    next(error);
  }
}
export async function logAuditEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const { action, module } = req.body;
    const id = `aud-${Date.now()}`;
    await pool.query(
      `INSERT INTO audit_logs (id, user_id, role, module, action) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, 'usr-901', 'Citizen', module, action]
    );
    return res.status(201).json({ success: true, message: 'Audit event written successfully' });
  } catch (error) {
    next(error);
  }
}
