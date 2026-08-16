import { Request, Response, NextFunction } from 'express';
import { pool } from '../database/db.js';
import { logger } from '../logging/logger.js';

export async function registerPregnancy(req: Request, res: Response, next: NextFunction) {
  try {
    const { abhaId, edd, pregnancyRisk = 'Low' } = req.body;
    const profileId = `moth-${Date.now()}`;
    await pool.query(
      `INSERT INTO mother_profiles (id, user_id, abha_id, edd, pregnancy_risk) 
       VALUES ($1, $2, $3, $4, $5)`,
      [profileId, 'usr-901', abhaId, edd, pregnancyRisk]
    );

    // Schedule default vaccines
    const vaccines = [
      { name: 'Tetanus Toxoid (TT-1)', due: 'Trimester 1' },
      { name: 'Tetanus Toxoid (TT-2)', due: 'Trimester 2' },
      { name: 'Influenza Vaccine', due: 'Trimester 2' }
    ];

    for (const v of vaccines) {
      await pool.query(
        `INSERT INTO vaccination_records (id, profile_id, vaccine_name, status, due_date) 
         VALUES ($1, $2, $3, $4, $5)`,
        [`vac-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, profileId, v.name, 'Pending', v.due]
      );
    }

    return res.status(201).json({ success: true, message: 'Mother profile registered successfully', data: { profileId } });
  } catch (error) {
    next(error);
  }
}

export async function registerChild(req: Request, res: Response, next: NextFunction) {
  try {
    const { motherId, abhaId, name, birthDetails } = req.body;
    const childId = `chld-${Date.now()}`;
    await pool.query(
      `INSERT INTO child_profiles (id, mother_id, abha_id, name, birth_details) 
       VALUES ($1, $2, $3, $4, $5)`,
      [childId, motherId, abhaId, name, birthDetails]
    );

    // Seed default growth record
    await pool.query(
      `INSERT INTO growth_records (id, child_id, height, weight, bmi, percentile) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [`gro-${Date.now()}`, childId, 50, 3.2, 12.8, 50]
    );

    return res.status(201).json({ success: true, message: 'Child profile registered successfully', data: { childId } });
  } catch (error) {
    next(error);
  }
}

export async function getVaccinations(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const records = await pool.query('SELECT * FROM vaccination_records WHERE profile_id = $1', [id]);
    return res.status(200).json({ success: true, data: records.rows });
  } catch (error) {
    next(error);
  }
}

export async function getGrowthRecords(req: Request, res: Response, next: NextFunction) {
  try {
    const { childId } = req.params;
    const records = await pool.query('SELECT * FROM growth_records WHERE child_id = $1 ORDER BY created_at ASC', [childId]);
    return res.status(200).json({ success: true, data: records.rows });
  } catch (error) {
    next(error);
  }
}

export async function addVaccination(req: Request, res: Response, next: NextFunction) {
  try {
    const { profileId, vaccineName, dueDate } = req.body;
    const id = `vac-${Date.now()}`;
    await pool.query(
      `INSERT INTO vaccination_records (id, profile_id, vaccine_name, status, due_date) 
       VALUES ($1, $2, $3, $4, $5)`,
      [id, profileId, vaccineName, 'Pending', dueDate]
    );
    return res.status(201).json({ success: true, message: 'Vaccination scheduled' });
  } catch (error) {
    next(error);
  }
}
