import { Router } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.js';
import {
  createEmergencySession,
  getEmergencySession,
  sendHospitalAlert,
  manageConsent,
  getMedicalHistory,
  resolveEmergencySession,
  getHospitalAlertQueue,
  acknowledgeHospitalAlert,
  getDoctorChatQueue,
  getNearbyFacilities,
  quickClassify,
} from '../controllers/emergencyNetworkController.js';
import {
  requestDoctorAssistance,
  getDoctorRequests,
  acceptDoctorRequest,
  declineDoctorRequest,
  getChatMessages,
  sendChatMessage,
  closeDoctorRequest,
  getEmergencyContext,
  getChatSummary,
  getDoctorAssistanceStatus,
} from '../controllers/emergencyDoctorChatController.js';
import {
  getNearbyEmergencyPharmacies,
  requestPharmacyAssistance,
  getSessionPharmacyStatus,
  getPharmacyEmergencyQueue,
  getPharmacyAlertContext,
  acknowledgePharmacyAlert,
  markPharmacyPreparing,
  markPharmacyAssistanceReady,
  rejectPharmacyAlert,
  escalatePharmacyAlert,
  resolvePharmacyAlert,
  getPharmacyAIHandoff,
} from '../controllers/pharmacyEmergencyController.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// All routes require valid JWT
// ─────────────────────────────────────────────────────────────

// Feature 1 — Emergency ML Classification
// Preview classification without creating session
router.post('/classify', authenticateJWT, quickClassify);

// Create emergency session (classification runs inside)
router.post('/session', authenticateJWT, createEmergencySession);

// Get session status + classification result
router.get('/session/:id', authenticateJWT, getEmergencySession);

// Feature 4 — Hospital Pre-Alert
router.post('/session/:id/hospital-alert', authenticateJWT, sendHospitalAlert);

// ─────────────────────────────────────────────────────────────
// Feature 3 — Phase C: Pharmacy Emergency Assistance (Citizen)
// ─────────────────────────────────────────────────────────────

// Citizen: list nearby participating pharmacies before choosing one
router.get('/pharmacy/nearby', authenticateJWT, getNearbyEmergencyPharmacies);

// Citizen: request assistance from a specific pharmacy (Phase C replaces old sendPharmacyAlert)
router.post('/session/:id/pharmacy-alert', authenticateJWT, requestPharmacyAssistance);

// Citizen: poll all pharmacy alert statuses for their session
router.get('/session/:id/pharmacy-status', authenticateJWT, getSessionPharmacyStatus);

// Consent management (grant or revoke medical history access)
router.post('/session/:id/consent', authenticateJWT, manageConsent);

// Consent-gated medical history (for hospital/pharmacy/doctor access)
// Note: requestingEntity is passed as ?entity= query param (no patient PII in URL)
router.get('/session/:id/medical-history', authenticateJWT, getMedicalHistory);

// Resolve / close emergency session
router.post('/session/:id/resolve', authenticateJWT, resolveEmergencySession);

// Nearby hospitals + pharmacies (used by citizen ERN page)
router.get('/facilities', authenticateJWT, getNearbyFacilities);

// ─────────────────────────────────────────────────────────────
// Feature 4 — Hospital Dashboard: Incoming Pre-Alert Queue
// ─────────────────────────────────────────────────────────────
router.get('/hospital/:hospitalId/alerts', authenticateJWT, getHospitalAlertQueue);

// Acknowledge an incoming pre-alert
router.post('/hospital/:hospitalId/alerts/:alertId/acknowledge', authenticateJWT, acknowledgeHospitalAlert);

// ─────────────────────────────────────────────────────────────
// Feature 2 — Doctor Customer-Care Chat Queue
// ─────────────────────────────────────────────────────────────
router.get('/doctor/chat-queue', authenticateJWT, getDoctorChatQueue);

// ─────────────────────────────────────────────────────────────
// Feature 3 — Phase C: Pharmacy Dashboard (Pharmacist)
// ─────────────────────────────────────────────────────────────

// Pharmacist: incoming emergency queue (with full Phase C status model)
router.get('/pharmacy/:pharmacyId/alerts', authenticateJWT, getPharmacyEmergencyQueue);

// Pharmacist: full alert context for a specific request
router.get('/pharmacy/:pharmacyId/alerts/:alertId', authenticateJWT, getPharmacyAlertContext);

// Pharmacist: acknowledge — commits to reviewing request
router.post('/pharmacy/:pharmacyId/alerts/:alertId/acknowledge', authenticateJWT, acknowledgePharmacyAlert);

// Pharmacist: mark assistance as being prepared
router.post('/pharmacy/:pharmacyId/alerts/:alertId/preparing', authenticateJWT, markPharmacyPreparing);

// Pharmacist: confirm assistance is ready
router.post('/pharmacy/:pharmacyId/alerts/:alertId/ready', authenticateJWT, markPharmacyAssistanceReady);

// Pharmacist: reject request (cannot help in this case)
router.post('/pharmacy/:pharmacyId/alerts/:alertId/reject', authenticateJWT, rejectPharmacyAlert);

// Pharmacist: escalate — requires emergency services
router.post('/pharmacy/:pharmacyId/alerts/:alertId/escalate', authenticateJWT, escalatePharmacyAlert);

// Pharmacist: resolve — assistance provided, case closed
router.post('/pharmacy/:pharmacyId/alerts/:alertId/resolve', authenticateJWT, resolvePharmacyAlert);

// AI handoff summary for pharmacist review (Gemini, with safe fallback)
router.get('/pharmacy/:pharmacyId/alerts/:alertId/ai-handoff', authenticateJWT, getPharmacyAIHandoff);

// ─────────────────────────────────────────────────────────────
// Feature 2 — Doctor Customer-Care Chat API (New Endpoints)
// ─────────────────────────────────────────────────────────────

// Request assistance (Citizen)
router.post('/session/:id/doctor-assistance', authenticateJWT, requestDoctorAssistance);

// Get assistance request status (Citizen)
router.get('/session/:id/doctor-status', authenticateJWT, getDoctorAssistanceStatus);

// View list of requests (Doctor)
router.get('/doctor/requests', authenticateJWT, getDoctorRequests);

// Accept assistance request (Doctor)
router.post('/doctor/requests/:requestId/accept', authenticateJWT, acceptDoctorRequest);

// Decline assistance request (Doctor)
router.post('/doctor/requests/:requestId/decline', authenticateJWT, declineDoctorRequest);

// Close conversation (Citizen / Doctor)
router.post('/doctor/requests/:requestId/close', authenticateJWT, closeDoctorRequest);

// Fetch conversation message list
router.get('/doctor/requests/:requestId/messages', authenticateJWT, getChatMessages);

// Send message to chat
router.post('/doctor/requests/:requestId/messages', authenticateJWT, sendChatMessage);

// Get clinical emergency session context (Doctor)
router.get('/doctor/requests/:requestId/context', authenticateJWT, getEmergencyContext);

// Fetch automated handoff summary (AI-assisted)
router.get('/doctor/requests/:requestId/ai-summary', authenticateJWT, getChatSummary);

export default router;

