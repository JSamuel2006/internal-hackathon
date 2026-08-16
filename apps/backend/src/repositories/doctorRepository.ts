import { pool } from '../database/db.js';

export interface DoctorEntity {
  id: string;
  hospitalId: string;
  name: string;
  specialty: string;
  availability: string;
  createdAt?: Date;
}

function mapRow(r: any): DoctorEntity {
  return {
    id: r.id,
    hospitalId: r.hospital_id,
    name: r.name,
    specialty: r.specialty,
    availability: r.availability,
    createdAt: r.created_at
  };
}

export class DoctorRepository {
  async findAll(): Promise<DoctorEntity[]> {
    const res = await pool.query('SELECT * FROM doctors ORDER BY name ASC');
    return res.rows.map(mapRow);
  }

  async findByHospital(hospitalId: string): Promise<DoctorEntity[]> {
    const res = await pool.query('SELECT * FROM doctors WHERE hospital_id = $1 ORDER BY name ASC', [hospitalId]);
    return res.rows.map(mapRow);
  }

  async findById(id: string): Promise<DoctorEntity | null> {
    const res = await pool.query('SELECT * FROM doctors WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    return mapRow(res.rows[0]);
  }

  async create(data: DoctorEntity): Promise<DoctorEntity> {
    await pool.query(
      `INSERT INTO doctors (id, hospital_id, name, specialty, availability) 
       VALUES ($1, $2, $3, $4, $5)`,
      [data.id, data.hospitalId, data.name, data.specialty, data.availability]
    );
    return data;
  }

  async updateAvailability(id: string, availability: string): Promise<void> {
    await pool.query('UPDATE doctors SET availability = $1 WHERE id = $2', [availability, id]);
  }
}

export const doctorRepository = new DoctorRepository();
