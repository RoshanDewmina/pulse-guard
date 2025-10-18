/**
 * Centralized BullMQ Queue Exports
 * 
 * All queues are defined here to avoid circular dependencies
 * and cross-app imports.
 */

import { Queue } from 'bullmq';
import { redisConnection } from './redis';

// Skip queue creation during build time
const IS_BUILD_TIME = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.env.npm_lifecycle_event === 'build';

/**
 * Queue for SSL certificate checks
 */
export const sslCheckQueue = IS_BUILD_TIME
  ? ({} as any)
  : new Queue('ssl-check', {
      connection: redisConnection,
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
 * Queue for domain expiration checks
 */
export const domainCheckQueue = IS_BUILD_TIME
  ? ({} as any)
  : new Queue('domain-check', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    });

/**
 * Queue for synthetic monitor jobs
 */
export const syntheticMonitorQueue = IS_BUILD_TIME
  ? ({} as any)
  : new Queue('synthetic-monitor', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 1, // No retries for synthetic tests (they're time-sensitive)
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    });

/**
 * Queue for SLA report generation
 */
export const slaReportQueue = IS_BUILD_TIME
  ? ({} as any)
  : new Queue('sla-reports', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 10000,
        },
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    });

/**
 * Queue for data export jobs
 */
export const dataExportQueue = IS_BUILD_TIME
  ? ({} as any)
  : new Queue('data-export', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    });

/**
 * Clean up queues on shutdown
 */
if (typeof window === 'undefined' && !IS_BUILD_TIME) {
  process.on('SIGTERM', async () => {
    console.log('🛑 Closing queues...');
    await Promise.all([
      sslCheckQueue.close(),
      domainCheckQueue.close(),
      syntheticMonitorQueue.close(),
      slaReportQueue.close(),
      dataExportQueue.close(),
    ]);
  });
}

