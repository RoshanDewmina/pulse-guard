import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../logger';

const logger = createLogger('cleanup');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export function startCleanupWorker() {
  const worker = new Worker(
    'cleanup',
    async (job) => {
      const { name, data } = job;

      try {
        switch (name) {
          case 'cleanup-old-runs':
            await cleanupOldRuns();
            break;
          case 'reset-synthetic-quota':
            await resetSyntheticQuota();
            break;
          default:
            logger.warn({ jobName: name }, 'Unknown cleanup job type');
        }
      } catch (error) {
        logger.error({ err: error, jobName: name, data }, 'Cleanup job failed');
        throw error;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Cleanup job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, jobName: job?.name }, 'Cleanup job failed');
  });

  return worker;
}

/**
 * Clean up old monitor runs based on plan retention settings
 */
async function cleanupOldRuns() {
  logger.info('Starting cleanup of old monitor runs');

  // Get all organizations with their subscription plans
  const orgs = await prisma.org.findMany({
    include: {
      SubscriptionPlan: true,
    },
  });

  let totalDeleted = 0;

  for (const org of orgs) {
    if (!org.SubscriptionPlan) {
      logger.warn({ orgId: org.id }, 'No subscription plan found, skipping');
      continue;
    }

    const retentionDays = org.SubscriptionPlan.retentionDays;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      // Delete old monitor runs
      const deletedRuns = await prisma.run.deleteMany({
        where: {
          Monitor: {
            orgId: org.id,
          },
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      // Delete old synthetic runs
      const deletedSyntheticRuns = await prisma.syntheticRun.deleteMany({
        where: {
          SyntheticMonitor: {
            orgId: org.id,
          },
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      totalDeleted += deletedRuns.count + deletedSyntheticRuns.count;

      logger.info(
        { 
          orgId: org.id, 
          plan: org.SubscriptionPlan.plan,
          retentionDays,
          deletedRuns: deletedRuns.count,
          deletedSyntheticRuns: deletedSyntheticRuns.count
        }, 
        'Cleaned up old runs for org'
      );
    } catch (error) {
      logger.error({ err: error, orgId: org.id }, 'Failed to cleanup runs for org');
    }
  }

  logger.info({ totalDeleted }, 'Completed cleanup of old monitor runs');
}

/**
 * Reset synthetic run quota counters monthly
 */
async function resetSyntheticQuota() {
  logger.info('Resetting synthetic run quota counters');

  try {
    const result = await prisma.subscriptionPlan.updateMany({
      data: {
        syntheticRunsUsed: 0,
      },
    });

    logger.info({ updatedCount: result.count }, 'Reset synthetic run quota counters');
  } catch (error) {
    logger.error({ err: error }, 'Failed to reset synthetic run quota counters');
    throw error;
  }
}

// Schedule cleanup jobs
export function scheduleCleanupJobs() {
  const cleanupQueue = new (require('bullmq').Queue)('cleanup', { connection });

  // Run cleanup daily at 2 AM
  cleanupQueue.add(
    'cleanup-old-runs',
    {},
    {
      repeat: { cron: '0 2 * * *' },
      removeOnComplete: 5,
      removeOnFail: 5,
    }
  );

  // Reset synthetic quota monthly on the 1st at 3 AM
  cleanupQueue.add(
    'reset-synthetic-quota',
    {},
    {
      repeat: { cron: '0 3 1 * *' },
      removeOnComplete: 5,
      removeOnFail: 5,
    }
  );

  logger.info('Scheduled cleanup jobs');
}
