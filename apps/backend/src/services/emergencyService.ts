import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../database/db.js';
import { logger } from '../logging/logger.js';
import { patientContextService } from './patientContextService.js';
import { healthExchangeService } from './healthExchangeService.js';
import { hospitalRepository } from '../repositories/hospitalRepository.js';
import { pharmacyRepository } from '../repositories/pharmacyRepository.js';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type EmergencyPriority = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFORMATIONAL';
export type EmergencyCategory =
  | 'CARDIAC'
  | 'NEUROLOGICAL'
  | 'TRAUMA'
  | 'RESPIRATORY'
  | 'METABOLIC'
  | 'POISONING'
  | 'OBSTETRIC'
  | 'GENERAL';

export interface ClassificationResult {
  category: EmergencyCategory;
  priority: EmergencyPriority;
  confidence: number;
  source: 'DETERMINISTIC_SAFETY_RULE' | 'ML_CLASSIFIER' | 'COMBINED';
  symptoms: string[];
  warnings: string[];
  disclaimer: string;
}

export interface EmergencySession {
  id: string;
  userId: string;
  companionName?: string;
  companionPhone?: string;
  latitude: number;
  longitude: number;
  status: string;
  createdAt: Date;
  resolvedAt?: Date;
  classification?: ClassificationResult;
}

export interface MedicalHistorySummary {
  allergies: string[];
  currentMedications: string[];
  chronicConditions: string[];
  bloodGroup: string;
  recentWarnings: string[];
  abhaReference: string;
  disclaimer: string;
  consentGrantedAt: string;
}

// ─────────────────────────────────────────────────────────────
// ML Model — loaded once at module init, never retrained at runtime
// ─────────────────────────────────────────────────────────────

interface DecisionTreeNode {
  featureIndex?: number;
  left?: DecisionTreeNode;
  right?: DecisionTreeNode;
  value?: string;
}

interface ModelArtifact {
  features: string[];
  trees: DecisionTreeNode[];
  classes: string[];
}

let _mlModel: ModelArtifact | null = null;
let _mlModelLoadAttempted = false;

function loadMLModel(): ModelArtifact | null {
  if (_mlModelLoadAttempted) return _mlModel;
  _mlModelLoadAttempted = true;

  try {
    // Resolve from project root: apps/backend/ml/models/emergency-random-forest.json
    const modelPath = path.join(process.cwd(), 'ml', 'models', 'emergency-random-forest.json');
    if (!fs.existsSync(modelPath)) {
      logger.warn({ tag: '[EMERGENCY_ML]', message: 'Model artifact not found — ML classifier unavailable. Safety rules still active.' });
      return null;
    }
    const raw = fs.readFileSync(modelPath, 'utf8');
    _mlModel = JSON.parse(raw) as ModelArtifact;
    logger.info({ tag: '[EMERGENCY_ML]', message: `✅ ML model loaded: ${_mlModel.trees.length} trees, ${_mlModel.features.length} features` });
    return _mlModel;
  } catch (err: any) {
    logger.error({ tag: '[EMERGENCY_ML]', message: 'Failed to load ML model — ML unavailable', error: err.message });
    return null;
  }
}

function predictTree(node: DecisionTreeNode, features: string[], featureVector: number[]): string {
  if (node.value !== undefined) return node.value;
  if (node.featureIndex === undefined || !node.left || !node.right) return 'UNKNOWN';
  const val = featureVector[node.featureIndex] ?? 0;
  return val === 1
    ? predictTree(node.right, features, featureVector)
    : predictTree(node.left, features, featureVector);
}

