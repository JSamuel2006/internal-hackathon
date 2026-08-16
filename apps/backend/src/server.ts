import { createApp } from './app.js';
import { logger } from './logging/logger.js';
import { env } from './configuration/environment.js';
import { initializeDatabase, closePool } from './database/db.js';
import path from 'path';
import fs from 'fs';

// ─────────────────────────────────────────────────────────────
// BOOT — structured startup with pre-flight checks
// Express does NOT start listening until PostgreSQL is verified
// ─────────────────────────────────────────────────────────────
async function bootstrap() {
  logger.info({ tag: '[BOOT]', message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' });
  logger.info({ tag: '[BOOT]', message: '🏥  ArogyaVerse AI Backend — Starting up...' });
  logger.info({ tag: '[BOOT]', message: `🌍  Environment : ${env.NODE_ENV}` });
  logger.info({ tag: '[BOOT]', message: `🔌  Port        : ${env.PORT}` });
  logger.info({ tag: '[BOOT]', message: `🗄️  Database    : ${env.DATABASE_URL.replace(/:([^:@]+)@/, ':***@')}` });
  logger.info({ tag: '[BOOT]', message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' });

  // ── 1. Verify upload directory is writable ──────────────────
  const uploadDir = path.join(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const probe = path.join(uploadDir, `.boot-probe-${Date.now()}`);
    fs.writeFileSync(probe, 'ok');
    fs.unlinkSync(probe);
    logger.info({ tag: '[BOOT]', message: `✅ Upload directory ready: ${uploadDir}` });
  } catch (err: any) {
    logger.error({ tag: '[BOOT]', message: `❌ Upload directory not writable: ${err.message}` });
    process.exit(1);
  }

  // ── 2. Connect to PostgreSQL and verify schema ───────────────
  logger.info({ tag: '[DATABASE]', message: 'Connecting to PostgreSQL...' });
  try {
    await initializeDatabase();
    logger.info({ tag: '[DATABASE]', message: '✅ PostgreSQL connected and schema verified' });
  } catch (err: any) {
    logger.error({ tag: '[DATABASE]', message: '❌ CRITICAL: PostgreSQL unavailable — aborting startup', error: err.message });
    logger.error({ tag: '[DATABASE]', message: '   Start PostgreSQL with: pg_ctl start -D "<data-dir>"' });
    process.exit(1);
  }

  // ── 3. Build Express app and start HTTP server ───────────────
  logger.info({ tag: '[SERVER]', message: 'Initialising Express application...' });
  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info({ tag: '[SERVER]', message: `✅ HTTP server listening on port ${env.PORT}` });
    logger.info({ tag: '[READY]',  message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' });
    logger.info({ tag: '[READY]',  message: '🚀 ArogyaVerse API is READY TO SERVE TRAFFIC' });
    logger.info({ tag: '[READY]',  message: `   Health  → http://localhost:${env.PORT}/api/v1/system/health` });
    logger.info({ tag: '[READY]',  message: `   DB ping → http://localhost:${env.PORT}/api/v1/system/database-health` });
    logger.info({ tag: '[READY]',  message: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' });
  });

  // ── 4. Graceful shutdown handler ────────────────────────────
  async function gracefulShutdown(signal: string) {
    logger.warn({ tag: '[SERVER]', message: `${signal} received — starting graceful shutdown...` });

    // Stop accepting new connections
    server.close(async () => {
      logger.info({ tag: '[SERVER]', message: '✅ HTTP server closed — no new requests accepted' });

      // Drain PostgreSQL pool
      try {
        await closePool();
      } catch (err: any) {
        logger.error({ tag: '[DATABASE]', message: 'Error closing PostgreSQL pool', error: err.message });
      }

      logger.info({ tag: '[READY]', message: '✅ Graceful shutdown complete. Exiting.' });
      process.exit(0);
    });

    // Force-kill if shutdown takes longer than 10 s
    setTimeout(() => {
      logger.error({ tag: '[SERVER]', message: '⚠️  Shutdown timed out after 10s — forcing exit' });
      process.exit(1);
    }, 10_000);
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

  // Catch unhandled promise rejections so they don't crash silently
  process.on('unhandledRejection', (reason: any) => {
    logger.error({ tag: '[BOOT]', message: '⚠️  Unhandled Promise Rejection', reason: String(reason) });
  });

  process.on('uncaughtException', (err: Error) => {
    logger.error({ tag: '[BOOT]', message: '💥 Uncaught Exception — shutting down', error: err.message, stack: err.stack });
    gracefulShutdown('uncaughtException');
  });
}

// ── Kick off bootstrap ──────────────────────────────────────
bootstrap().catch((err) => {
  console.error('FATAL bootstrap error:', err);
  process.exit(1);
});
