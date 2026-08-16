/**
 * emergencyPharmacyService.ts
 * Phase C — ArogyaMitra Emergency Pharmacy Assistance
 *
 * SAFETY RULES:
 *  - NEVER automatically prescribe or recommend medication
 *  - NEVER expose patient medical history without consent
 *  - Pharmacist makes ALL clinical decisions independently
 *  - AI (Gemini) may structure/summarize only — no medication instructions
 *  - HIGH priority emergencies always shown with escalation warning
 */

import { pool } from '../database/db.js';
import { logger } from '../logging/logger.js';
import { pharmacyRepository } from '../repositories/pharmacyRepository.js';
import { geminiService } from './ai-services/geminiService.js';

// ─── Constants ────────────────────────────────────────────────
const ASSISTANCE_DETAIL_MAX_LENGTH = 1000;
const MAX_PHARMACY_ALERTS_PER_SESSION = 5;
const VALID_STATUSES = ['ALERTED', 'ACKNOWLEDGED', 'PREPARING', 'ASSISTANCE_READY', 'REJECTED', 'ESCALATED', 'RESOLVED', 'CANCELLED'];

// ─── Interfaces ───────────────────────────────────────────────

export interface PharmacyAlertEntity {
  id: string;
  emergencyId: string;
  pharmacyId: string;
  pharmacyName?: string;
  status: string;
  assistanceDetails: string;
  pharmacistId?: string;
  notifiedAt: Date;
  acknowledgedAt?: Date;
  preparedAt?: Date;
  rejectedAt?: Date;
  escalatedAt?: Date;
  resolvedAt?: Date;
  classification?: { category: string; priority: string };
  symptoms?: string[];
  warnings?: string[];
  safetyNotice: string;
}

export interface NearbyPharmacy {
  id: string;
  name: string;
  address?: string;
  distanceKm?: number;
  emergencyAvailable: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────

function makeError(message: string, status: number): any {
  const err: any = new Error(message);
  err.status = status;
  return err;
}

const SAFETY_NOTICE = 'IMPORTANT: A qualified pharmacist must independently assess the situation and determine appropriate assistance according to professional judgment and applicable regulations. This system does NOT prescribe, dispense, or recommend any medication.';

// ─── Service ──────────────────────────────────────────────────

export class EmergencyPharmacyService {

  // ── Step 1: Nearby pharmacies ────────────────────────────────

  async getNearbyPharmacies(params: {
    latitude: number;
    longitude: number;
    radiusKm?: number;
  }): Promise<NearbyPharmacy[]> {
    const { latitude, longitude } = params;

    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw makeError('Invalid coordinates provided', 400);
    }

    // Reuse pharmacyRepository — no duplication
    const all = await pharmacyRepository.findAllPharmacies();

