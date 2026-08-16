/**
 * pharmacyEmergencyController.ts
 * Phase C — ArogyaMitra Pharmacy Emergency Assistance Controller
 *
 * All actions require valid JWT (DEMO: accepts any valid token).
 * Safety: no auto-prescribing, no auto-dispensing, no AI diagnosis.
 */

import { Request, Response, NextFunction } from 'express';
import { emergencyPharmacyService } from '../services/emergencyPharmacyService.js';

// ─── Inline helpers (same pattern as emergencyNetworkController) ──

function getVerifiedUser(req: Request): { id: string; role: string; name: string } {
  const user = (req as any).user;
  if (!user || !user.id) {
    const err: any = new Error('Unauthorized: JWT user identity missing');
    err.status = 401;
    throw err;
  }
  return user;
}

function safeHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      if (err.status) {
        return res.status(err.status).json({ success: false, message: err.message });
      }
      next(err);
    }
  };
}



/**
 * GET /api/v1/emergency-network/pharmacy/nearby?lat=&lng=&radius=
 * Citizen selects pharmacy before sending alert
 */
export const getNearbyEmergencyPharmacies = safeHandler(async (req, res: Response) => {
  const latitude = parseFloat(req.query.lat as string);
  const longitude = parseFloat(req.query.lng as string);
  const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 5;

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ success: false, message: 'lat and lng query parameters are required and must be numbers' });
  }

  const pharmacies = await emergencyPharmacyService.getNearbyPharmacies({ latitude, longitude, radiusKm });

  return res.status(200).json({
    success: true,
    data: pharmacies,
    meta: {
      count: pharmacies.length,
      safetyNotice: 'These are participating pharmacies. Always call emergency services (112) for life-threatening situations.',
    },
  });
});

/**
 * POST /api/v1/emergency-network/session/:id/pharmacy-alert
 * (Phase C override of the existing route in emergencyNetworkController — handled at route layer)
 * Citizen requests emergency assistance from a specific pharmacy
 */
export const requestPharmacyAssistance = safeHandler(async (req, res: Response) => {
  const user = getVerifiedUser(req);
  const { id: sessionId } = req.params;
  const { pharmacyId, eta, distance } = req.body;

  if (!pharmacyId) {
    return res.status(400).json({ success: false, message: 'pharmacyId is required' });
  }

  const alert = await emergencyPharmacyService.createAlert({
    sessionId,
    requestingUserId: user.id,
    pharmacyId: String(pharmacyId),
    eta: eta ? String(eta) : undefined,
    distance: distance ? String(distance) : undefined,
  });

  return res.status(200).json({
    success: true,
    data: {
      alertId: alert.id,
      pharmacyName: alert.pharmacyName,
      status: alert.status,
    },
    message: 'Pharmacy notified. Await pharmacist response.',
    safetyNotice: 'IMPORTANT: A qualified pharmacist must independently assess the situation. ' +
      'This system does NOT prescribe or recommend any medication. ' +
      'For life-threatening emergencies, call 112 immediately.',
  });
});

/**
 * GET /api/v1/emergency-network/session/:id/pharmacy-status
 * Citizen polls all pharmacy alerts for their session
 */
export const getSessionPharmacyStatus = safeHandler(async (req, res: Response) => {
  const user = getVerifiedUser(req);
  const { id: sessionId } = req.params;

  const statuses = await emergencyPharmacyService.getAlertStatusForSession(sessionId, user.id);

  return res.status(200).json({
    success: true,
    data: statuses,
    meta: { count: statuses.length },
  });
});

// ─── Pharmacist endpoints ────────────────────────────────────

/**
 * GET /api/v1/emergency-network/pharmacy/:pharmacyId/alerts
 * Pharmacist views incoming emergency assistance queue
 * (Enhanced Phase C version of the existing getPharmacyAlertQueue)
 */
export const getPharmacyEmergencyQueue = safeHandler(async (req, res: Response) => {
  const { pharmacyId } = req.params;

  const alerts = await emergencyPharmacyService.getPharmacyQueue(pharmacyId);

  return res.status(200).json({
    success: true,
    data: alerts,
    meta: {
      count: alerts.length,
      safetyNotice: 'Each request requires INDEPENDENT pharmacist assessment. Do NOT prescribe without professional evaluation.',
    },
  });
});

/**
 * GET /api/v1/emergency-network/pharmacy/:pharmacyId/alerts/:alertId
 * Pharmacist views full context of a specific alert
 */
export const getPharmacyAlertContext = safeHandler(async (req, res: Response) => {
  const { pharmacyId, alertId } = req.params;

  const alert = await emergencyPharmacyService.getAlertContext(alertId, pharmacyId);

  return res.status(200).json({
    success: true,
    data: alert,
  });
});

