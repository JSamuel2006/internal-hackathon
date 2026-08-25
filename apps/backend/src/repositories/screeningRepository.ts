import { pool } from '../database/db.js';

export interface ScreeningRecord {
  id: string;
  client_record_id: string;
  worker_user_id: string;
  citizen_user_id: string;
  citizen_name: string;
  village: string;
  screening_date: Date;
  systolic: number | null;
  systolic_status: string;
  diastolic: number | null;
  diastolic_status: string;
  pulse: number | null;
  pulse_status: string;
  spo2: number | null;
  spo2_status: string;
  temperature: number | null;
  temperature_status: string;
  glucose: number | null;
  glucose_status: string;
  weight: number | null;
  weight_status: string;
  height: number | null;
  height_status: string;
  known_conditions: string; // JSON array
  allergies: string; // JSON array
  current_medicines: string; // JSON array
  symptoms: string; // JSON array
  risk_flags: string; // JSON array
  risk_level: string;
  created_at?: Date;
}

export class ScreeningRepository {
  public async create(record: ScreeningRecord): Promise<ScreeningRecord> {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO screening_records (
          id, client_record_id, worker_user_id, citizen_user_id, citizen_name, village, screening_date,
          systolic, systolic_status, diastolic, diastolic_status, pulse, pulse_status, spo2, spo2_status,
          temperature, temperature_status, glucose, glucose_status, weight, weight_status, height, height_status,
          known_conditions, allergies, current_medicines, symptoms, risk_flags, risk_level
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23,
          $24, $25, $26, $27, $28, $29
        )
        ON CONFLICT (client_record_id) DO NOTHING
        RETURNING *;
      `;
      const values = [
        record.id, record.client_record_id, record.worker_user_id, record.citizen_user_id, record.citizen_name, record.village, record.screening_date,
        record.systolic, record.systolic_status, record.diastolic, record.diastolic_status, record.pulse, record.pulse_status, record.spo2, record.spo2_status,
        record.temperature, record.temperature_status, record.glucose, record.glucose_status, record.weight, record.weight_status, record.height, record.height_status,
        record.known_conditions, record.allergies, record.current_medicines, record.symptoms, record.risk_flags, record.risk_level
      ];
      const res = await client.query(query, values);
      return res.rows[0] || record;
    } finally {
      client.release();
    }
  }

  public async findByCitizenId(citizenId: string): Promise<ScreeningRecord[]> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM screening_records 
        WHERE citizen_user_id = $1 
        ORDER BY screening_date DESC;
      `;
      const res = await client.query(query, [citizenId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  public async findByWorkerId(workerId: string): Promise<ScreeningRecord[]> {
    const client = await pool.connect();
    try {
      const query = `
        SELECT * FROM screening_records 
        WHERE worker_user_id = $1 
        ORDER BY screening_date DESC;
      `;
      const res = await client.query(query, [workerId]);
      return res.rows;
    } finally {
      client.release();
    }
  }

  public async getStatsByWorker(workerId: string): Promise<{
    screenedToday: number;
    priorityCases: number;
  }> {
    const client = await pool.connect();
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayQuery = `
        SELECT COUNT(*) as count 
        FROM screening_records 
        WHERE worker_user_id = $1 AND screening_date >= $2;
      `;
      const priorityQuery = `
        SELECT COUNT(*) as count 
        FROM screening_records 
        WHERE worker_user_id = $1 AND risk_level IN ('PRIORITY', 'URGENT');
      `;

      const todayRes = await client.query(todayQuery, [workerId, todayStart]);
      const priorityRes = await client.query(priorityQuery, [workerId]);

      return {
        screenedToday: parseInt(todayRes.rows[0]?.count || '0', 10),
        priorityCases: parseInt(priorityRes.rows[0]?.count || '0', 10)
      };
    } finally {
      client.release();
    }
  }
}

export const screeningRepository = new ScreeningRepository();
