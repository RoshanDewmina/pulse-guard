import { Queue, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const evaluateQueue = new Queue('evaluate', { connection });
export const alertsQueue = new Queue('alerts', { connection });
export const emailQueue = new Queue('email', { connection });
export const slackQueue = new Queue('slack', { connection });
export const discordQueue = new Queue('discord', { connection });
export const webhookQueue = new Queue('webhook', { connection });

// Queue events for monitoring
export const evaluateQueueEvents = new QueueEvents('evaluate', { connection });
export const alertsQueueEvents = new QueueEvents('alerts', { connection });
export const emailQueueEvents = new QueueEvents('email', { connection });
export const slackQueueEvents = new QueueEvents('slack', { connection });
export const discordQueueEvents = new QueueEvents('discord', { connection });
export const webhookQueueEvents = new QueueEvents('webhook', { connection });

