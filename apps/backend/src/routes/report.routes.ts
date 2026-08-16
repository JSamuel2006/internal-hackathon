import { Router } from 'express';
import { generateReport } from '../controllers/reportController.js';
import {
  handleGetHistory,
  handleGetReportById,
  handleDeleteReport,
  handleGetTrends,
  handleCompareReports,
  handleGetOverallHealthScore
} from '../controllers/medicalReportController.js';

const router = Router();

router.post('/generate', generateReport);
router.get('/history', handleGetHistory);
router.get('/trends', handleGetTrends);
router.post('/compare', handleCompareReports);
router.get('/overall-health', handleGetOverallHealthScore);
router.get('/:id', handleGetReportById);
router.delete('/:id', handleDeleteReport);

export default router;
