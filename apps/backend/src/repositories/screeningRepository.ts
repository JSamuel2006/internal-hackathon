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

  public async getOverviewMetrics(): Promise<{
    totalScreenings: number;
    todayScreenings: number;
    thisWeekScreenings: number;
    referrals: {
      urgent: number;
      priority: number;
      needsReview: number;
      normal: number;
    };
    syncStats: {
      syncedRecords: number;
      unresolvedPriorityCases: number;
    };
  }> {
    const client = await pool.connect();
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);
      weekStart.setHours(0, 0, 0, 0);

      const totalRes = await client.query(`SELECT COUNT(*) as count FROM screening_records;`);
      const todayRes = await client.query(`SELECT COUNT(*) as count FROM screening_records WHERE screening_date >= $1;`, [todayStart]);
      const weekRes = await client.query(`SELECT COUNT(*) as count FROM screening_records WHERE screening_date >= $1;`, [weekStart]);

      const riskRes = await client.query(`
        SELECT risk_level, COUNT(*) as count 
        FROM screening_records 
        GROUP BY risk_level;
      `);

      let urgent = 0;
      let priority = 0;
      let needsReview = 0;
      let normal = 0;

      for (const row of riskRes.rows) {
        const rLevel = (row.risk_level || '').toUpperCase();
        const count = parseInt(row.count || '0', 10);
        if (rLevel === 'URGENT') urgent += count;
        else if (rLevel === 'PRIORITY') priority += count;
        else if (rLevel === 'NEEDS_REVIEW') needsReview += count;
        else if (rLevel === 'NORMAL') normal += count;
      }

      const total = parseInt(totalRes.rows[0]?.count || '0', 10);

      return {
        totalScreenings: total,
        todayScreenings: parseInt(todayRes.rows[0]?.count || '0', 10),
        thisWeekScreenings: parseInt(weekRes.rows[0]?.count || '0', 10),
        referrals: {
          urgent,
          priority,
          needsReview,
          normal,
        },
        syncStats: {
          syncedRecords: total,
          unresolvedPriorityCases: urgent + priority,
        },
      };
    } finally {
      client.release();
    }
  }

  public async getWorkerAggregations(): Promise<Array<{
    worker_user_id: string;
    total_screenings: number;
    today_screenings: number;
    last_activity_date: Date | null;
  }>> {
    const client = await pool.connect();
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const query = `
        SELECT 
          worker_user_id,
          COUNT(*) as total_screenings,
          COUNT(*) FILTER (WHERE screening_date >= $1) as today_screenings,
          MAX(screening_date) as last_activity_date
        FROM screening_records
        GROUP BY worker_user_id;
      `;

      const res = await client.query(query, [todayStart]);
      return res.rows.map(r => ({
        worker_user_id: r.worker_user_id,
        total_screenings: parseInt(r.total_screenings || '0', 10),
        today_screenings: parseInt(r.today_screenings || '0', 10),
        last_activity_date: r.last_activity_date ? new Date(r.last_activity_date) : null,
      }));
    } finally {
      client.release();
    }
  }

  public async findScreeningsFiltered(filters: {
    workerId?: string;
    riskLevel?: string;
    dateRange?: 'today' | 'week' | 'month' | 'all';
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ records: ScreeningRecord[]; total: number }> {
    const client = await pool.connect();
    try {
      const conditions: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      if (filters.workerId && filters.workerId !== 'ALL') {
        conditions.push(`worker_user_id = $${paramIdx++}`);
        values.push(filters.workerId);
      }

      if (filters.riskLevel && filters.riskLevel !== 'ALL') {
        conditions.push(`risk_level = $${paramIdx++}`);
        values.push(filters.riskLevel);
      }

      if (filters.dateRange && filters.dateRange !== 'all') {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        if (filters.dateRange === 'today') {
          conditions.push(`screening_date >= $${paramIdx++}`);
          values.push(d);
        } else if (filters.dateRange === 'week') {
          d.setDate(d.getDate() - 7);
          conditions.push(`screening_date >= $${paramIdx++}`);
          values.push(d);
        } else if (filters.dateRange === 'month') {
          d.setDate(d.getDate() - 30);
          conditions.push(`screening_date >= $${paramIdx++}`);
          values.push(d);
        }
      }

      if (filters.search && filters.search.trim()) {
        const q = '%' + filters.search.trim().toLowerCase() + '%';
        conditions.push(`(LOWER(citizen_name) LIKE $${paramIdx} OR LOWER(village) LIKE $${paramIdx})`);
        values.push(q);
        paramIdx++;
      }

      const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

      // Count query
      const countQuery = `SELECT COUNT(*) as total FROM screening_records ${whereClause};`;
      const countRes = await client.query(countQuery, values);
      const total = parseInt(countRes.rows[0]?.total || '0', 10);

      // Data query with pagination
      const limit = filters.limit ? Math.min(Math.max(filters.limit, 1), 100) : 20;
      const offset = filters.offset ? Math.max(filters.offset, 0) : 0;

      const dataQuery = `
        SELECT * FROM screening_records 
        ${whereClause}
        ORDER BY screening_date DESC
        LIMIT $${paramIdx++} OFFSET $${paramIdx++};
      `;
      values.push(limit, offset);

      const dataRes = await client.query(dataQuery, values);
      return {
        records: dataRes.rows,
        total,
      };
    } finally {
      client.release();
    }
  }
}

export const screeningRepository = new ScreeningRepository();