function runMLInference(symptoms: string[], model: ModelArtifact): { category: string; confidence: number } {
  // Build feature vector from symptom keywords
  const normalizedInput = symptoms.join(' ').toLowerCase();
  const featureVector = model.features.map((feat) =>
    normalizedInput.includes(feat.toLowerCase().replace(/_/g, ' ')) ? 1 : 0
  );

  // Majority vote across all trees
  const votes: Record<string, number> = {};
  for (const tree of model.trees) {
    const prediction = predictTree(tree, model.features, featureVector);
    votes[prediction] = (votes[prediction] || 0) + 1;
  }

  let bestCategory = 'GENERAL';
  let bestVotes = 0;
  for (const [cat, count] of Object.entries(votes)) {
    if (count > bestVotes) {
      bestVotes = count;
      bestCategory = cat;
    }
  }

  const confidence = parseFloat((bestVotes / model.trees.length).toFixed(3));
  return { category: bestCategory, confidence };
}

// ─────────────────────────────────────────────────────────────
// Deterministic Safety Rule Engine
// These ALWAYS take priority over ML output.
// A HIGH priority from safety rules can NEVER be downgraded.
// ─────────────────────────────────────────────────────────────

interface SafetyRuleResult {
  triggered: boolean;
  priority: EmergencyPriority;
  category: EmergencyCategory;
  warnings: string[];
}

function runSafetyRules(symptoms: string[]): SafetyRuleResult {
  const input = symptoms.join(' ').toLowerCase();
  const warnings: string[] = [];

  const hasAny = (...terms: string[]) => terms.some((t) => input.includes(t));

  // ── Immediate life-threatening — always HIGH ───────────────

  // Cardiac arrest / chest emergency
  if (hasAny('unconscious', 'unresponsive', 'not breathing', 'no pulse', 'cardiac arrest', 'heart stopped')) {
    warnings.push('Possible cardiac arrest — call 112 immediately');
    return { triggered: true, priority: 'HIGH', category: 'CARDIAC', warnings };
  }

  // Chest pain + breathing difficulty = HIGH cardiac
  if (
    hasAny('chest pain', 'chest tightness', 'chest pressure') &&
    hasAny('breathing difficulty', 'shortness of breath', 'can\'t breathe', 'trouble breathing', 'difficulty breathing')
  ) {
    warnings.push('Possible cardiac emergency — immediate medical evaluation required');
    return { triggered: true, priority: 'HIGH', category: 'CARDIAC', warnings };
  }

  // Chest pain alone — still HIGH
  if (hasAny('severe chest pain', 'crushing chest', 'radiating chest pain', 'heart attack')) {
    warnings.push('Possible cardiac emergency — do not delay seeking emergency care');
    return { triggered: true, priority: 'HIGH', category: 'CARDIAC', warnings };
  }

  // Stroke indicators
  if (
    hasAny('face drooping', 'facial drooping', 'facial droop', 'face numb') ||
    hasAny('arm weakness', 'sudden arm weakness', 'arm numbness') ||
    hasAny('speech difficulty', 'slurred speech', 'can\'t speak', 'sudden confusion', 'sudden weakness') ||
    hasAny('sudden vision loss', 'sudden severe headache', 'worst headache')
  ) {
    warnings.push('Possible stroke (FAST signs) — time-critical, call 112 immediately');
    return { triggered: true, priority: 'HIGH', category: 'NEUROLOGICAL', warnings };
  }

  // Severe bleeding / trauma
  if (hasAny('severe bleeding', 'heavy bleeding', 'uncontrolled bleeding', 'blood spurting', 'gushing blood')) {
    warnings.push('Severe haemorrhage — apply direct pressure, call 112');
    return { triggered: true, priority: 'HIGH', category: 'TRAUMA', warnings };
  }

  // Severe respiratory distress
  if (hasAny('can\'t breathe', 'choking', 'airway blocked', 'turning blue', 'cyanosis', 'blue lips', 'no air')) {
    warnings.push('Airway obstruction or severe respiratory distress — emergency response required');
    return { triggered: true, priority: 'HIGH', category: 'RESPIRATORY', warnings };
  }

  // Seizure / loss of consciousness
  if (hasAny('seizure', 'convulsion', 'fitting', 'collapsed', 'fainted', 'loss of consciousness', 'unconscious')) {
    warnings.push('Loss of consciousness or seizure detected — emergency care required');
    return { triggered: true, priority: 'HIGH', category: 'NEUROLOGICAL', warnings };
  }

  // Severe allergic reaction
  if (hasAny('anaphylaxis', 'throat swelling', 'throat closing', 'severe allergic', 'epipen')) {
    warnings.push('Possible anaphylaxis — life-threatening allergic reaction, use epinephrine if available and call 112');
    return { triggered: true, priority: 'HIGH', category: 'METABOLIC', warnings };
  }

  // Poisoning / overdose
  if (hasAny('poisoning', 'overdose', 'swallowed poison', 'toxic', 'snake bite', 'scorpion sting')) {
    warnings.push('Possible poisoning or toxic exposure — call 112 and Poison Control');
    return { triggered: true, priority: 'HIGH', category: 'POISONING', warnings };
  }

  // Obstetric emergency
  if (hasAny('labour', 'giving birth', 'baby coming', 'cord prolapse', 'heavy bleeding pregnancy', 'eclampsia')) {
    warnings.push('Obstetric emergency — immediate hospital transport required');
    return { triggered: true, priority: 'HIGH', category: 'OBSTETRIC', warnings };
  }

  // ── MEDIUM priority indicators ─────────────────────────────
  if (
    hasAny('breathing difficulty', 'shortness of breath', 'difficulty breathing') ||
    hasAny('severe vomiting', 'vomiting blood', 'blood in stool') ||
    hasAny('high fever', 'fever above 104', 'fever 40') ||
    hasAny('severe abdominal pain', 'sudden abdominal pain') ||
    hasAny('chest pain')
  ) {
    warnings.push('Symptoms require prompt medical evaluation — do not delay');
    const cat = hasAny('breathing', 'breath') ? 'RESPIRATORY' : hasAny('chest') ? 'CARDIAC' : 'GENERAL';
    return { triggered: true, priority: 'MEDIUM', category: cat as EmergencyCategory, warnings };
  }

  // No safety rule triggered
  return { triggered: false, priority: 'LOW', category: 'GENERAL', warnings: [] };
}

