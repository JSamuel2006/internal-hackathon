import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { loggingMiddleware } from './middleware/loggingMiddleware.js';
import { env } from './configuration/environment.js';

export function createApp(): Express {
  const app = express();

  // Security & Core Middlewares
  app.use(helmet());
  app.use(cors({
    // Accept any localhost origin in development (covers port changes like 5173→5176→5177)
    // In production, restrict to the configured CORS_ORIGIN only.
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (env.NODE_ENV === 'development' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      const isVercelOrigin = /^https:\/\/internal-hackathon-frontend\.vercel\.app$/i.test(origin) ||
                             /^https:\/\/internal-hackathon-frontend(-[a-z0-9-]+)?-hackza\.vercel\.app$/i.test(origin);
      if (origin === env.CORS_ORIGIN || isVercelOrigin) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin '${origin}' not allowed.`));
    },
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request Logging
  app.use(loggingMiddleware);

  // Health Check Endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'UP',
      platform: 'ArogyaVerse AI Backend API',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
  });

  // API Routes
  app.use('/api/v1', router);

  // Global Error Handler Middleware
  app.use(errorHandler);

  return app;
}

