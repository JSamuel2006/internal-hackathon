import { Router } from 'express';
import { handleTriageQuery, handleTranslate } from '../controllers/aiController.js';
import { handleAnalyzeMedicine } from '../controllers/medicineController.js';
import { handleAnalyzeReport } from '../controllers/reportAnalysisController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = Router();

// POST /api/v1/ai/triage - Process multi-lingual symptom triage query
router.post('/triage', handleTriageQuery);

// POST /api/v1/ai/translate - Indic Bhashini voice/text translation proxy
router.post('/translate', handleTranslate);

// POST /api/v1/ai/scan-medicine - AI OCR medicine strip scanner (Backward compatible)
router.post('/scan-medicine', upload.single('image'), handleAnalyzeMedicine);

// POST /api/v1/ai/analyze-report - AI Medical Report Analyzer
router.post('/analyze-report', upload.single('report'), handleAnalyzeReport);

export default router;