// ─────────────────────────────────────────────────────────────
// Main Classification Orchestrator
// Safety Rules → ML (if safety rule is LOW/none)
// Safety rule HIGH/MEDIUM is NEVER downgraded by ML
// ─────────────────────────────────────────────────────────────

export function classifyEmergency(symptoms: string[]): ClassificationResult {
  const DISCLAIMER =
    'PROTOTYPE ML DECISION-SUPPORT ONLY. This system is NOT clinically validated. ' +
    'It does NOT diagnose or prescribe. A qualified healthcare professional must make all clinical decisions. ' +
    '⚠️ SIH DEMO MODE — Simulated emergency classification for demonstration purposes.';

  if (!symptoms || symptoms.length === 0) {
    return {
      category: 'GENERAL',
      priority: 'INFORMATIONAL',
      confidence: 1.0,
      source: 'DETERMINISTIC_SAFETY_RULE',
      symptoms: [],
      warnings: ['No symptoms provided. Please describe your emergency.'],
      disclaimer: DISCLAIMER,
    };
  }

  // Step 1: Deterministic safety rules — always run first
  const safetyResult = runSafetyRules(symptoms);

  // Step 2: Try ML classifier
  const model = loadMLModel();
  let mlCategory = 'GENERAL';
  let mlConfidence = 0;
  let source: ClassificationResult['source'] = 'DETERMINISTIC_SAFETY_RULE';

  if (model) {
    try {
      const ml = runMLInference(symptoms, model);
      mlCategory = ml.category;
      mlConfidence = ml.confidence;
    } catch (err: any) {
      logger.warn({ tag: '[EMERGENCY_ML]', message: 'ML inference error — using safety rules only', error: err.message });
    }
  }

  // Step 3: Fusion — safety rules take precedence
  // A safety-rule HIGH/MEDIUM CANNOT be downgraded by ML
  if (safetyResult.triggered && (safetyResult.priority === 'HIGH' || safetyResult.priority === 'MEDIUM')) {
    return {
      category: safetyResult.category,
      priority: safetyResult.priority,
      confidence: 0.99,
      source: model ? 'COMBINED' : 'DETERMINISTIC_SAFETY_RULE',
      symptoms,
      warnings: safetyResult.warnings,
      disclaimer: DISCLAIMER,
    };
  }

  // Step 4: If safety rules triggered LOW, or not triggered — blend with ML
  if (model && mlConfidence > 0) {
    const finalCategory = mlCategory as EmergencyCategory;
    // ML cannot upgrade to HIGH without safety rule backing — cap at MEDIUM
    let finalPriority: EmergencyPriority = 'LOW';
    if (mlConfidence >= 0.7) finalPriority = 'MEDIUM';
    else finalPriority = 'LOW';

    source = 'COMBINED';
    return {
      category: finalCategory,
      priority: finalPriority,
      confidence: mlConfidence,
      source,
      symptoms,
      warnings: safetyResult.warnings,
      disclaimer: DISCLAIMER,
    };
  }

  // Step 5: Complete fallback — no ML, no safety rule triggered
  return {
    category: 'GENERAL',
    priority: 'LOW',
    confidence: 0.5,
    source: 'DETERMINISTIC_SAFETY_RULE',
    symptoms,
    warnings: ['Symptoms do not match known emergency patterns. Seek medical advice if symptoms worsen.'],
    disclaimer: DISCLAIMER,
  };
}

