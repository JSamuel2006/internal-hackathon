import { pool } from '../database/db.js';

export interface PharmacyEntity {
  id: string;
  name: string;
  address?: string;
}

export interface MedicineInventoryEntity {
  id: string;
  pharmacyId: string;
  name: string;
  stockCount: number;
  expiryDate: string;
}

export interface PrescriptionEntity {
  id: string;
  userId: string;
  doctorId: string;
  medicines: string;
  status: string;
  createdAt?: Date;
  doctorName?: string;
}

function mapPharmacyRow(r: any): PharmacyEntity {
  return { id: r.id, name: r.name, address: r.address };
}

function mapInventoryRow(r: any): MedicineInventoryEntity {
  return {
    id: r.id,
    pharmacyId: r.pharmacy_id,
    name: r.name,
    stockCount: r.stock_count,
    expiryDate: r.expiry_date
  };
}

export class PharmacyRepository {
  async findAllPharmacies(): Promise<PharmacyEntity[]> {
    const res = await pool.query('SELECT * FROM pharmacies ORDER BY name ASC');
    return res.rows.map(mapPharmacyRow);
  }

  async createPharmacy(data: PharmacyEntity): Promise<PharmacyEntity> {
    await pool.query('INSERT INTO pharmacies (id, name, address) VALUES ($1, $2, $3)', [data.id, data.name, data.address]);
    return data;
  }

  async findInventory(pharmacyId?: string): Promise<MedicineInventoryEntity[]> {
    const queryStr = pharmacyId 
      ? 'SELECT * FROM medicine_inventory WHERE pharmacy_id = $1 ORDER BY name ASC'
      : 'SELECT * FROM medicine_inventory ORDER BY name ASC';
    const params = pharmacyId ? [pharmacyId] : [];
    const res = await pool.query(queryStr, params);
    return res.rows.map(mapInventoryRow);
  }

  async createInventory(data: MedicineInventoryEntity): Promise<MedicineInventoryEntity> {
    await pool.query(
      `INSERT INTO medicine_inventory (id, pharmacy_id, name, stock_count, expiry_date) 
       VALUES ($1, $2, $3, $4, $5)`,
      [data.id, data.pharmacyId, data.name, data.stockCount, data.expiryDate]
    );
    return data;
  }

  async decrementStock(pharmacyId: string, medicineName: string, count: number): Promise<void> {
    await pool.query(
      'UPDATE medicine_inventory SET stock_count = GREATEST(0, stock_count - $1) WHERE pharmacy_id = $2 AND name = $3',
      [count, pharmacyId, medicineName]
    );
  }

  async findPrescriptionsByUserId(userId: string): Promise<PrescriptionEntity[]> {
    const res = await pool.query(`
      SELECT p.*, d.name as doctor_name
      FROM prescriptions p
      LEFT JOIN doctors d ON p.doctor_id = d.id
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC
    `, [userId]);
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      doctorId: r.doctor_id,
      medicines: r.medicines,
      status: r.status,
      createdAt: r.created_at,
      doctorName: r.doctor_name
    }));
  }

  async createPrescription(data: PrescriptionEntity): Promise<PrescriptionEntity> {
    await pool.query(
      `INSERT INTO prescriptions (id, user_id, doctor_id, medicines, status) 
       VALUES ($1, $2, $3, $4, $5)`,
      [data.id, data.userId, data.doctorId, data.medicines, data.status]
    );
    return data;
  }

  async updatePrescriptionStatus(id: string, status: string): Promise<void> {
    await pool.query('UPDATE prescriptions SET status = $1 WHERE id = $2', [status, id]);
  }

  async logDispensing(id: string, prescriptionId: string, pharmacyId: string): Promise<void> {
    await pool.query(
      'INSERT INTO medicine_dispensing (id, prescription_id, pharmacy_id) VALUES ($1, $2, $3)',
      [id, prescriptionId, pharmacyId]
    );
  }

  async findRemindersByUserId(userId: string): Promise<any[]> {
    const res = await pool.query('SELECT * FROM medicine_reminders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      medicineName: r.medicine_name,
      timeSlot: r.time_slot,
      status: r.status,
      createdAt: r.created_at
    }));
  }

  async createReminder(data: { id: string; userId: string; medicineName: string; timeSlot: string; status: string }): Promise<any> {
    await pool.query(
      `INSERT INTO medicine_reminders (id, user_id, medicine_name, time_slot, status) 
       VALUES ($1, $2, $3, $4, $5)`,
      [data.id, data.userId, data.medicineName, data.timeSlot, data.status]
    );
    return data;
  }

  async updateReminderStatus(id: string, status: string): Promise<void> {
    await pool.query('UPDATE medicine_reminders SET status = $1 WHERE id = $2', [status, id]);
  }

  async deleteReminder(id: string): Promise<void> {
    await pool.query('DELETE FROM medicine_reminders WHERE id = $1', [id]);
  }
}

export const pharmacyRepository = new PharmacyRepository();
