import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'arogyaverse-backend-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => {
            let log = `${info.timestamp} [${info.level}]: ${info.message}`;
            if (info.error) {
              log += `\nError: ${info.error}`;
            }
            if (info.stack) {
              log += `\nStack: ${info.stack}`;
            }
            // If there's any other metadata, log it in development
            const metadata = { ...info } as any;
            delete metadata.timestamp;
            delete metadata.level;
            delete metadata.message;
            delete metadata.service;
            delete metadata.error;
            delete metadata.stack;
            if (Object.keys(metadata).length > 0) {
              log += `\nMetadata: ${JSON.stringify(metadata)}`;
            }
            return log;
          }
        )
      ),
    }),
  ],
});
