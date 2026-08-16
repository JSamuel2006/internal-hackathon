import { Request, Response, NextFunction } from 'express';
import { pool } from '../database/db.js';
import { logger } from '../logging/logger.js';

export async function getFamilyMembers(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = 'usr-901';
    const list = await pool.query('SELECT * FROM family_members WHERE owner_user_id = $1', [userId]);
    return res.status(200).json({ success: true, data: list.rows });
  } catch (error) {
    next(error);
  }
}

export async function createFamilyMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, relationship, gender, dob, bloodGroup, abhaId, allergies, conditions } = req.body;
    const id = `fam-${Date.now()}`;
    await pool.query(
      `INSERT INTO family_members (id, owner_user_id, member_name, relationship, gender, date_of_birth, blood_group, abha_id, allergies, chronic_conditions) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [id, 'usr-901', name, relationship, gender, dob, bloodGroup, abhaId, allergies || '', conditions || '']
    );
    return res.status(201).json({ success: true, message: 'Family member profile created', data: { id } });
  } catch (error) {
    next(error);
  }
}

export async function deleteFamilyMember(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM family_members WHERE id = $1', [id]);
    return res.status(200).json({ success: true, message: 'Family member removed successfully' });
  } catch (error) {
    next(error);
  }
}
export async function getFamilyMemberTwin(req: Request, res: Response, next: NextFunction) {
  try {
    return res.status(200).json({
      success: true,
      data: { overallScore: 84, cardiacScore: 86, kidneyScore: 92 }
    });
  } catch (error) {
    next(error);
  }
}
