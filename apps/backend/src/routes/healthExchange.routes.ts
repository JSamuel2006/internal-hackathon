import { Router } from 'express';
import {
  getInteropProfile,
  createInteropProfile,
  getFHIRBundle,
  exportFHIRBundle,
  importFHIRBundle,
  getExchangeHistory,
  updateExchangeConsent,
  getConsentHistory
} from '../controllers/healthExchangeController.js';

const router = Router();

// GET /api/v1/interoperability/profile - Retrieve ABHA profile
router.get('/profile', getInteropProfile);

// POST /api/v1/interoperability/profile - Register/link ABHA ID
router.post('/profile', createInteropProfile);

// GET /api/v1/interoperability/fhir - View FHIR Bundle JSON
router.get('/fhir', getFHIRBundle);

// POST /api/v1/interoperability/export - Export clinical records to FHIR
router.post('/export', exportFHIRBundle);

// POST /api/v1/interoperability/import - Import external FHIR bundle
router.post('/import', importFHIRBundle);

// GET /api/v1/interoperability/history - View exchange sync timeline
router.get('/history', getExchangeHistory);

// POST /api/v1/interoperability/consent - Approve/reject consent request
router.post('/consent', updateExchangeConsent);

// GET /api/v1/interoperability/consent-history - View hospital consents
router.get('/consent-history', getConsentHistory);

export default router;
