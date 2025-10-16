/**
 * BullMQ Queue Instances for Web App
 * 
 * Used by API routes to enqueue jobs that are processed by the worker.
 */

import { Queue } from 'bullmq';
import { redisConnection } from './redis';

/**
 * Queue for checking missed/late monitor runs
 */
export const checkMissedQueue = new Queue('check-missed', {
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
export const notificationQueue = new Queue('notifications', {
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
 * Clean up queues on shutdown
 */
if (typeof window === 'undefined') {
  process.on('SIGTERM', async () => {
    console.log('🛑 Closing BullMQ queues...');
    await checkMissedQueue.close();
    await notificationQueue.close();
  });
}