// ─────────────────────────────────────────────────────────────
// Emergency Service — Database Operations
// ─────────────────────────────────────────────────────────────

export class EmergencyService {
  // ── Session CRUD ────────────────────────────────────────────

  async createSession(params: {
    userId: string; // ALWAYS from req.user.id
    symptoms: string[];
    latitude: number;
    longitude: number;
    companionName?: string;
    companionPhone?: string;
  }): Promise<{ session: EmergencySession; classification: ClassificationResult }> {
    const { userId, symptoms, latitude, longitude, companionName, companionPhone } = params;

    // 1. Classify
    const classification = classifyEmergency(symptoms);

    // 2. Create session
    const sessionId = `ern-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await pool.query(
      `INSERT INTO emergency_sessions (id, user_id, companion_name, companion_phone, latitude, longitude, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [sessionId, userId, companionName ?? null, companionPhone ?? null, latitude, longitude, 'CREATED']
    );

    // 3. Store classification
    const classId = `ecl-${Date.now()}`;
    await pool.query(
      `INSERT INTO emergency_classifications (id, emergency_id, category, priority, confidence, source, summary)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        classId,
        sessionId,
        classification.category,
        classification.priority,
        classification.confidence,
        classification.source,
        JSON.stringify({ symptoms, warnings: classification.warnings }),
      ]
    );

    // 4. Audit event
    await this._logEvent(sessionId, 'SESSION_CREATED', `Emergency session created. Priority: ${classification.priority}`, 'CITIZEN');

    const session: EmergencySession = {
      id: sessionId,
      userId,
      companionName,
      companionPhone,
      latitude,
      longitude,
      status: 'CREATED',
      createdAt: new Date(),
      classification,
    };

    logger.info({ tag: '[EMERGENCY]', message: `Session created: ${sessionId} Priority: ${classification.priority}` });
    return { session, classification };
  }

  async getSession(sessionId: string, requestingUserId: string): Promise<EmergencySession> {
    const res = await pool.query('SELECT * FROM emergency_sessions WHERE id = $1', [sessionId]);
    if (res.rows.length === 0) throw new Error('Emergency session not found');

    const row = res.rows[0];

    // Security: citizens can only access their own sessions
    if (row.user_id !== requestingUserId) {
      const err: any = new Error('Forbidden: You do not have access to this emergency session');
      err.status = 403;
      throw err;
    }

    const clsRes = await pool.query(
      'SELECT * FROM emergency_classifications WHERE emergency_id = $1 ORDER BY id DESC LIMIT 1',
      [sessionId]
    );

    let classification: ClassificationResult | undefined;
    if (clsRes.rows.length > 0) {
      const cr = clsRes.rows[0];
      const summary = cr.summary ? JSON.parse(cr.summary) : {};
      classification = {
        category: cr.category,
        priority: cr.priority,
        confidence: parseFloat(cr.confidence),
        source: cr.source,
        symptoms: summary.symptoms ?? [],
        warnings: summary.warnings ?? [],
        disclaimer: 'PROTOTYPE ML DECISION-SUPPORT ONLY. Not clinically validated.',
      };
    }

    return {
      id: row.id,
      userId: row.user_id,
      companionName: row.companion_name,
      companionPhone: row.companion_phone,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      status: row.status,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
      classification,
    };
  }

  // ── Hospital Pre-Alert ──────────────────────────────────────

  async sendHospitalAlert(params: {
    sessionId: string;
    requestingUserId: string;
    hospitalId: string;
    eta?: string;
  }): Promise<{ alertId: string }> {
    const { sessionId, requestingUserId, hospitalId, eta } = params;

    // Verify ownership
    await this._verifySessionOwnership(sessionId, requestingUserId);

    // Prevent duplicate alert for same session + hospital
    const dupCheck = await pool.query(
      'SELECT id FROM emergency_hospital_alerts WHERE emergency_id = $1 AND hospital_id = $2',
      [sessionId, hospitalId]
    );
    if (dupCheck.rows.length > 0) {
      const err: any = new Error('Hospital already alerted for this emergency session');
      err.status = 409;
      throw err;
    }

    // Verify hospital exists
    const hospital = await hospitalRepository.findById(hospitalId);
    if (!hospital) {
      const err: any = new Error('Hospital not found');
      err.status = 404;
      throw err;
    }

    const alertId = `eha-${Date.now()}`;
    await pool.query(
      `INSERT INTO emergency_hospital_alerts (id, emergency_id, hospital_id, eta, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [alertId, sessionId, hospitalId, eta ?? 'Unknown', 'ALERTED']
    );

    // Update session status
    await pool.query("UPDATE emergency_sessions SET status = 'HOSPITAL_ALERTED' WHERE id = $1", [sessionId]);

    await this._logEvent(sessionId, 'HOSPITAL_ALERTED', `Hospital ${hospital.name} pre-alerted`, 'CITIZEN');

    logger.info({ tag: '[EMERGENCY]', message: `Hospital pre-alert sent: ${hospitalId} for session ${sessionId}` });
    return { alertId };
  }

  // ── Pharmacy Emergency Alert ────────────────────────────────

  async sendPharmacyAlert(params: {
    sessionId: string;
    requestingUserId: string;
    pharmacyId: string;
    assistanceDetails?: string;
  }): Promise<{ alertId: string }> {
    const { sessionId, requestingUserId, pharmacyId, assistanceDetails } = params;

    // Verify ownership
    await this._verifySessionOwnership(sessionId, requestingUserId);

    // Prevent duplicate alert for same session + pharmacy
    const dupCheck = await pool.query(
      'SELECT id FROM emergency_pharmacy_alerts WHERE emergency_id = $1 AND pharmacy_id = $2',
      [sessionId, pharmacyId]
    );
    if (dupCheck.rows.length > 0) {
      const err: any = new Error('Pharmacy already alerted for this emergency session');
      err.status = 409;
      throw err;
    }

    // Verify pharmacy exists
    const allPharmacies = await pharmacyRepository.findAllPharmacies();
    const pharmacy = allPharmacies.find((p) => p.id === pharmacyId);
    if (!pharmacy) {
      const err: any = new Error('Pharmacy not found');
      err.status = 404;
      throw err;
    }

    // Safety notice — never auto-prescribe
    const safetyNotice =
      'IMPORTANT: A qualified pharmacist must independently assess the situation and determine appropriate assistance. ' +
      'This system does NOT prescribe medicine. Do NOT administer any medication without professional assessment.';

    const alertId = `epa-${Date.now()}`;
    await pool.query(
      `INSERT INTO emergency_pharmacy_alerts (id, emergency_id, pharmacy_id, status, assistance_details)
       VALUES ($1, $2, $3, $4, $5)`,
      [alertId, sessionId, pharmacyId, 'ALERTED', assistanceDetails ? `${safetyNotice}\n\n${assistanceDetails}` : safetyNotice]
    );

    await this._logEvent(sessionId, 'PHARMACY_ALERTED', `Pharmacy ${pharmacy.name} alerted`, 'CITIZEN');

    logger.info({ tag: '[EMERGENCY]', message: `Pharmacy alert sent: ${pharmacyId} for session ${sessionId}` });
    return { alertId };
  }

  // ── Consent Management ──────────────────────────────────────

  async grantConsent(params: {
    sessionId: string;
    requestingUserId: string;
    authorizedEntity: string;
    consentScope: string[];
    durationMinutes?: number;
  }): Promise<{ consentId: string }> {
    const { sessionId, requestingUserId, authorizedEntity, consentScope, durationMinutes = 120 } = params;

    // Verify ownership
    await this._verifySessionOwnership(sessionId, requestingUserId);

    const consentId = `eco-${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60_000);

    await pool.query(
      `INSERT INTO emergency_consents (id, emergency_id, authorized_entity, status, consent_scope, authorized_at, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        consentId,
        sessionId,
        authorizedEntity,
        'APPROVED',
        JSON.stringify(consentScope),
        now,
        expiresAt,
      ]
    );

    await this._logEvent(
      sessionId,
      'CONSENT_GRANTED',
      `Medical history sharing consent granted to ${authorizedEntity} for ${durationMinutes} minutes`,
      'CITIZEN'
    );

    logger.info({ tag: '[EMERGENCY]', message: `Consent granted: ${consentId} entity: ${authorizedEntity}` });
    return { consentId };
  }

