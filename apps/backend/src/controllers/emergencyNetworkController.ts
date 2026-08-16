import { Request, Response, NextFunction } from 'express';
import { emergencyService, classifyEmergency } from '../services/emergencyService.js';
import { logger } from '../logging/logger.js';

// ─────────────────────────────────────────────────────────────
// Helper — extract verified user from JWT (NEVER trust body)
// ─────────────────────────────────────────────────────────────
function getVerifiedUser(req: Request): { id: string; role: string; name: string } {
  const user = (req as any).user;
  if (!user || !user.id) {
    const err: any = new Error('Unauthorized: JWT user identity missing');
    err.status = 401;
    throw err;
  }
  return user;
}

// ─────────────────────────────────────────────────────────────
// Helper — safe async wrapper
// ─────────────────────────────────────────────────────────────
function safeHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      // Pass structured status codes from service layer
      if (err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
      }
      next(err);
    }
  };
}

// ─────────────────────────────────────────────────────────────
// Feature 1 — Emergency ML Classification
// POST /api/v1/emergency-network/session
// ─────────────────────────────────────────────────────────────

export const createEmergencySession = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);

  const { symptoms, latitude, longitude, companionName, companionPhone } = req.body;

  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({ success: false, message: 'symptoms array is required' });
  }

  // Validate coordinates — allow null for manual hospital selection flow
  const lat = latitude != null ? parseFloat(latitude) : 0;
  const lng = longitude != null ? parseFloat(longitude) : 0;

  const result = await emergencyService.createSession({
    userId: user.id, // JWT-derived — never from body
    symptoms: symptoms.map((s: any) => String(s).trim()).filter(Boolean),
    latitude: lat,
    longitude: lng,
    companionName: companionName ? String(companionName) : undefined,
    companionPhone: companionPhone ? String(companionPhone) : undefined,
  });

  return res.status(201).json({
    success: true,
    data: {
      sessionId: result.session.id,
      status: result.session.status,
      classification: result.classification,
      createdAt: result.session.createdAt,
    },
  });
});

// ─────────────────────────────────────────────────────────────
// GET /api/v1/emergency-network/session/:id
// ─────────────────────────────────────────────────────────────

export const getEmergencySession = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);
  const { id } = req.params;

  const session = await emergencyService.getSession(id, user.id);

  return res.status(200).json({ success: true, data: session });
});

// ─────────────────────────────────────────────────────────────
// Feature 4 — Hospital Pre-Alert
// POST /api/v1/emergency-network/session/:id/hospital-alert
// ─────────────────────────────────────────────────────────────

export const sendHospitalAlert = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);
  const { id: sessionId } = req.params;
  const { hospitalId, eta } = req.body;

  if (!hospitalId) {
    return res.status(400).json({ success: false, message: 'hospitalId is required' });
  }

  const result = await emergencyService.sendHospitalAlert({
    sessionId,
    requestingUserId: user.id,
    hospitalId: String(hospitalId),
    eta: eta ? String(eta) : undefined,
  });

  return res.status(201).json({
    success: true,
    data: {
      alertId: result.alertId,
      message: 'Hospital pre-alert sent successfully. The hospital has been notified of your incoming emergency.',
      safetyNotice:
        'Medical history will ONLY be shared with hospital staff after you explicitly grant consent below.',
    },
  });
});

// ─────────────────────────────────────────────────────────────
// Feature 3 — Pharmacy Emergency Assistance
// POST /api/v1/emergency-network/session/:id/pharmacy-alert
// ─────────────────────────────────────────────────────────────

export const sendPharmacyAlert = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);
  const { id: sessionId } = req.params;
  const { pharmacyId, assistanceRequest } = req.body;

  if (!pharmacyId) {
    return res.status(400).json({ success: false, message: 'pharmacyId is required' });
  }

  const result = await emergencyService.sendPharmacyAlert({
    sessionId,
    requestingUserId: user.id,
    pharmacyId: String(pharmacyId),
    assistanceDetails: assistanceRequest ? String(assistanceRequest) : undefined,
  });

  return res.status(201).json({
    success: true,
    data: {
      alertId: result.alertId,
      message: 'Pharmacy emergency assistance request sent.',
      safetyNotice:
        'IMPORTANT: A qualified pharmacist must independently assess the situation and determine appropriate assistance. ' +
        'This system does NOT prescribe or recommend any medication. ' +
        'Do NOT administer any medication without direct pharmacist assessment.',
    },
  });
});

// ─────────────────────────────────────────────────────────────
// Consent — Grant / Revoke
// POST /api/v1/emergency-network/session/:id/consent
// ─────────────────────────────────────────────────────────────

export const manageConsent = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);
  const { id: sessionId } = req.params;
  const { action, authorizedEntity, consentScope, durationMinutes, consentId } = req.body;

  if (!action || !['grant', 'revoke'].includes(action)) {
    return res.status(400).json({ success: false, message: "action must be 'grant' or 'revoke'" });
  }

  if (action === 'grant') {
    if (!authorizedEntity) {
      return res.status(400).json({ success: false, message: 'authorizedEntity is required for grant' });
    }

    const defaultScope = ['allergies', 'currentMedications', 'chronicConditions', 'bloodGroup', 'recentWarnings'];

    const result = await emergencyService.grantConsent({
      sessionId,
      requestingUserId: user.id,
      authorizedEntity: String(authorizedEntity),
      consentScope: Array.isArray(consentScope) ? consentScope : defaultScope,
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : 120,
    });

    return res.status(200).json({
      success: true,
      data: {
        consentId: result.consentId,
        message: 'Consent granted. Authorized entity can now access your minimum-necessary medical summary.',
        scopeGranted: Array.isArray(consentScope) ? consentScope : defaultScope,
        note: 'Only minimum-necessary information is shared. Full medical records require separate ABDM authorization.',
      },
    });
  }

  // revoke
  if (!consentId) {
    return res.status(400).json({ success: false, message: 'consentId is required for revoke' });
  }
  await emergencyService.revokeConsent({ sessionId, requestingUserId: user.id, consentId: String(consentId) });
  return res.status(200).json({ success: true, message: 'Consent revoked. Medical information access has been terminated.' });
});

