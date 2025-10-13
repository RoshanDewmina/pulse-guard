import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import { alertsQueue } from '../queues';
import { createLogger } from '../logger';
import crypto from 'crypto';

const logger = createLogger('check-missed');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

interface CheckMissedJobData {
  monitorId: string;
  expectedAt: number; // timestamp in milliseconds
}

export function startCheckMissedWorker() {
  const worker = new Worker<CheckMissedJobData>(
    'check-missed',
    async (job: Job<CheckMissedJobData>) => {
      const { monitorId, expectedAt } = job.data;
      
      logger.info(`Checking if monitor ${monitorId} missed expected run at ${new Date(expectedAt).toISOString()}`);

      const monitor = await prisma.monitor.findUnique({
        where: { id: monitorId },
        include: {
          org: true,
        },
      });

      if (!monitor) {
        logger.warn(`Monitor ${monitorId} not found, skipping check`);
        return;
      }

      if (monitor.status === 'DISABLED') {
        logger.info(`Monitor ${monitor.name} is disabled, skipping check`);
        return;
      }

      // Check if monitor is in maintenance window
      const now = new Date();
      const activeMaintenanceWindow = await prisma.maintenanceWindow.findFirst({
        where: {
          OR: [
            { monitorId: monitor.id },
            { monitorId: null, orgId: monitor.orgId },
          ],
          enabled: true,
          startTime: { lte: now },
          endTime: { gte: now },
        },
      });

      if (activeMaintenanceWindow) {
        logger.info(`Monitor ${monitor.name} is in maintenance window, skipping check`);
        return;
      }

      // Check if a successful run happened since expectedAt
      const recentRun = await prisma.run.findFirst({
        where: {
          monitorId: monitor.id,
          startedAt: {
            gte: new Date(expectedAt),
          },
          outcome: {
            in: ['SUCCESS', 'FAIL', 'LATE'],
          },
        },
        orderBy: {
          startedAt: 'desc',
        },
      });

      if (recentRun) {
        logger.info(`Monitor ${monitor.name} has a recent run (${recentRun.outcome}), no MISSED incident needed`);
        return;
      }

      // Check if MISSED incident already exists (deduplication)
      const dedupeHash = crypto
        .createHash('sha256')
        .update(`${monitor.id}-MISSED-${new Date(expectedAt).toISOString().slice(0, 13)}`) // hourly dedup
        .digest('hex');

      const existingIncident = await prisma.incident.findFirst({
        where: {
          monitorId: monitor.id,
          dedupeHash,
          status: {
            in: ['OPEN', 'ACKED'],
          },
        },
      });

      if (existingIncident) {
        logger.info(`MISSED incident already exists for monitor ${monitor.name}, skipping`);
        return;
      }

      // Check for upstream dependencies failure (cascade suppression)
      const dependencies = await prisma.monitorDependency.findMany({
        where: {
          monitorId: monitor.id,
          required: true,
        },
        include: {
          dependsOn: {
            include: {
              incidents: {
                where: {
                  status: {
                    in: ['OPEN', 'ACKED'],
                  },
                  openedAt: {
                    gte: new Date(expectedAt - 3600000), // Within last hour
                  },
                },
                orderBy: {
                  openedAt: 'desc',
                },
                take: 1,
              },
            },
          },
        },
      });

      const failedUpstream = dependencies.find(
        (dep) => dep.dependsOn.incidents.length > 0 && dep.dependsOn.incidents[0].kind !== 'ANOMALY'
      );

      let cascadeReason: string | undefined;
      let severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH';

      if (failedUpstream) {
        cascadeReason = `upstream-${failedUpstream.dependsOn.id}`;
        severity = 'MEDIUM'; // Lower severity for cascaded failures
        logger.info(
          `Monitor ${monitor.name} missed due to upstream failure (${failedUpstream.dependsOn.name}), creating incident with cascade reason`
        );
      } else {
        logger.warn(`Monitor ${monitor.name} MISSED expected run at ${new Date(expectedAt).toISOString()}`);
      }

      // Create MISSED run record
      await prisma.run.create({
        data: {
          monitorId: monitor.id,
          startedAt: new Date(expectedAt),
          finishedAt: now,
          outcome: 'MISSED',
        },
      });

      // Update monitor status
      await prisma.monitor.update({
        where: { id: monitor.id },
        data: {
          status: 'MISSED',
        },
      });

      // Create MISSED incident
      const incident = await prisma.incident.create({
        data: {
          monitorId: monitor.id,
          kind: 'MISSED',
          severity,
          status: 'OPEN',
          summary: cascadeReason
            ? `Monitor "${monitor.name}" missed run (upstream failure)`
            : `Monitor "${monitor.name}" missed expected run`,
          details: cascadeReason
            ? `This monitor depends on "${failedUpstream?.dependsOn.name}" which is currently failing. Expected run at ${new Date(expectedAt).toISOString()}.`
            : `Expected run at ${new Date(expectedAt).toISOString()}, but no ping received within grace period (${monitor.graceSec}s).`,
          dedupeHash,
        },
      });

      logger.info(`Created MISSED incident ${incident.id} for monitor ${monitor.name}`);

      // Trigger alerts (skip if cascaded to reduce noise)
      if (!cascadeReason) {
        await alertsQueue.add('dispatch-alert', { incidentId: incident.id });
        logger.info(`Queued alert dispatch for incident ${incident.id}`);
      } else {
        logger.info(`Skipping alert dispatch for cascaded incident ${incident.id}`);
      }
    },
    {
      connection,
      concurrency: 10,
      limiter: {
        max: 100,
        duration: 1000,
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Check-missed job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Check-missed job ${job?.id} failed:`, err);
  });

  logger.info('Check-missed worker started');

  return worker;
}