  async revokeConsent(params: {
    sessionId: string;
    requestingUserId: string;
    consentId: string;
  }): Promise<void> {
    const { sessionId, requestingUserId, consentId } = params;

    await this._verifySessionOwnership(sessionId, requestingUserId);

    await pool.query(
      `UPDATE emergency_consents SET status = 'REVOKED', revoked_at = $1 WHERE id = $2 AND emergency_id = $3`,
      [new Date(), consentId, sessionId]
    );

    await this._logEvent(sessionId, 'CONSENT_REVOKED', `Consent ${consentId} revoked by patient`, 'CITIZEN');
  }

  // ── Consent-gated Medical History ───────────────────────────

  async getMedicalHistory(params: {
    sessionId: string;
    requestingEntity: string; // hospital_id, pharmacy_id, or 'doctor'
  }): Promise<MedicalHistorySummary> {
    const { sessionId, requestingEntity } = params;

    // Step 1: Verify active consent exists
    const consentRes = await pool.query(
      `SELECT * FROM emergency_consents
       WHERE emergency_id = $1
         AND authorized_entity = $2
         AND status = 'APPROVED'
         AND expires_at > NOW()
       ORDER BY authorized_at DESC
       LIMIT 1`,
      [sessionId, requestingEntity]
    );

    if (consentRes.rows.length === 0) {
      const err: any = new Error('Access denied: No valid consent found for this entity');
      err.status = 403;
      throw err;
    }

    const consent = consentRes.rows[0];

    // Step 2: Get the session to find userId
    const sessionRes = await pool.query('SELECT user_id FROM emergency_sessions WHERE id = $1', [sessionId]);
    if (sessionRes.rows.length === 0) {
      const err: any = new Error('Emergency session not found');
      err.status = 404;
      throw err;
    }
    const userId = sessionRes.rows[0].user_id;

    // Step 3: Build minimum-necessary medical summary (NOT full records)
    const ctx = await patientContextService.getContextForUser(userId);

    const summary: MedicalHistorySummary = {
      allergies: ctx.allergies,
      currentMedications: ctx.medications,
      chronicConditions: ctx.chronicDiseases,
      bloodGroup: ctx.bloodGroup,
      recentWarnings: ctx.digitalTwin
        ? [
            ctx.digitalTwin.diabetesRisk !== 'Low Risk' ? `Diabetes Risk: ${ctx.digitalTwin.diabetesRisk}` : '',
            ctx.digitalTwin.bloodPressureRisk !== 'Low Risk' ? `BP Status: ${ctx.digitalTwin.bloodPressureRisk}` : '',
            ctx.digitalTwin.cardiacScore < 70 ? `Cardiac Score: ${ctx.digitalTwin.cardiacScore}% (attention advised)` : '',
          ].filter(Boolean)
        : [],
      abhaReference: 'Verified ABHA account — contact ABDM gateway for full record',
      disclaimer:
        'This is a minimum-necessary emergency medical summary shared with explicit patient consent. ' +
        'Full medical records require separate ABDM/ABHA authorization.',
      consentGrantedAt: consent.authorized_at.toISOString(),
    };

    await this._logEvent(
      sessionId,
      'MEDICAL_HISTORY_ACCESSED',
      `Medical summary accessed by ${requestingEntity}`,
      requestingEntity
    );

    return summary;
  }