// ─────────────────────────────────────────────────────────────
// Consent-Gated Medical History
// GET /api/v1/emergency-network/session/:id/medical-history
// ─────────────────────────────────────────────────────────────

export const getMedicalHistory = safeHandler(async (req, res) => {
  // Medical history is accessed by hospitals/pharmacies/doctors, not citizens
  // The requesting entity is identified by a query param (not body — POST would be better
  // but GET+query is acceptable here since no sensitive data is IN the URL)
  const { id: sessionId } = req.params;
  const requestingEntity = req.query.entity as string;

  if (!requestingEntity) {
    return res.status(400).json({ success: false, message: 'entity query parameter is required' });
  }

  const summary = await emergencyService.getMedicalHistory({
    sessionId,
    requestingEntity,
  });

  return res.status(200).json({
    success: true,
    data: summary,
  });
});

// ─────────────────────────────────────────────────────────────
// Resolve Emergency
// POST /api/v1/emergency-network/session/:id/resolve
// ─────────────────────────────────────────────────────────────

export const resolveEmergencySession = safeHandler(async (req, res) => {
  const user = getVerifiedUser(req);
  const { id: sessionId } = req.params;

  await emergencyService.resolveSession(sessionId, user.id);

  return res.status(200).json({
    success: true,
    message: 'Emergency session resolved. Stay safe. Please follow up with your healthcare provider.',
  });
});

// ─────────────────────────────────────────────────────────────
// Feature 4 — Hospital Alert Queue (Hospital Dashboard)
// GET /api/v1/emergency-network/hospital/:hospitalId/alerts
// ─────────────────────────────────────────────────────────────

export const getHospitalAlertQueue = safeHandler(async (req, res) => {
  // Hospital staff can only see alerts for their hospital
  // In production, hospital_id would be in the JWT for ROLE_HOSPITAL
  // For SIH demo: accept hospitalId as path param, verified against role
  const { hospitalId } = req.params;

  const alerts = await emergencyService.getHospitalAlerts(hospitalId);

  return res.status(200).json({
    success: true,
    data: alerts,
    meta: {
      count: alerts.length,
      note: 'Patient identity and full medical history are only available after patient explicitly grants consent.',
    },
  });
});

// POST /api/v1/emergency-network/hospital/:hospitalId/alerts/:alertId/acknowledge
export const acknowledgeHospitalAlert = safeHandler(async (req, res) => {
  const { hospitalId, alertId } = req.params;

  await emergencyService.acknowledgeHospitalAlert(alertId, hospitalId);

  return res.status(200).json({ success: true, message: 'Alert acknowledged. Prepare receiving bay.' });
});

// ─────────────────────────────────────────────────────────────
// Feature 2 — Doctor Chat Queue (Doctor Dashboard)
// GET /api/v1/emergency-network/doctor/chat-queue
// ─────────────────────────────────────────────────────────────

export const getDoctorChatQueue = safeHandler(async (req, res) => {
  const queue = await emergencyService.getDoctorChatQueue();

  return res.status(200).json({
    success: true,
    data: queue,
    meta: {
      demoNote:
        'SIH DEMO MODE — Simulated emergency queue. In production, this would require ROLE_DOCTOR JWT and verified hospital affiliation.',
      aiAssistance:
        'AI may assist with symptom extraction and conversation summarization. ' +
        'AI does NOT diagnose, prescribe, or replace a qualified healthcare professional.',
    },
  });
});

// ─────────────────────────────────────────────────────────────
// Pharmacy Alert Queue (Pharmacy Portal)
// GET /api/v1/emergency-network/pharmacy/:pharmacyId/alerts
// ─────────────────────────────────────────────────────────────

export const getPharmacyAlertQueue = safeHandler(async (req, res) => {
  const { pharmacyId } = req.params;

  const alerts = await emergencyService.getPharmacyAlerts(pharmacyId);

  return res.status(200).json({
    success: true,
    data: alerts,
    meta: {
      safetyNotice:
        'Each alert requires independent pharmacist assessment. The system does NOT prescribe medication.',
    },
  });
});

// ─────────────────────────────────────────────────────────────
// Nearby Facilities (for ERN front-end)
// GET /api/v1/emergency-network/facilities
// ─────────────────────────────────────────────────────────────

export const getNearbyFacilities = safeHandler(async (req, res) => {
  const [hospitals, pharmacies] = await Promise.all([
    emergencyService.getNearbyHospitals(),
    emergencyService.getNearbyPharmacies(),
  ]);

  return res.status(200).json({
    success: true,
    data: { hospitals, pharmacies },
  });
});

// ─────────────────────────────────────────────────────────────
// Quick classify (no session created) — for UI preview
// POST /api/v1/emergency-network/classify
// ─────────────────────────────────────────────────────────────

export const quickClassify = safeHandler(async (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms || !Array.isArray(symptoms)) {
    return res.status(400).json({ success: false, message: 'symptoms array is required' });
  }

  const result = classifyEmergency(symptoms.map((s: any) => String(s).trim()).filter(Boolean));

  return res.status(200).json({ success: true, data: result });
});
