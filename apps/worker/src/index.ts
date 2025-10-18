import { createLogger } from './logger';
import { initializeSentry, captureJobError } from './sentry';
import { startEvaluator } from './jobs/evaluator';
import { startAlertWorker } from './jobs/alerts';
import { startAlertChannelsWorker } from './jobs/alert-channels';
import { startEmailWorker } from './jobs/email';
import { startSlackWorker } from './jobs/slack';
import { startDiscordWorker } from './jobs/discord';
import { startWebhookWorker } from './jobs/webhook';
import { startDataExportWorker } from './jobs/data-export';
import { startSslCheckWorker, scheduleAllSslChecks } from './jobs/ssl-checker';
import { startDomainCheckWorker, scheduleAllDomainChecks } from './jobs/domain-checker';
import { startSyntheticMonitorWorker, scheduleAllSyntheticMonitors } from './jobs/synthetic-monitor';
import { startSlaReportWorker } from './jobs/sla-reports';
import { startScheduledReportsChecker } from './jobs/scheduled-reports';
import { startHealthCheckServer } from './health';
import { prisma } from '@tokiflow/db';
import Redis from 'ioredis';

const logger = createLogger('main');

// Initialize Sentry before anything else
initializeSentry();

// Redis for heartbeats
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Worker ID (unique per instance)
const WORKER_ID = process.env.WORKER_ID || `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const WORKER_REGION = process.env.FLY_REGION || process.env.REGION || 'local';
const WORKER_VERSION = process.env.npm_package_version || '1.0.0';

/**
 * Send worker heartbeat to Redis
 */
async function sendHeartbeat() {
  try {
    const heartbeatData = {
      worker_id: WORKER_ID,
      region: WORKER_REGION,
      version: WORKER_VERSION,
      timestamp: Date.now(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    // Store heartbeat with 3 minute TTL
    await redis.setex(
      `worker:heartbeat:${WORKER_ID}`,
      180, // 3 minutes
      JSON.stringify(heartbeatData)
    );
  } catch (error) {
    logger.error({ err: error }, 'Failed to send heartbeat');
  }
}

async function main() {
  logger.info('🚀 Starting PulseGuard Worker...');

  try {
    // Start health check server (for Fly.io health checks)
    const port = Number(process.env.PORT) || 8080;
    startHealthCheckServer(port);
    logger.info(`✅ Health check server started on port ${port}`);

    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Start workers
    startEvaluator();
    logger.info('✅ Evaluator worker started');

    startAlertWorker();
    logger.info('✅ Alert dispatcher worker started');

    startAlertChannelsWorker();
    logger.info('✅ Alert channels worker started (PagerDuty, Teams, SMS)');

    startEmailWorker();
    logger.info('✅ Email worker started');

    startSlackWorker();
    logger.info('✅ Slack worker started');

    startDiscordWorker();
    logger.info('✅ Discord worker started');

    startWebhookWorker();
    logger.info('✅ Webhook worker started');

    startDataExportWorker();
    logger.info('✅ Data export worker started');

    startSslCheckWorker();
    logger.info('✅ SSL checker worker started');

    startDomainCheckWorker();
    logger.info('✅ Domain checker worker started');

    startSyntheticMonitorWorker();
    logger.info('✅ Synthetic monitor worker started');

  startSlaReportWorker();
  logger.info('✅ SLA report worker started');

  // Start scheduled reports checker (runs every hour)
  const scheduledReportsInterval = startScheduledReportsChecker();
  logger.info('✅ Scheduled reports checker started');

  // Schedule initial SSL checks (runs every 6 hours)
    setInterval(async () => {
      try {
        await scheduleAllSslChecks();
      } catch (error) {
        logger.error({ err: error }, 'Failed to schedule SSL checks');
      }
    }, 6 * 60 * 60 * 1000); // 6 hours

    // Schedule domain checks (runs daily)
    setInterval(async () => {
      try {
        await scheduleAllDomainChecks();
      } catch (error) {
        logger.error({ err: error }, 'Failed to schedule domain checks');
      }
    }, 24 * 60 * 60 * 1000); // 24 hours

    // Initial checks after startup
    setTimeout(async () => {
      try {
        await scheduleAllSslChecks();
        logger.info('Initial SSL checks scheduled');
      } catch (error) {
        logger.error({ err: error }, 'Failed to run initial SSL checks');
      }
    }, 10000); // Wait 10 seconds

    setTimeout(async () => {
      try {
        await scheduleAllDomainChecks();
        logger.info('Initial domain checks scheduled');
      } catch (error) {
        logger.error({ err: error }, 'Failed to run initial domain checks');
      }
    }, 15000); // Wait 15 seconds

    setTimeout(async () => {
      try {
        await scheduleAllSyntheticMonitors();
        logger.info('Initial synthetic monitors scheduled');
      } catch (error) {
        logger.error({ err: error }, 'Failed to schedule initial synthetic monitors');
      }
    }, 20000); // Wait 20 seconds

    logger.info('✨ All workers running');

    // Start heartbeat (send every 60 seconds)
    logger.info(`💓 Worker heartbeat started (ID: ${WORKER_ID}, Region: ${WORKER_REGION})`);
    await sendHeartbeat(); // Send initial heartbeat
    const heartbeatInterval = setInterval(sendHeartbeat, 60000); // Every 60s

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
    logger.error({ err: error }, 'Failed to start worker');
    captureJobError(error as Error, 'worker-startup');
    process.exit(1);
  }
}

main();

