import { Worker, Queue } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../logger';
import { checkDomainExpiration, parseDomainFromUrl, needsDomainAlert } from '../lib/whois-checker';

const logger = createLogger('domain-checker');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

/**
 * Queue for domain expiration checks
 */
export const domainCheckQueue = new Queue('domain-check', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000, // 10 seconds
    },
    removeOnComplete: 50,
    removeOnFail: 50,
  },
});

/**
 * Check domain expiration for a specific monitor
 */
async function checkMonitorDomain(monitorId: string) {
  logger.info(`Checking domain expiration for monitor ${monitorId}`);

  try {
    // Get monitor details
    const monitor = await prisma.Monitor.findUnique({
      where: { id: monitorId },
      select: {
        id: true,
        name: true,
        checkDomain: true,
        domainAlertThresholds: true,
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

    if (!monitor.checkDomain) {
      logger.info(`Domain checking disabled for monitor ${monitor.id}`);
      return;
    }

    // Extract domain from monitor name or use configured domain
    // TODO: Add a dedicated `domain` field to Monitor model
    // For now, we'll use the monitor name as the domain
    const domainToCheck = parseDomainFromUrl(monitor.name);

    // Perform WHOIS lookup
    const domainResult = await checkDomainExpiration(domainToCheck);

    // Get previous domain expiration record
    const previousRecord = await prisma.domainExpiration.findFirst({
      where: { monitorId: monitor.id },
      orderBy: { createdAt: 'desc' },
    });

    // Determine if we need to create an incident
    const shouldAlert = needsDomainAlert(
      domainResult.daysUntilExpiry,
      monitor.domainAlertThresholds,
      previousRecord?.daysUntilExpiry
    );

    // Store domain expiration information
    const domainExpiration = await prisma.domainExpiration.create({
      data: {
        monitorId: monitor.id,
        domain: domainResult.domain,
        registrar: domainResult.registrar,
        registeredAt: domainResult.registeredAt,
        expiresAt: domainResult.expiresAt,
        daysUntilExpiry: domainResult.daysUntilExpiry,
        autoRenew: domainResult.autoRenew,
        nameservers: domainResult.nameservers,
        status: domainResult.status,
        whoisServer: domainResult.whoisServer,
        lastCheckedAt: new Date(),
      },
    });

    logger.info(
      `Domain checked for ${domainResult.domain}: ${domainResult.daysUntilExpiry} days until expiry`
    );

    // Create incident if domain is expiring
    if (shouldAlert || domainResult.daysUntilExpiry <= 0) {
      let incidentKind: 'MISSED' | 'LATE' | 'FAIL' | 'ANOMALY' = 'FAIL';
      let summary = '';

      if (domainResult.daysUntilExpiry <= 0) {
        summary = `Domain Expired: ${domainResult.domain}`;
      } else if (domainResult.daysUntilExpiry <= 14) {
        summary = `Domain expires in ${domainResult.daysUntilExpiry} day(s): ${domainResult.domain}`;
      } else if (domainResult.daysUntilExpiry <= 30) {
        summary = `Domain expires in ${domainResult.daysUntilExpiry} days: ${domainResult.domain}`;
      } else {
        summary = `Domain expires in ${domainResult.daysUntilExpiry} days: ${domainResult.domain}`;
      }

      // Check if there's already an open incident for this
      const existingIncident = await prisma.incident.findFirst({
        where: {
          monitorId: monitor.id,
          status: { in: ['OPEN', 'ACKED'] },
          summary: { contains: 'Domain' },
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
Domain Registration Check Results:
- Domain: ${domainResult.domain}
- Registrar: ${domainResult.registrar}
- Registered: ${domainResult.registeredAt?.toISOString() || 'Unknown'}
- Expires: ${domainResult.expiresAt.toISOString()}
- Days Until Expiry: ${domainResult.daysUntilExpiry}
- Auto-Renew: ${domainResult.autoRenew ?? 'Unknown'}
- Nameservers: ${domainResult.nameservers.join(', ')}
- Status: ${domainResult.status.join(', ')}
            `.trim(),
            status: 'OPEN',
            openedAt: new Date(),
          },
        });

        logger.info(`Created incident ${incident.id} for domain expiration`);

        // Queue alert notifications
        const { notificationQueue } = await import('../queues');
        await notificationQueue.add('dispatch-alerts', {
          incidentId: incident.id,
        });
      } else {
        logger.info(`Existing incident ${existingIncident.id} found, not creating duplicate`);
      }
    }

    return domainExpiration;
  } catch (error) {
    logger.error({ err: error, monitorId }, `Failed to check domain for monitor ${monitorId}`);
    throw error;
  }
}

/**
 * Start domain checker worker
 */
export function startDomainCheckWorker() {
  const worker = new Worker(
    'domain-check',
    async (job) => {
      const { monitorId } = job.data;
      return await checkMonitorDomain(monitorId);
    },
    { connection }
  );

  worker.on('completed', (job) => {
    logger.info(`Domain check job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Domain check job ${job?.id} failed`);
  });

  return worker;
}

/**
 * Schedule domain checks for all monitors
 * This should be called periodically (e.g., daily via cron)
 */
export async function scheduleAllDomainChecks() {
  logger.info('Scheduling domain checks for all monitors');

  try {
    const monitors = await prisma.Monitor.findMany({
      where: {
        checkDomain: true,
        status: { not: 'DISABLED' },
      },
      select: {
        id: true,
        name: true,
      },
    });

    logger.info(`Found ${monitors.length} monitors with domain checking enabled`);

    let queued = 0;
    for (const monitor of monitors) {
      try {
        // Spread out checks to avoid rate limiting
        const delay = queued * 5000; // 5 seconds between each check
        
        await domainCheckQueue.add(
          'check-domain',
          { monitorId: monitor.id },
          {
            jobId: `domain-${monitor.id}-${Date.now()}`,
            delay,
            removeOnComplete: 50,
            removeOnFail: 50,
          }
        );
        queued++;
      } catch (error) {
        logger.error({ err: error, monitorId: monitor.id }, `Failed to queue domain check for monitor ${monitor.id}`);
      }
    }

    logger.info(`Queued ${queued} domain checks`);
    return { total: monitors.length, queued };
  } catch (error) {
    logger.error({ err: error }, 'Failed to schedule domain checks');
    throw error;
  }
}