/**
 * POST /api/v1/emergency-network/pharmacy/:pharmacyId/alerts/:alertId/acknowledge
 * Pharmacist acknowledges — commits to reviewing the request
 */
export const acknowledgePharmacyAlert = safeHandler(async (req, res: Response) => {
  const user = getVerifiedUser(req);
  const { pharmacyId, alertId } = req.params;

  await emergencyPharmacyService.acknowledgeAlert(alertId, pharmacyId, user.id);

  return res.status(200).json({
    success: true,
    message: 'Request acknowledged. Review all details and determine appropriate assistance.',
  });
});

/**
 * POST /api/v1/emergency-network/pharmacy/:pharmacyId/alerts/:alertId/preparing
 * Pharmacist marks assistance preparation started
 */
export const markPharmacyPreparing = safeHandler(async (req, res: Response) => {
  const user = getVerifiedUser(req);
  const { pharmacyId, alertId } = req.params;
  const { assistanceDetails } = req.body;

  await emergencyPharmacyService.markPreparing(alertId, pharmacyId, user.id, assistanceDetails);

  return res.status(200).json({
    success: true,
    message: 'Status updated to PREPARING. Confirm when assistance is ready.',
  });
});

/**
 * POST /api/v1/emergency-network/pharmacy/:pharmacyId/alerts/:alertId/ready
 * Pharmacist confirms assistance is ready for the patient
 */
export const markPharmacyAssistanceReady = safeHandler(async (req, res: Response) => {
  const user = getVerifiedUser(req);
  const { pharmacyId, alertId } = req.params;
  const { assistanceDetails } = req.body;

  await emergencyPharmacyService.markAssistanceReady(alertId, pharmacyId, user.id, assistanceDetails);

  return res.status(200).json({
    success: true,
    message: 'Assistance confirmed as READY. Patient / companion will be notified.',
    safetyNotice: 'Remember: final dispensing requires your independent professional assessment at the pharmacy.',
  });
});

/**
 * POST /api/v1/emergency-network/pharmacy/:pharmacyId/alerts/:alertId/reject
 * Pharmacist declines the request (pharmacy at capacity, specialty required, etc.)
 */
export const rejectPharmacyAlert = safeHandler(async (req, res: Response) => {
  const user = getVerifiedUser(req);
  const { pharmacyId, alertId } = req.params;

  await emergencyPharmacyService.rejectAlert(alertId, pharmacyId, user.id);

  return res.status(200).json({
    success: true,
    message: 'Request rejected. Citizen will be advised to contact another pharmacy or emergency services.',
  });
});

/**
 * POST /api/v1/emergency-network/pharmacy/:pharmacyId/alerts/:alertId/escalate
 * Pharmacist escalates — requires immediate emergency care beyond pharmacy scope
 */
export const escalatePharmacyAlert = safeHandler(async (req, res: Response) => {
  const user = getVerifiedUser(req);
  const { pharmacyId, alertId } = req.params;

  await emergencyPharmacyService.escalateAlert(alertId, pharmacyId, user.id);

  return res.status(200).json({
    success: true,
    message: 'Alert escalated. Citizen advised to contact emergency services (112) immediately.',
    urgentAction: 'CALL 112 — This patient requires immediate emergency medical care.',
  });
});

/**
 * POST /api/v1/emergency-network/pharmacy/:pharmacyId/alerts/:alertId/resolve
 * Pharmacist marks emergency pharmacy assistance as completed/resolved
 */
export const resolvePharmacyAlert = safeHandler(async (req, res: Response) => {
  const user = getVerifiedUser(req);
  const { pharmacyId, alertId } = req.params;

  await emergencyPharmacyService.resolveAlert(alertId, pharmacyId, user.id);

  return res.status(200).json({
    success: true,
    message: 'Emergency pharmacy assistance resolved. Thank you for your service.',
  });
});

/**
 * GET /api/v1/emergency-network/pharmacy/:pharmacyId/alerts/:alertId/ai-handoff
 * AI-generated handoff summary for pharmacist. Gemini failure = graceful fallback.
 */
export const getPharmacyAIHandoff = safeHandler(async (req, res: Response) => {
  const { pharmacyId, alertId } = req.params;

  const summary = await emergencyPharmacyService.generatePharmacyHandoff(alertId, pharmacyId);

  return res.status(200).json({
    success: true,
    data: {
      summary,
      disclaimer: 'This summary is AI-generated for pharmacist review only. It is NOT a diagnosis, NOT a prescription, and NOT a substitute for professional assessment. The pharmacist must independently evaluate the patient.',
    },
  });
});
