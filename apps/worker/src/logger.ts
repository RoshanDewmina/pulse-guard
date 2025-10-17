import pino from 'pino';

export function createLogger(name: string) {
  // Use JSON logging for production (no transport needed)
  // For development with pretty logs, set PINO_PRETTY=true
  return pino({
    name,
    level: process.env.LOG_LEVEL || 'info',
  });
}

