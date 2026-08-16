import { pool } from '../database/db.js';

export interface HospitalEntity {
  id: string;
  name: string;
  address?: string;
  bedOccupancy?: number;
  emergencyQueue?: number;
  createdAt?: Date;
}

function mapRow(r: any): HospitalEntity {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    bedOccupancy: r.bed_occupancy,
    emergencyQueue: r.emergency_queue,
    createdAt: r.created_at
  };
}

export class HospitalRepository {
  async findAll(): Promise<HospitalEntity[]> {
    const res = await pool.query('SELECT * FROM hospitals ORDER BY name ASC');
    return res.rows.map(mapRow);
  }

  async findById(id: string): Promise<HospitalEntity | null> {
    const res = await pool.query('SELECT * FROM hospitals WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return mapRow(res.rows[0]);
  }

  async create(data: HospitalEntity): Promise<HospitalEntity> {
    await pool.query(
      `INSERT INTO hospitals (id, name, address, bed_occupancy, emergency_queue) 
       VALUES ($1, $2, $3, $4, $5)`,
      [data.id, data.name, data.address, data.bedOccupancy || 0, data.emergencyQueue || 0]
    );
    return data;
  }
}

export const hospitalRepository = new HospitalRepository();