  // ── Resolve Session ─────────────────────────────────────────

  async resolveSession(sessionId: string, requestingUserId: string): Promise<void> {
    await this._verifySessionOwnership(sessionId, requestingUserId);

    await pool.query(
      "UPDATE emergency_sessions SET status = 'RESOLVED', resolved_at = $1 WHERE id = $2",
      [new Date(), sessionId]
    );

    await this._logEvent(sessionId, 'SESSION_RESOLVED', 'Emergency session resolved', 'CITIZEN');
  }

  // ── Hospital Alert Queue ────────────────────────────────────

  async getHospitalAlerts(hospitalId: string): Promise<any[]> {
    const res = await pool.query(
      `SELECT
         eha.id AS alert_id,
         eha.emergency_id,
         eha.eta,
         eha.status,
         eha.notified_at,
         eha.acknowledged_at,
         es.status AS session_status,
         es.latitude,
         es.longitude,
         ecl.category,
         ecl.priority,
         ecl.confidence,
         ecl.summary
       FROM emergency_hospital_alerts eha
       JOIN emergency_sessions es ON eha.emergency_id = es.id
       LEFT JOIN emergency_classifications ecl ON ecl.emergency_id = eha.emergency_id
       WHERE eha.hospital_id = $1
       ORDER BY eha.notified_at DESC
       LIMIT 50`,
      [hospitalId]
    );

    return res.rows.map((r) => ({
      alertId: r.alert_id,
      emergencyId: r.emergency_id,
      eta: r.eta,
      alertStatus: r.status,
      sessionStatus: r.session_status,
      notifiedAt: r.notified_at,
      acknowledgedAt: r.acknowledged_at,
      location: { latitude: r.latitude, longitude: r.longitude },
      classification: {
        category: r.category,
        priority: r.priority,
        confidence: r.confidence,
        summary: r.summary ? JSON.parse(r.summary) : {},
      },
    }));
  }

