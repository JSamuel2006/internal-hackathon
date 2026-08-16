import { pool } from '../database/db.js';

export interface AppointmentEntity {
  id: string;
  userId: string;
  doctorId: string;
  hospitalId: string;
  date: string;
  time: string;
  status: string;
  createdAt?: Date;
  doctorName?: string;
  hospitalName?: string;
}

export interface TreatmentPlanEntity {
  id: string;
  userId: string;
  doctorId: string;
  clinicalNotes: string;
  medicines: string;
  createdAt?: Date;
}

function mapRow(r: any): AppointmentEntity {
  return {
    id: r.id,
    userId: r.user_id,
    doctorId: r.doctor_id,
    hospitalId: r.hospital_id,
    date: r.date,
    time: r.time,
    status: r.status,
    createdAt: r.created_at,
    doctorName: r.doctor_name,
    hospitalName: r.hospital_name
  };
}

export class AppointmentRepository {
  async findAll(): Promise<AppointmentEntity[]> {
    const res = await pool.query(`
      SELECT a.*, d.name as doctor_name, h.name as hospital_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      ORDER BY a.created_at DESC
    `);
    return res.rows.map(mapRow);
  }

  async findByUserId(userId: string): Promise<AppointmentEntity[]> {
    const res = await pool.query(`
      SELECT a.*, d.name as doctor_name, h.name as hospital_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      WHERE a.user_id = $1
      ORDER BY a.created_at DESC
    `, [userId]);
    return res.rows.map(mapRow);
  }

  async findById(id: string): Promise<AppointmentEntity | null> {
    const res = await pool.query(`
      SELECT a.*, d.name as doctor_name, h.name as hospital_name
      FROM appointments a
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN hospitals h ON a.hospital_id = h.id
      WHERE a.id = $1
    `, [id]);
    if (res.rows.length === 0) return null;
    return mapRow(res.rows[0]);
  }

  async create(data: AppointmentEntity): Promise<AppointmentEntity> {
    await pool.query(
      `INSERT INTO appointments (id, user_id, doctor_id, hospital_id, date, time, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [data.id, data.userId, data.doctorId, data.hospitalId, data.date, data.time, data.status]
    );
    return data;
  }

  async updateStatus(id: string, status: string): Promise<void> {
    await pool.query('UPDATE appointments SET status = $1 WHERE id = $2', [status, id]);
  }

  async createTreatmentPlan(data: TreatmentPlanEntity): Promise<TreatmentPlanEntity> {
    await pool.query(
      `INSERT INTO treatment_plans (id, user_id, doctor_id, clinical_notes, medicines) 
       VALUES ($1, $2, $3, $4, $5)`,
      [data.id, data.userId, data.doctorId, data.clinicalNotes, data.medicines]
    );
    return data;
  }

  async findTreatmentPlansByUserId(userId: string): Promise<TreatmentPlanEntity[]> {
    const res = await pool.query('SELECT * FROM treatment_plans WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      doctorId: r.doctor_id,
      clinicalNotes: r.clinical_notes,
      medicines: r.medicines,
      createdAt: r.created_at
    }));
  }
}

export const appointmentRepository = new AppointmentRepository();
