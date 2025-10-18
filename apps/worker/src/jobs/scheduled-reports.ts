import { Worker, Job } from 'bullmq';
import { prisma } from '@tokiflow/db';
import { slaReportQueue, redisConnection } from '@tokiflow/shared';
import { createLogger } from '../logger';

const logger = createLogger('scheduled-reports');

/**
 * Check for scheduled reports that need to be generated
 */
export async function checkScheduledReports(): Promise<void> {
  logger.info('Checking for scheduled reports...');

  try {
    // Find all organizations
    const orgs = await prisma.org.findMany({
      select: {
        id: true,
        name: true,
      },
    });

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday
    const currentDate = now.getDate();

    for (const org of orgs) {
      // Daily reports - generate at midnight
      if (currentHour === 0) {
        await slaReportQueue.add(
          'generate-daily-report',
          {
            orgId: org.id,
            period: 'DAILY',
            name: `Daily Report - ${now.toLocaleDateString()}`,
          },
          {
            jobId: `daily-${org.id}-${now.toISOString().split('T')[0]}`,
          }
        );
        logger.info({ orgId: org.id }, 'Queued daily report');
      }

      // Weekly reports - generate on Mondays at 1am
      if (currentDay === 1 && currentHour === 1) {
        await slaReportQueue.add(
          'generate-weekly-report',
          {
            orgId: org.id,
            period: 'WEEKLY',
            name: `Weekly Report - Week of ${now.toLocaleDateString()}`,
          },
          {
            jobId: `weekly-${org.id}-${now.toISOString().split('T')[0]}`,
          }
        );
        logger.info({ orgId: org.id }, 'Queued weekly report');
      }

      // Monthly reports - generate on the 1st at 2am
      if (currentDate === 1 && currentHour === 2) {
        await slaReportQueue.add(
          'generate-monthly-report',
          {
            orgId: org.id,
            period: 'MONTHLY',
            name: `Monthly Report - ${now.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          },
          {
            jobId: `monthly-${org.id}-${now.toISOString().split('T')[0]}`,
          }
        );
        logger.info({ orgId: org.id }, 'Queued monthly report');
      }
    }

    logger.info('Scheduled reports check completed');
  } catch (error) {
    logger.error({ err: error }, 'Failed to check scheduled reports');
    throw error;
  }
}

/**
 * Start checking for scheduled reports every hour
 */
export function startScheduledReportsChecker(): NodeJS.Timeout {
  logger.info('Starting scheduled reports checker...');

  // Check immediately
  checkScheduledReports().catch((error) => {
    logger.error({ err: error }, 'Initial scheduled reports check failed');
  });

  // Then check every hour
  const interval = setInterval(() => {
    checkScheduledReports().catch((error) => {
      logger.error({ err: error }, 'Scheduled reports check failed');
    });
  }, 60 * 60 * 1000); // Every hour

  return interval;
}

