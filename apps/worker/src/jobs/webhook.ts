import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import {
  sendIncidentOpenedWebhook,
  sendIncidentAcknowledgedWebhook,
  sendIncidentResolvedWebhook,
  WebhookConfig
} from '../lib/webhook';
import { createLogger } from '../logger';

const logger = createLogger('webhook');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export interface WebhookJobData {
  incidentId: string;
  channelId: string;
  event: 'incident.opened' | 'incident.acknowledged' | 'incident.resolved';
}

export function startWebhookWorker() {
  const worker = new Worker(
    'webhook',
    async (job: Job<WebhookJobData>) => {
      const { incidentId, channelId, event } = job.data;

      logger.info(`Processing webhook ${event} for incident ${incidentId}`);

      try {
        // Fetch incident with monitor
        const incident = await prisma.incident.findUnique({
          where: { id: incidentId },
          include: {
            monitor: true,
          },
        });

        if (!incident) {
          logger.error(`Incident ${incidentId} not found`);
          return { success: false, error: 'Incident not found' };
        }

        // Fetch webhook channel configuration
        const channel = await prisma.alertChannel.findUnique({
          where: { id: channelId },
        });

        if (!channel || channel.type !== 'WEBHOOK') {
          logger.error(`Webhook channel ${channelId} not found or invalid type`);
          return { success: false, error: 'Invalid channel' };
        }

        const config = channel.configJson as unknown as WebhookConfig;
        if (!config.url) {
          logger.error(`Webhook URL not configured for channel ${channelId}`);
          return { success: false, error: 'Webhook URL not configured' };
        }

        // Send webhook based on event type
        let success: boolean;
        switch (event) {
          case 'incident.opened':
            success = await sendIncidentOpenedWebhook(config, incident, incident.monitor);
            break;
          case 'incident.acknowledged':
            success = await sendIncidentAcknowledgedWebhook(config, incident, incident.monitor);
            break;
          case 'incident.resolved':
            success = await sendIncidentResolvedWebhook(config, incident, incident.monitor);
            break;
          default:
            throw new Error(`Unknown webhook event: ${event}`);
        }

        if (success) {
          logger.info(`Webhook ${event} sent successfully for incident ${incidentId}`);
          
          // Update incident lastAlertedAt for opened events
          if (event === 'incident.opened') {
            await prisma.incident.update({
              where: { id: incidentId },
              data: { lastAlertedAt: new Date() },
            });
          }

          return { success: true, event };
        } else {
          logger.error(`Failed to send webhook ${event} for incident ${incidentId}`);
          throw new Error(`Webhook failed`);
        }
      } catch (error) {
        logger.error({ err: error }, `Webhook worker error`);
        throw error;
      }
    },
    {
      connection,
      concurrency: 10, // Can handle more concurrent webhooks
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Webhook job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Webhook job ${job?.id} failed after retries`);
  });

  return worker;
}





