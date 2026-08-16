import { Router } from 'express';
import {
  getSurveillanceDashboard,
  getOutbreakPredictions,
  getResourceAllocation,
  getHospitalCapacity,
  generateHealthCampaign,
  getSituationReport,
  getSurveillanceAlerts
} from '../controllers/surveillanceController.js';

const router = Router();

// GET /api/v1/surveillance/dashboard - National/State/District aggregates
router.get('/dashboard', getSurveillanceDashboard);

// GET /api/v1/surveillance/outbreak-predictions - Forecast 7, 14, 30 days outbreaks
router.get('/outbreak-predictions', getOutbreakPredictions);

// GET /api/v1/surveillance/resource-allocation - Propose emergency staffing/equipment
router.get('/resource-allocation', getResourceAllocation);

// GET /api/v1/surveillance/hospital-capacity - Occupancy forecasts
router.get('/hospital-capacity', getHospitalCapacity);

// POST /api/v1/surveillance/campaigns - Health campaign auto-generator
router.post('/campaigns', generateHealthCampaign);

// GET /api/v1/surveillance/situation-report - Situation reports
router.get('/situation-report', getSituationReport);

// GET /api/v1/surveillance/alerts - Early warning outbreak alerts
router.get('/alerts', getSurveillanceAlerts);

export default router;
