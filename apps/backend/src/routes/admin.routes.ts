import { Router } from 'express';
import {
  getAdminDashboardMetrics,
  getAdminExecutiveInsights,
  simulatePolicyImpact,
  getSystemHealthStatus,
  getAdminAuditLogs,
  getSituationReport
} from '../controllers/adminIntelController.js';

const router = Router();

// GET /api/v1/admin/dashboard - KPI overview
router.get('/dashboard', getAdminDashboardMetrics);

// GET /api/v1/admin/insights - MoH Executive insights
router.get('/insights', getAdminExecutiveInsights);

// POST /api/v1/admin/simulate-policy - Simulate health policy scenarios
router.post('/simulate-policy', simulatePolicyImpact);

// GET /api/v1/admin/system-health - PostgreSQL & latency stats
router.get('/system-health', getSystemHealthStatus);

// GET /api/v1/admin/audit-logs - Audit trail
router.get('/audit-logs', getAdminAuditLogs);

// GET /api/v1/admin/situation-report - Situation reports
router.get('/situation-report', getSituationReport);

export default router;
