/**
 * BullMQ Queue Instances for Web App
 * 
 * Used by API routes to enqueue jobs that are processed by the worker.
 */

import { Queue } from 'bullmq';
import { redisConnection } from './redis';

// Skip queue creation during build time
const IS_BUILD_TIME = process.env.NEXT_PHASE === 'phase-production-build' || 
                      process.env.npm_lifecycle_event === 'build';

/**
 * Queue for checking missed/late monitor runs
 */
export const checkMissedQueue = IS_BUILD_TIME
  ? ({} as any)
  : new Queue('check-missed', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });

/**
 * Queue for sending notifications (email, Slack, etc.)
 */
export const notificationQueue = IS_BUILD_TIME
  ? ({} as any)
  : new Queue('notifications', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    });

/**
 * Queue for user data exports (GDPR compliance)
 * @deprecated Use dataExportQueue from @tokiflow/shared instead
 */
export { dataExportQueue } from '@tokiflow/shared';

/**
 * Clean up queues on shutdown
 */
if (typeof window === 'undefined' && !IS_BUILD_TIME) {
  process.on('SIGTERM', async () => {
    console.log('🛑 Closing BullMQ queues...');
    await checkMissedQueue.close();
    await notificationQueue.close();
  });
}

