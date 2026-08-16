import { pool } from '../database/db.js';
import { MedicalReportEntity } from '../database/models/medicalReportModel.js';
import { logger } from '../logging/logger.js';

// ─────────────────────────────────────────────────────────────
// Helper: map a raw PostgreSQL row to MedicalReportEntity
// ─────────────────────────────────────────────────────────────
function mapRow(r: any): MedicalReportEntity {
  return {
    id: r.id,
    userId: r.user_id,
    reportName: r.report_name,
    reportType: r.report_type,
    hospitalName: r.hospital_name,
    doctorName: r.doctor_name,
    reportDate: r.report_date,
    fileName: r.file_name,
    fileUrl: r.file_url,
    fileType: r.file_type,
    ocrText: r.ocr_text,
    structuredJson: r.structured_json,
    geminiAnalysis: r.gemini_analysis,
    abnormalValues: r.abnormal_values,
    healthScore: r.health_score,
    riskLevel: r.risk_level,
    specialistRecommended: r.specialist_recommended,
    confidenceScore: r.confidence_score,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class MedicalReportRepository {
  // ───────────────────────────────────────────────────────────
  // create() — INSERT a new report. Throws on any failure.
  // ───────────────────────────────────────────────────────────
  public async create(data: MedicalReportEntity): Promise<MedicalReportEntity> {
    // Sanitize numeric fields — PostgreSQL INTEGER columns reject JS floats
    const healthScore = data.healthScore != null ? Math.round(Number(data.healthScore)) : null;
    const confidenceScore = data.confidenceScore != null ? Math.round(Number(data.confidenceScore)) : null;

    logger.info({
      tag: '[REPOSITORY]',
      message: '📥 Executing INSERT to PostgreSQL medical_reports',
      id: data.id,
      userId: data.userId,
      healthScore,
      confidenceScore,
    });

    try {
      await pool.query(
        `INSERT INTO medical_reports (
          id, user_id, report_name, report_type, hospital_name, doctor_name, report_date,
          file_name, file_url, file_type, ocr_text, structured_json, gemini_analysis,
          abnormal_values, health_score, risk_level, specialist_recommended, confidence_score, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
        [
          data.id,
          data.userId,
          data.reportName    ?? null,
          data.reportType    ?? null,
          data.hospitalName  ?? null,
          data.doctorName    ?? null,
          data.reportDate    ?? null,
          data.fileName      ?? null,
          data.fileUrl       ?? null,
          data.fileType      ?? null,
          data.ocrText       ?? null,
          data.structuredJson ?? null,
          data.geminiAnalysis ?? null,
          data.abnormalValues ?? null,
          healthScore,
          data.riskLevel              ?? null,
          data.specialistRecommended  ?? null,
          confidenceScore,
          data.status ?? null,
        ]
      );
      logger.info({
        tag: '[INSERT_SUCCESS]',
        message: '✅ Report persisted to PostgreSQL',
        id: data.id,
        userId: data.userId,
      });
      return data;
    } catch (err: any) {
      logger.error({
        tag: '[INSERT_FAILED]',
        message: '❌ PostgreSQL INSERT rejected',
        id: data.id,
        userId: data.userId,
        pgCode: err.code,
        pgDetail: err.detail,
        pgConstraint: err.constraint,
        error: err.message,
      });
      throw new Error(`Database write failed for report ${data.id}: ${err.message}`);
    }
  }

  // ───────────────────────────────────────────────────────────
  // findByUserId() — Returns [] if no records; throws on DB error
  // ───────────────────────────────────────────────────────────
  public async findByUserId(userId: string): Promise<MedicalReportEntity[]> {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM medical_reports WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC',
        [userId]
      );
      return rows.map(mapRow);
    } catch (err: any) {
      logger.error({
        tag: '[REPOSITORY]',
        message: '❌ PostgreSQL SELECT failed in findByUserId',
        userId,
        error: err.message,
        pgCode: err.code,
      });
      throw new Error(`Database read failed for userId ${userId}: ${err.message}`);
    }
  }

  // ───────────────────────────────────────────────────────────
  // findById() — Returns null if not found; throws on DB error
  // ───────────────────────────────────────────────────────────
  public async findById(id: string): Promise<MedicalReportEntity | null> {
    try {
      const { rows } = await pool.query(
        'SELECT * FROM medical_reports WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      return rows.length > 0 ? mapRow(rows[0]) : null;
    } catch (err: any) {
      logger.error({
        tag: '[REPOSITORY]',
        message: '❌ PostgreSQL SELECT failed in findById',
        id,
        error: err.message,
        pgCode: err.code,
      });
      throw new Error(`Database read failed for report id ${id}: ${err.message}`);
    }
  }

  // ───────────────────────────────────────────────────────────
  // update() — Soft UPDATE of mutable fields; throws on failure
  // ───────────────────────────────────────────────────────────
  public async update(
    id: string,
    patch: Partial<Pick<MedicalReportEntity, 'status' | 'geminiAnalysis' | 'healthScore' | 'riskLevel' | 'specialistRecommended'>>
  ): Promise<MedicalReportEntity | null> {
    const sets: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (patch.status !== undefined)              { sets.push(`status = $${paramIdx++}`);                values.push(patch.status); }
    if (patch.geminiAnalysis !== undefined)      { sets.push(`gemini_analysis = $${paramIdx++}`);       values.push(patch.geminiAnalysis); }
    if (patch.healthScore !== undefined)         { sets.push(`health_score = $${paramIdx++}`);          values.push(Math.round(Number(patch.healthScore))); }
    if (patch.riskLevel !== undefined)           { sets.push(`risk_level = $${paramIdx++}`);            values.push(patch.riskLevel); }
    if (patch.specialistRecommended !== undefined) { sets.push(`specialist_recommended = $${paramIdx++}`); values.push(patch.specialistRecommended); }

    if (sets.length === 0) return this.findById(id);

    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    try {
      const { rows } = await pool.query(
        `UPDATE medical_reports SET ${sets.join(', ')} WHERE id = $${paramIdx} AND deleted_at IS NULL RETURNING *`,
        values
      );
      return rows.length > 0 ? mapRow(rows[0]) : null;
    } catch (err: any) {
      logger.error({
        tag: '[REPOSITORY]',
        message: '❌ PostgreSQL UPDATE failed',
        id,
        error: err.message,
        pgCode: err.code,
      });
      throw new Error(`Database update failed for report ${id}: ${err.message}`);
    }
  }

  // ───────────────────────────────────────────────────────────
  // delete() — Soft delete (sets deleted_at); throws on failure
  // ───────────────────────────────────────────────────────────
  public async delete(id: string): Promise<boolean> {
    try {
      const { rowCount } = await pool.query(
        'UPDATE medical_reports SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL',
        [id]
      );
      const deleted = (rowCount ?? 0) > 0;
      if (deleted) {
        logger.info({ tag: '[REPOSITORY]', message: '✅ Soft-deleted medical report', id });
      } else {
        logger.warn({ tag: '[REPOSITORY]', message: 'delete() — report not found or already deleted', id });
      }
      return deleted;
    } catch (err: any) {
      logger.error({
        tag: '[REPOSITORY]',
        message: '❌ PostgreSQL DELETE failed',
        id,
        error: err.message,
        pgCode: err.code,
      });
      throw new Error(`Database delete failed for report ${id}: ${err.message}`);
    }
  }
}

export const medicalReportRepository = new MedicalReportRepository();