  async acknowledgeHospitalAlert(alertId: string, hospitalId: string): Promise<void> {
    const res = await pool.query(
      'SELECT id FROM emergency_hospital_alerts WHERE id = $1 AND hospital_id = $2',
      [alertId, hospitalId]
    );
    if (res.rows.length === 0) {
      const err: any = new Error('Alert not found or not belonging to this hospital');
      err.status = 403;
      throw err;
    }
    await pool.query(
      "UPDATE emergency_hospital_alerts SET status = 'ACKNOWLEDGED', acknowledged_at = $1 WHERE id = $2",
      [new Date(), alertId]
    );
  }

  // ── Doctor Chat Queue ───────────────────────────────────────

  async getDoctorChatQueue(): Promise<any[]> {
    // Return active emergency sessions with CREATED or HOSPITAL_ALERTED status
    // Doctors see sessions that need support (no PII in this list view)
    const res = await pool.query(
      `SELECT
         es.id,
         es.status,
         es.created_at,
         ecl.category,
         ecl.priority,
         ecl.summary
       FROM emergency_sessions es
       LEFT JOIN emergency_classifications ecl ON ecl.emergency_id = es.id
       WHERE es.status IN ('CREATED', 'HOSPITAL_ALERTED', 'PHARMACY_ALERTED')
         AND es.created_at > NOW() - INTERVAL '24 hours'
       ORDER BY
         CASE ecl.priority
           WHEN 'HIGH' THEN 1
           WHEN 'MEDIUM' THEN 2
           WHEN 'LOW' THEN 3
           ELSE 4
         END,
         es.created_at ASC
       LIMIT 20`
    );

    return res.rows.map((r) => ({
      sessionId: r.id,
      status: r.status,
      createdAt: r.created_at,
      classification: {
        category: r.category,
        priority: r.priority,
        // Note: symptoms details only available after consent — not returned here
      },
    }));
  }

