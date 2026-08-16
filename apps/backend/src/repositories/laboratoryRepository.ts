import { pool } from '../database/db.js';

export interface LabEntity {
  id: string;
  name: string;
  address?: string;
  createdAt?: Date;
}

export interface LabOrderEntity {
  id: string;
  userId: string;
  labId: string;
  testName: string;
  status: string;
  result?: string;
  createdAt?: Date;
  labName?: string;
}

function mapLabRow(r: any): LabEntity {
  return {
    id: r.id,
    name: r.name,
    address: r.address,
    createdAt: r.created_at
  };
}

function mapOrderRow(r: any): LabOrderEntity {
  return {
    id: r.id,
    userId: r.user_id,
    labId: r.lab_id,
    testName: r.test_name,
    status: r.status,
    result: r.result,
    createdAt: r.created_at,
    labName: r.lab_name
  };
}

export class LaboratoryRepository {
  async findAllLabs(): Promise<LabEntity[]> {
    const res = await pool.query('SELECT * FROM laboratories ORDER BY name ASC');
    return res.rows.map(mapLabRow);
  }

  async createLab(data: LabEntity): Promise<LabEntity> {
    await pool.query('INSERT INTO laboratories (id, name, address) VALUES ($1, $2, $3)', [data.id, data.name, data.address]);
    return data;
  }

  async findOrdersByUserId(userId: string): Promise<LabOrderEntity[]> {
    const res = await pool.query(`
      SELECT o.*, l.name as lab_name
      FROM lab_orders o
      LEFT JOIN laboratories l ON o.lab_id = l.id
      WHERE o.user_id = $1
      ORDER BY o.created_at DESC
    `, [userId]);
    return res.rows.map(mapOrderRow);
  }

  async createOrder(data: LabOrderEntity): Promise<LabOrderEntity> {
    await pool.query(
      `INSERT INTO lab_orders (id, user_id, lab_id, test_name, status, result) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [data.id, data.userId, data.labId, data.testName, data.status, data.result || '']
    );
    return data;
  }

  async updateOrderResult(id: string, result: string, status: string): Promise<void> {
    await pool.query('UPDATE lab_orders SET result = $1, status = $2 WHERE id = $3', [result, status, id]);
  }
}

export const laboratoryRepository = new LaboratoryRepository();
