import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { checkDatabaseHealth } from '../database/db.js';
import { geminiService } from '../services/ai-services/geminiService.js';
import { env } from '../configuration/environment.js';
import { logger } from '../logging/logger.js';

const router = Router();

// ─────────────────────────────────────────────────────────────
// GET /api/v1/system/database-health
// Lightweight PostgreSQL ping with latency and table verification
// ─────────────────────────────────────────────────────────────
router.get('/database-health', async (req: Request, res: Response) => {
  try {
    const { latency, tablesVerified } = await checkDatabaseHealth();
    return res.status(200).json({
      database: 'connected',
      latency: `${latency}ms`,
      tablesVerified,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error({ tag: '[DATABASE]', message: 'Health check failed', error: err.message });
    return res.status(503).json({
      database: 'disconnected',
      latency: null,
      tablesVerified: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/v1/system/health
// Full readiness check — PostgreSQL, Gemini, OCR, uploads, env
// ─────────────────────────────────────────────────────────────
router.get('/health', async (req: Request, res: Response) => {
  const checks: Record<string, { status: 'ok' | 'degraded' | 'error'; detail?: string }> = {};

  // 1. PostgreSQL
  try {
    const { latency, tablesVerified } = await checkDatabaseHealth();
    checks.postgresql = { status: 'ok', detail: `Connected — ${latency}ms, tables verified: ${tablesVerified}` };
  } catch (err: any) {
    checks.postgresql = { status: 'error', detail: err.message };
  }

  // 2. Gemini — verify API key is loaded and SDK initialized
  try {
    const model = geminiService.getActiveModel();
    checks.gemini = {
      status: env.GEMINI_API_KEY ? 'ok' : 'error',
      detail: env.GEMINI_API_KEY ? `SDK ready, active model: ${model}` : 'GEMINI_API_KEY missing',
    };
  } catch (err: any) {
    checks.gemini = { status: 'error', detail: err.message };
  }

  // 3. OCR — verify tesseract trained data file exists
  const ocrDataPath = path.join(process.cwd(), 'eng.traineddata');
  checks.ocr = fs.existsSync(ocrDataPath)
    ? { status: 'ok', detail: `Tesseract eng.traineddata found (${(fs.statSync(ocrDataPath).size / 1024 / 1024).toFixed(1)} MB)` }
    : { status: 'degraded', detail: 'eng.traineddata not found — OCR may fail' };

  // 4. Upload directory
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    // Disk write permission test
    const testFile = path.join(uploadDir, `.write-probe-${Date.now()}`);
    fs.writeFileSync(testFile, 'probe');
    fs.unlinkSync(testFile);
    checks.uploadDirectory = { status: 'ok', detail: `${uploadDir} — writable` };
  } catch (err: any) {
    checks.uploadDirectory = { status: 'error', detail: `Upload directory not writable: ${err.message}` };
  }

  // 5. Environment variables
  const requiredEnv = ['DATABASE_URL', 'GEMINI_API_KEY', 'JWT_SECRET', 'PORT'];
  const missingEnv = requiredEnv.filter(k => !process.env[k]);
  checks.environment = missingEnv.length === 0
    ? { status: 'ok', detail: 'All required environment variables present' }
    : { status: 'error', detail: `Missing: ${missingEnv.join(', ')}` };

  // Overall status
  const statuses = Object.values(checks).map(c => c.status);
  const hasError = statuses.includes('error');
  const hasDegraded = statuses.includes('degraded');
  const overall = hasError ? 'unhealthy' : hasDegraded ? 'degraded' : 'healthy';

  return res.status(hasError ? 503 : 200).json({
    status: overall,
    version: '1.0.0',
    platform: 'ArogyaVerse AI Backend',
    timestamp: new Date().toISOString(),
    checks,
  });
});

export default router;
