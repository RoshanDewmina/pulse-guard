import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import { sendIncidentAlert, sendIncidentResolution, DiscordConfig } from '../lib/discord';
import { createLogger } from '../logger';

const logger = createLogger('discord');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export interface DiscordJobData {
  incidentId: string;
  channelId: string;
  type: 'alert' | 'resolution';
}

export function startDiscordWorker() {
  const worker = new Worker(
    'discord',
    async (job: Job<DiscordJobData>) => {
      const { incidentId, channelId, type } = job.data;

      logger.info(`Processing Discord ${type} for incident ${incidentId}`);

      try {
        // Fetch incident with monitor
        const incident = await prisma.incident.findUnique({
          where: { id: incidentId },
          include: {
            Monitor: true,
          },
        });

        if (!incident) {
          logger.error(`Incident ${incidentId} not found`);
          return { success: false, error: 'Incident not found' };
        }

        // Fetch Discord channel configuration
        const channel = await prisma.alertChannel.findUnique({
          where: { id: channelId },
        });

        if (!channel || channel.type !== 'DISCORD') {
          logger.error(`Discord channel ${channelId} not found or invalid type`);
          return { success: false, error: 'Invalid channel' };
        }

        const config = channel.configJson as unknown as DiscordConfig;
        if (!config.webhookUrl) {
          logger.error(`Discord webhook URL not configured for channel ${channelId}`);
          return { success: false, error: 'Webhook URL not configured' };
        }

        // Send Discord message
        let success: boolean;
        if (type === 'alert') {
          success = await sendIncidentAlert(config, incident);
        } else {
          success = await sendIncidentResolution(config, incident);
        }

        if (success) {
          logger.info(`Discord ${type} sent successfully for incident ${incidentId}`);
          
          // Update incident lastAlertedAt
          if (type === 'alert') {
            await prisma.incident.update({
              where: { id: incidentId },
              data: { lastAlertedAt: new Date() },
            });
          }

          return { success: true };
        } else {
          logger.error(`Failed to send Discord ${type} for incident ${incidentId}`);
          throw new Error(`Discord webhook failed`);
        }
      } catch (error) {
        logger.error({ err: error }, `Discord worker error`);
        throw error;
      }
    },
    {
      connection,
      concurrency: 5,
      limiter: {
        max: 10,
        duration: 1000, // 10 messages per second
      },
    }
  );

  worker.on('completed', (job) => {
    logger.info(`Discord job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Discord job ${job?.id} failed`);
  });

  return worker;
}