    return all.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      // In a real system this would use PostGIS / Haversine; for demo we simulate distance
      distanceKm: parseFloat((Math.random() * 4 + 0.5).toFixed(1)),
      emergencyAvailable: true,
    }));
  }

  // ── Step 2: Create pharmacy alert (Citizen) ───────────────────

  async createAlert(params: {
    sessionId: string;
    requestingUserId: string;
    pharmacyId: string;
    eta?: string;
    distance?: string;
  }): Promise<PharmacyAlertEntity> {
    const { sessionId, requestingUserId, pharmacyId, eta, distance } = params;

    // Verify session ownership
    await this._verifySessionOwnership(sessionId, requestingUserId);

    // Validate pharmacy ID
    if (!pharmacyId || typeof pharmacyId !== 'string' || pharmacyId.trim().length === 0) {
      throw makeError('Invalid pharmacyId', 400);
    }

    // Rate limit: max alerts per session
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM emergency_pharmacy_alerts WHERE emergency_id = $1 AND status != 'CANCELLED'`,
      [sessionId]
    );
    if (parseInt(countRes.rows[0].count, 10) >= MAX_PHARMACY_ALERTS_PER_SESSION) {
      throw makeError(`Maximum pharmacy alert limit (${MAX_PHARMACY_ALERTS_PER_SESSION}) reached for this session`, 429);
    }

    // Prevent duplicate alert for same session + pharmacy (non-cancelled)
    const dupCheck = await pool.query(
      `SELECT id FROM emergency_pharmacy_alerts WHERE emergency_id = $1 AND pharmacy_id = $2 AND status != 'CANCELLED'`,
      [sessionId, pharmacyId]
    );
    if (dupCheck.rows.length > 0) {
      throw makeError('This pharmacy has already been alerted for this emergency session', 409);
    }

    // Verify pharmacy exists
    const allPharmacies = await pharmacyRepository.findAllPharmacies();
    const pharmacy = allPharmacies.find((p) => p.id === pharmacyId);
    if (!pharmacy) {
      throw makeError('Pharmacy not found', 404);
    }

    // Get classification info for notification context (never prescribe)
    const classRes = await pool.query(
      'SELECT category, priority, summary FROM emergency_classifications WHERE emergency_id = $1',
      [sessionId]
    );
    const cls = classRes.rows[0];
    const priority = cls?.priority || 'LOW';
    const category = cls?.category || 'GENERAL';
    const summaryData = cls?.summary ? JSON.parse(cls.summary) : {};
    const symptoms: string[] = summaryData.symptoms || [];

    const alertId = `epa-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const assistanceContext = [
      SAFETY_NOTICE,
      `Emergency Context: Possible ${category} emergency (${priority} priority).`,
      symptoms.length > 0 ? `Reported symptoms: ${symptoms.join(', ')}` : '',
      eta ? `Estimated arrival: ${eta}` : '',
      distance ? `Distance: ${distance}` : '',
      'AI CLASSIFICATION IS NOT A DIAGNOSIS. Pharmacist must independently assess.',
    ].filter(Boolean).join('\n');

    await pool.query(
      `INSERT INTO emergency_pharmacy_alerts (id, emergency_id, pharmacy_id, status, assistance_details)
       VALUES ($1, $2, $3, $4, $5)`,
      [alertId, sessionId, pharmacyId, 'ALERTED', assistanceContext]
    );

    // In-app notification to pharmacy staff
    const notifyMsg = `🚨 Emergency Assistance Request. Priority: ${priority}. Category: ${category}. ${symptoms.length > 0 ? `Symptoms: ${symptoms.slice(0, 3).join(', ')}.` : ''} ${eta ? `ETA: ${eta}` : ''}`;
    const notifyId = `ntf-ph-${Date.now()}`;
    await pool.query(
      `INSERT INTO notifications (id, user_id, title, message, category, priority)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [notifyId, pharmacyId, '🚨 Emergency Assistance Request', notifyMsg, 'EMERGENCY', priority === 'HIGH' ? 'Critical' : 'High']
    ).catch(() => { /* non-fatal */ });

    // Audit event
    await this._logEvent(sessionId, 'PHARMACY_ALERTED', `Pharmacy ${pharmacy.name} alerted for emergency assistance`, 'CITIZEN');

    logger.info({ tag: '[PHARMACY_EMERGENCY]', message: `Alert created: ${alertId} → pharmacy ${pharmacyId} for session ${sessionId}` });

    return {
      id: alertId,
      emergencyId: sessionId,
      pharmacyId,
      pharmacyName: pharmacy.name,
      status: 'ALERTED',
      assistanceDetails: assistanceContext,
      notifiedAt: new Date(),
      classification: { category, priority },
      symptoms,
      safetyNotice: SAFETY_NOTICE,
    };
  }

  // ── Step 3: Get pharmacy alert queue (Pharmacist) ─────────────

  async getPharmacyQueue(pharmacyId: string): Promise<PharmacyAlertEntity[]> {
    if (!pharmacyId) throw makeError('pharmacyId required', 400);

    const res = await pool.query(
      `SELECT
         epa.*,
         ecl.category, ecl.priority, ecl.summary
       FROM emergency_pharmacy_alerts epa
       LEFT JOIN emergency_classifications ecl ON ecl.emergency_id = epa.emergency_id
       WHERE epa.pharmacy_id = $1
         AND epa.status NOT IN ('CANCELLED', 'RESOLVED')
       ORDER BY
         CASE epa.status
           WHEN 'ALERTED' THEN 1
           WHEN 'ACKNOWLEDGED' THEN 2
           WHEN 'PREPARING' THEN 3
           ELSE 4
         END,
         epa.notified_at DESC
       LIMIT 30`,
      [pharmacyId]
    );

    return res.rows.map((r) => {
      const summaryData = r.summary ? JSON.parse(r.summary) : {};
      return {
        id: r.id,
        emergencyId: r.emergency_id,
        pharmacyId: r.pharmacy_id,
        status: r.status,
        assistanceDetails: r.assistance_details,
        pharmacistId: r.pharmacist_id,
        notifiedAt: r.notified_at,
        acknowledgedAt: r.acknowledged_at,
        preparedAt: r.prepared_at,
        rejectedAt: r.rejected_at,
        escalatedAt: r.escalated_at,
        resolvedAt: r.resolved_at,
        classification: { category: r.category || 'GENERAL', priority: r.priority || 'LOW' },
        symptoms: summaryData.symptoms || [],
        warnings: summaryData.warnings || [],
        safetyNotice: SAFETY_NOTICE,
      };
    });
  }

  // ── Step 4: Get alert context for pharmacist review ───────────

  async getAlertContext(alertId: string, pharmacyId: string): Promise<PharmacyAlertEntity> {
    const alert = await this._verifyAlertAccess(alertId, pharmacyId);
    const sessionRes = await pool.query(
      'SELECT latitude, longitude, created_at FROM emergency_sessions WHERE id = $1',
      [alert.emergency_id]
    );
    const session = sessionRes.rows[0];
    const classRes = await pool.query(
      'SELECT category, priority, summary FROM emergency_classifications WHERE emergency_id = $1',
      [alert.emergency_id]
    );
    const cls = classRes.rows[0];
    const summaryData = cls?.summary ? JSON.parse(cls.summary) : {};

    return {
      id: alert.id,
      emergencyId: alert.emergency_id,
      pharmacyId: alert.pharmacy_id,
      status: alert.status,
      assistanceDetails: alert.assistance_details,
      pharmacistId: alert.pharmacist_id,
      notifiedAt: alert.notified_at,
      acknowledgedAt: alert.acknowledged_at,
      preparedAt: alert.prepared_at,
      rejectedAt: alert.rejected_at,
      escalatedAt: alert.escalated_at,
      resolvedAt: alert.resolved_at,
      classification: { category: cls?.category || 'GENERAL', priority: cls?.priority || 'LOW' },
      symptoms: summaryData.symptoms || [],
      warnings: summaryData.warnings || [],
      safetyNotice: SAFETY_NOTICE,
    };
  }

  // ── Step 5: Acknowledge alert ────────────────────────────────

  async acknowledgeAlert(alertId: string, pharmacyId: string, pharmacistId: string): Promise<void> {
    const alert = await this._verifyAlertAccess(alertId, pharmacyId);
    this._assertTransitionAllowed(alert.status, 'ACKNOWLEDGED');

    await pool.query(
      `UPDATE emergency_pharmacy_alerts SET status = 'ACKNOWLEDGED', acknowledged_at = $1, pharmacist_id = $2 WHERE id = $3`,
      [new Date(), pharmacistId, alertId]
    );
    await this._logEvent(alert.emergency_id, 'PHARMACY_ACKNOWLEDGED', `Pharmacist acknowledged emergency request`, 'PHARMACIST');
    logger.info({ tag: '[PHARMACY_EMERGENCY]', message: `Alert ${alertId} acknowledged` });
  }

  // ── Step 6: Mark preparing ───────────────────────────────────

  async markPreparing(alertId: string, pharmacyId: string, pharmacistId: string, assistanceDetails?: string): Promise<void> {
    const alert = await this._verifyAlertAccess(alertId, pharmacyId);
    this._assertTransitionAllowed(alert.status, 'PREPARING');

    // Validate assistance details length (no auto-prescription)
    if (assistanceDetails && assistanceDetails.length > ASSISTANCE_DETAIL_MAX_LENGTH) {
      throw makeError(`Assistance details must not exceed ${ASSISTANCE_DETAIL_MAX_LENGTH} characters`, 400);
    }

    const newDetails = assistanceDetails
      ? `[HUMAN PHARMACIST-ENTERED] ${assistanceDetails.trim()}`
      : alert.assistance_details;

    await pool.query(
      `UPDATE emergency_pharmacy_alerts SET status = 'PREPARING', prepared_at = $1, pharmacist_id = $2, assistance_details = $3 WHERE id = $4`,
      [new Date(), pharmacistId, newDetails, alertId]
    );
    await this._logEvent(alert.emergency_id, 'PHARMACY_PREPARING', 'Pharmacist marked assistance as preparing', 'PHARMACIST');
  }

  // ── Step 7: Assistance ready ─────────────────────────────────

  async markAssistanceReady(alertId: string, pharmacyId: string, pharmacistId: string, assistanceDetails?: string): Promise<void> {
    const alert = await this._verifyAlertAccess(alertId, pharmacyId);
    this._assertTransitionAllowed(alert.status, 'ASSISTANCE_READY');

    if (assistanceDetails && assistanceDetails.length > ASSISTANCE_DETAIL_MAX_LENGTH) {
      throw makeError(`Assistance details must not exceed ${ASSISTANCE_DETAIL_MAX_LENGTH} characters`, 400);
    }

    const newDetails = assistanceDetails
      ? `[HUMAN PHARMACIST-ENTERED] ${assistanceDetails.trim()}`
      : alert.assistance_details;

    await pool.query(
      `UPDATE emergency_pharmacy_alerts SET status = 'ASSISTANCE_READY', pharmacist_id = $1, assistance_details = $2 WHERE id = $3`,
      [pharmacistId, newDetails, alertId]
    );
    await this._logEvent(alert.emergency_id, 'PHARMACY_READY', 'Pharmacist confirmed assistance is ready', 'PHARMACIST');
  }

  // ── Step 8: Reject request ───────────────────────────────────

  async rejectAlert(alertId: string, pharmacyId: string, pharmacistId: string): Promise<void> {
    const alert = await this._verifyAlertAccess(alertId, pharmacyId);
    this._assertTransitionAllowed(alert.status, 'REJECTED');

    await pool.query(
      `UPDATE emergency_pharmacy_alerts SET status = 'REJECTED', rejected_at = $1, pharmacist_id = $2 WHERE id = $3`,
      [new Date(), pharmacistId, alertId]
    );
    await this._logEvent(alert.emergency_id, 'PHARMACY_REJECTED', 'Pharmacist rejected the assistance request', 'PHARMACIST');
  }

  // ── Step 9: Escalate ─────────────────────────────────────────

  async escalateAlert(alertId: string, pharmacyId: string, pharmacistId: string): Promise<void> {
    const alert = await this._verifyAlertAccess(alertId, pharmacyId);
    this._assertTransitionAllowed(alert.status, 'ESCALATED');

    await pool.query(
      `UPDATE emergency_pharmacy_alerts SET status = 'ESCALATED', escalated_at = $1, pharmacist_id = $2 WHERE id = $3`,
      [new Date(), pharmacistId, alertId]
    );
    await this._logEvent(alert.emergency_id, 'PHARMACY_ESCALATED', 'Pharmacist escalated — immediate emergency care required', 'PHARMACIST');
  }

  // ── Step 10: Resolve ─────────────────────────────────────────

  async resolveAlert(alertId: string, pharmacyId: string, pharmacistId: string): Promise<void> {
    const alert = await this._verifyAlertAccess(alertId, pharmacyId);
    this._assertTransitionAllowed(alert.status, 'RESOLVED');

    await pool.query(
      `UPDATE emergency_pharmacy_alerts SET status = 'RESOLVED', resolved_at = $1, pharmacist_id = $2 WHERE id = $3`,
      [new Date(), pharmacistId, alertId]
    );
    await this._logEvent(alert.emergency_id, 'PHARMACY_RESOLVED', 'Emergency pharmacy assistance resolved', 'PHARMACIST');
  }

  // ── Step 11: Citizen status polling ──────────────────────────

  async getAlertStatusForSession(sessionId: string, requestingUserId: string): Promise<any[]> {
    await this._verifySessionOwnership(sessionId, requestingUserId);

    const res = await pool.query(
      `SELECT
         epa.id, epa.pharmacy_id, epa.status,
         epa.notified_at, epa.acknowledged_at, epa.resolved_at,
         p.name as pharmacy_name
       FROM emergency_pharmacy_alerts epa
       JOIN pharmacies p ON p.id = epa.pharmacy_id
       WHERE epa.emergency_id = $1
       ORDER BY epa.notified_at DESC`,
      [sessionId]
    );

    return res.rows.map((r) => ({
      alertId: r.id,
      pharmacyId: r.pharmacy_id,
      pharmacyName: r.pharmacy_name,
      status: r.status,
      notifiedAt: r.notified_at,
      acknowledgedAt: r.acknowledged_at,
      resolvedAt: r.resolved_at,
    }));
  }

  // ── Step 12: AI handoff summary (Gemini optional) ────────────

  async generatePharmacyHandoff(alertId: string, pharmacyId: string): Promise<string> {
    try {
      const alert = await this._verifyAlertAccess(alertId, pharmacyId);

      const sessionRes = await pool.query(
        'SELECT * FROM emergency_sessions WHERE id = $1',
        [alert.emergency_id]
      );
      const classRes = await pool.query(
        'SELECT category, priority, summary FROM emergency_classifications WHERE emergency_id = $1',
        [alert.emergency_id]
      );
      const cls = classRes.rows[0];
      const summaryData = cls?.summary ? JSON.parse(cls.summary) : {};
      const symptoms: string[] = summaryData.symptoms || [];

      const prompt = [
        `Emergency Alert Context:`,
        `Category: ${cls?.category || 'UNKNOWN'}`,
        `Priority: ${cls?.priority || 'UNKNOWN'}`,
        `Reported symptoms: ${symptoms.join(', ') || 'None provided'}`,
        ``,
        `Task: Provide a concise structured summary for pharmacist review.`,
        `Do NOT recommend, prescribe, or suggest any medication.`,
        `Do NOT diagnose.`,
        `State clearly: This is an AI-generated summary. NOT a diagnosis. Pharmacist must independently assess.`,
      ].join('\n');

      const systemPrompt = `You are a clinical documentation assistant. 
Summarize emergency context for pharmacist review ONLY. 
NEVER prescribe or recommend medication. 
NEVER diagnose. 
Always include safety disclaimer.`;

      const result = await geminiService.generateText(prompt, systemPrompt);
      return result;
    } catch (err: any) {
      logger.warn({ tag: '[PHARMACY_AI]', message: 'AI handoff failed, returning fallback', error: err.message });
      // Graceful fallback — never crash pharmacy workflow
      return 'AI handoff summary unavailable. Please review the emergency alert details and reported symptoms directly. AI classification is NOT a diagnosis.';
    }
  }

  // ── Private helpers ───────────────────────────────────────────

  private async _verifySessionOwnership(sessionId: string, userId: string): Promise<void> {
    const res = await pool.query('SELECT user_id FROM emergency_sessions WHERE id = $1', [sessionId]);
    if (res.rows.length === 0) throw makeError('Emergency session not found', 404);
    if (res.rows[0].user_id !== userId) throw makeError('Forbidden: You do not own this emergency session', 403);
  }

  private async _verifyAlertAccess(alertId: string, pharmacyId: string): Promise<any> {
    const res = await pool.query('SELECT * FROM emergency_pharmacy_alerts WHERE id = $1', [alertId]);
    if (res.rows.length === 0) throw makeError('Alert not found', 404);
    const alert = res.rows[0];
    if (alert.pharmacy_id !== pharmacyId) throw makeError('Forbidden: This alert does not belong to your pharmacy', 403);
    return alert;
  }

  private _assertTransitionAllowed(currentStatus: string, newStatus: string): void {
    const closed = ['RESOLVED', 'CANCELLED'];
    if (closed.includes(currentStatus)) {
      throw makeError(`Cannot transition from ${currentStatus} to ${newStatus}`, 400);
    }
    if (currentStatus === 'REJECTED' && newStatus !== 'CANCELLED') {
      throw makeError(`Rejected alert cannot be transitioned to ${newStatus}`, 400);
    }
  }

  private async _logEvent(emergencyId: string, eventType: string, description: string, actor: string): Promise<void> {
    try {
      const eventId = `ev-ph-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await pool.query(
        'INSERT INTO emergency_events (id, emergency_id, event_type, description, actor) VALUES ($1, $2, $3, $4, $5)',
        [eventId, emergencyId, eventType, description, actor]
      );
    } catch (err: any) {
      logger.warn({ tag: '[PHARMACY_AUDIT]', message: 'Event log write failed', error: err.message });
    }
  }
}

export const emergencyPharmacyService = new EmergencyPharmacyService();
