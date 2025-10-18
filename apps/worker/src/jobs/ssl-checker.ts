import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../logger';
import { checkSslCertificate, extractDomain, needsAlert } from '../lib/ssl-checker';

const logger = createLogger('ssl-checker');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

/**
 * Queue for SSL certificate checks
 */
export const sslCheckQueue = new Queue('ssl-check', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

/**
 * Check SSL certificate for a specific monitor
 */
async function checkMonitorSsl(monitorId: string) {
  logger.info(`Checking SSL certificate for monitor ${monitorId}`);

  try {
    // Get monitor details
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
      select: {
        id: true,
        name: true,
        token: true,
        checkSsl: true,
        sslAlertThresholds: true,
        Org: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!monitor) {
      logger.warn(`Monitor ${monitorId} not found`);
      return;
    }

    if (!monitor.checkSsl) {
      logger.info(`SSL checking disabled for monitor ${monitor.id}`);
      return;
    }

    // Construct URL from monitor token (assumes HTTPS endpoint)
    // For ping monitors, we need to derive the URL
    // For now, assume the monitor name or a custom field contains the URL
    // TODO: Add a dedicated `url` field to Monitor model for HTTP/SSL checks
    
    // For this implementation, we'll check the app domain itself
    // In production, you'd want a separate field for the URL to check
    const urlToCheck = process.env.NEXTAUTH_URL || 'https://saturnmonitor.com';

    // Perform SSL check
    const sslResult = await checkSslCertificate(urlToCheck);

    // Get previous SSL certificate record
    const previousCert = await prisma.sslCertificate.findFirst({
      where: { monitorId: monitor.id },
      orderBy: { createdAt: 'desc' },
    });

    // Determine if we need to create an incident
    const shouldAlert = needsAlert(
      sslResult.daysUntilExpiry,
      monitor.sslAlertThresholds,
      previousCert?.daysUntilExpiry
    );

    // Store SSL certificate information
    const sslCertificate = await prisma.sslCertificate.create({
      data: {
        monitorId: monitor.id,
        domain: sslResult.domain,
        issuer: sslResult.issuer,
        subject: sslResult.subject,
        issuedAt: sslResult.issuedAt,
        expiresAt: sslResult.expiresAt,
        daysUntilExpiry: sslResult.daysUntilExpiry,
        isValid: sslResult.isValid,
        isSelfSigned: sslResult.isSelfSigned,
        chainValid: sslResult.chainValid,
        validationError: sslResult.validationError,
        serialNumber: sslResult.serialNumber,
        fingerprint: sslResult.fingerprint,
        lastCheckedAt: new Date(),
      },
    });

    logger.info(
      `SSL certificate checked for ${sslResult.domain}: ${sslResult.daysUntilExpiry} days until expiry`
    );

    // Create incident if certificate is expiring or invalid
    if (shouldAlert || !sslResult.isValid) {
      let incidentKind: 'MISSED' | 'LATE' | 'FAIL' | 'ANOMALY' = 'FAIL';
      let summary = '';

      if (!sslResult.isValid) {
        summary = `SSL Certificate Invalid: ${sslResult.validationError || 'Unknown error'}`;
      } else if (sslResult.daysUntilExpiry <= 0) {
        summary = `SSL Certificate Expired for ${sslResult.domain}`;
      } else if (sslResult.daysUntilExpiry <= 7) {
        summary = `SSL Certificate expires in ${sslResult.daysUntilExpiry} day(s) for ${sslResult.domain}`;
      } else if (sslResult.daysUntilExpiry <= 14) {
        summary = `SSL Certificate expires in ${sslResult.daysUntilExpiry} days for ${sslResult.domain}`;
      } else {
        summary = `SSL Certificate expires in ${sslResult.daysUntilExpiry} days for ${sslResult.domain}`;
      }

      // Check if there's already an open incident for this
      const existingIncident = await prisma.incident.findFirst({
        where: {
          monitorId: monitor.id,
          status: { in: ['OPEN', 'ACKED'] },
          summary: { contains: 'SSL Certificate' },
        },
      });

      if (!existingIncident) {
        // Create new incident
        const incident = await prisma.incident.create({
          data: {
            id: `inc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            monitorId: monitor.id,
            kind: incidentKind,
            summary,
            details: `
SSL Certificate Check Results:
- Domain: ${sslResult.domain}
- Issuer: ${sslResult.issuer}
- Expires: ${sslResult.expiresAt.toISOString()}
- Days Until Expiry: ${sslResult.daysUntilExpiry}
- Valid: ${sslResult.isValid}
- Self-Signed: ${sslResult.isSelfSigned}
- Chain Valid: ${sslResult.chainValid}
${sslResult.validationError ? `- Error: ${sslResult.validationError}` : ''}
            `.trim(),
            status: 'OPEN',
            openedAt: new Date(),
          },
        });

        logger.info(`Created incident ${incident.id} for SSL certificate issue`);

        // Queue alert notifications
        const { notificationQueue } = await import('../queues');
        await notificationQueue.add('dispatch-alerts', {
          incidentId: incident.id,
        });
      } else {
        logger.info(`Existing incident ${existingIncident.id} found, not creating duplicate`);
      }
    }

    return sslCertificate;
  } catch (error) {
    logger.error({ err: error, monitorId }, `Failed to check SSL certificate for monitor ${monitorId}`);
    throw error;
  }
}

/**
 * Start SSL checker worker
 */
export function startSslCheckWorker() {
  const worker = new Worker(
    'ssl-check',
    async (job) => {
      const { monitorId } = job.data;
      return await checkMonitorSsl(monitorId);
    },
    { connection }
  );

  worker.on('completed', (job) => {
    logger.info(`SSL check job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `SSL check job ${job?.id} failed`);
  });

  return worker;
}

/**
 * Schedule SSL checks for all monitors
 * This should be called periodically (e.g., every 6 hours via cron)
 */
export async function scheduleAllSslChecks() {
  logger.info('Scheduling SSL checks for all monitors');

  try {
    const monitors = await prisma.monitor.findMany({
      where: {
        checkSsl: true,
        status: { not: 'DISABLED' },
      },
      select: {
        id: true,
        name: true,
      },
    });

    logger.info(`Found ${monitors.length} monitors with SSL checking enabled`);

    let queued = 0;
    for (const monitor of monitors) {
      try {
        await sslCheckQueue.add(
          'check-ssl',
          { monitorId: monitor.id },
          {
            jobId: `ssl-${monitor.id}-${Date.now()}`,
            removeOnComplete: 50,
            removeOnFail: 50,
          }
        );
        queued++;
      } catch (error) {
        logger.error({ err: error, monitorId: monitor.id }, `Failed to queue SSL check for monitor ${monitor.id}`);
      }
    }

    logger.info(`Queued ${queued} SSL checks`);
    return { total: monitors.length, queued };
  } catch (error) {
    logger.error({ err: error }, 'Failed to schedule SSL checks');
    throw error;
  }
}