  // ── Pharmacy Alert Queue ────────────────────────────────────

  async getPharmacyAlerts(pharmacyId: string): Promise<any[]> {
    const res = await pool.query(
      `SELECT
         epa.id AS alert_id,
         epa.emergency_id,
         epa.status,
         epa.assistance_details,
         epa.notified_at,
         ecl.category,
         ecl.priority
       FROM emergency_pharmacy_alerts epa
       JOIN emergency_sessions es ON epa.emergency_id = es.id
       LEFT JOIN emergency_classifications ecl ON ecl.emergency_id = epa.emergency_id
       WHERE epa.pharmacy_id = $1
       ORDER BY epa.notified_at DESC
       LIMIT 20`,
      [pharmacyId]
    );

    return res.rows.map((r) => ({
      alertId: r.alert_id,
      emergencyId: r.emergency_id,
      status: r.status,
      assistanceDetails: r.assistance_details,
      notifiedAt: r.notified_at,
      classification: { category: r.category, priority: r.priority },
      safetyNotice:
        'A qualified pharmacist must independently assess and determine appropriate assistance. This system does NOT prescribe medicine.',
    }));
  }

  // ── Nearby Facilities ───────────────────────────────────────

  async getNearbyHospitals(): Promise<any[]> {
    return hospitalRepository.findAll();
  }

  async getNearbyPharmacies(): Promise<any[]> {
    return pharmacyRepository.findAllPharmacies();
  }

  // ── Private Helpers ─────────────────────────────────────────

  private async _verifySessionOwnership(sessionId: string, userId: string): Promise<void> {
    const res = await pool.query('SELECT user_id FROM emergency_sessions WHERE id = $1', [sessionId]);
    if (res.rows.length === 0) {
      const err: any = new Error('Emergency session not found');
      err.status = 404;
      throw err;
    }
    if (res.rows[0].user_id !== userId) {
      const err: any = new Error('Forbidden: You do not own this emergency session');
      err.status = 403;
      throw err;
    }
  }

  private async _logEvent(
    emergencyId: string,
    eventType: string,
    description: string,
    actor: string
  ): Promise<void> {
    try {
      const eventId = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      await pool.query(
        'INSERT INTO emergency_events (id, emergency_id, event_type, description, actor) VALUES ($1, $2, $3, $4, $5)',
        [eventId, emergencyId, eventType, description, actor]
      );
    } catch (err: any) {
      // Non-fatal — event log failure should not abort main operation
      logger.warn({ tag: '[EMERGENCY_AUDIT]', message: 'Event log write failed', error: err.message });
    }
  }
}

export const emergencyService = new EmergencyService();
