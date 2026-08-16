import { Request, Response, NextFunction } from 'express';
import { pool } from '../database/db.js';
import { logger } from '../logging/logger.js';

export async function createTelemedicineSession(req: Request, res: Response, next: NextFunction) {
  try {
    const { doctorId, appointmentId } = req.body;
    const id = `tele-${Date.now()}`;
    const link = `https://meet.arogyaverse.ai/consult/${id}`;
    
    await pool.query(
      `INSERT INTO telemedicine_sessions (id, patient_id, doctor_id, appointment_id, meeting_link, session_status) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, 'usr-901', doctorId, appointmentId, link, 'Waiting']
    );

    return res.status(201).json({ success: true, data: { id, meetingLink: link } });
  } catch (error) {
    next(error);
  }
}

export async function getTelemedicineHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const sessions = await pool.query('SELECT * FROM telemedicine_sessions WHERE patient_id = $1 ORDER BY created_at DESC', ['usr-901']);
    return res.status(200).json({ success: true, data: sessions.rows });
  } catch (error) {
    next(error);
  }
}
