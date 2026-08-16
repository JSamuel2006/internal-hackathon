import { Router } from 'express';
import { getSystemHealth, getAuditLogs, logAuditEvent } from '../controllers/superAdminController.js';

const router = Router();

router.get('/system-health', getSystemHealth);
router.get('/audit-logs', getAuditLogs);
router.post('/audit-event', logAuditEvent);

export default router;
