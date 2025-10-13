import { createLogger } from './logger';
import { initializeSentry, captureJobError } from './sentry';
import { startEvaluator } from './jobs/evaluator';
import { startAlertWorker } from './jobs/alerts';
import { startEmailWorker } from './jobs/email';
import { startSlackWorker } from './jobs/slack';
import { startDiscordWorker } from './jobs/discord';
import { startWebhookWorker } from './jobs/webhook';
import { prisma } from '@tokiflow/db';

const logger = createLogger('main');

// Initialize Sentry before anything else
initializeSentry();

async function main() {
  logger.info('🚀 Starting PulseGuard Worker...');

  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Start workers
    startEvaluator();
    logger.info('✅ Evaluator worker started');

    startAlertWorker();
    logger.info('✅ Alert dispatcher worker started');

    startEmailWorker();
    logger.info('✅ Email worker started');

    startSlackWorker();
    logger.info('✅ Slack worker started');

    startDiscordWorker();
    logger.info('✅ Discord worker started');

    startWebhookWorker();
    logger.info('✅ Webhook worker started');

    logger.info('✨ All workers running');

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully...');
      await prisma.$disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully...');
      await prisma.$disconnect();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start worker:', error);
    captureJobError(error as Error, 'worker-startup');
    process.exit(1);
  }
}

main();

