import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import { alertsQueue, emailQueue, slackQueue, discordQueue, webhookQueue } from '../queues';
import { createLogger } from '../logger';

const logger = createLogger('alerts');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export function startAlertWorker() {
  const worker = new Worker(
    'alerts',
    async (job) => {
      const { incidentId } = job.data;

      logger.info(`Dispatching alert for incident ${incidentId}`);

      const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
          Monitor: {
            include: {
              Org: true,
              Run: {
                take: 5,
                orderBy: {
                  startedAt: 'desc',
                },
              },
            },
          },
        },
      });

      if (!incident) {
        logger.warn(`Incident ${incidentId} not found`);
        return;
      }

      // Check if incident is suppressed
      if (incident.suppressUntil && new Date() < incident.suppressUntil) {
        logger.info(`Incident ${incidentId} is suppressed until ${incident.suppressUntil}`);
        return;
      }

      // Check suppress window from last alert
      if (incident.lastAlertedAt) {
        const timeSinceLastAlert = Date.now() - incident.lastAlertedAt.getTime();
        const suppressMs = 5 * 60 * 1000; // 5 minutes default

        if (timeSinceLastAlert < suppressMs) {
          logger.info(`Incident ${incidentId} was alerted ${timeSinceLastAlert}ms ago, skipping`);
          return;
        }
      }

      // Find applicable rules
      const rules = await prisma.rule.findMany({
        where: {
          orgId: incident.Monitor.orgId,
          OR: [
            {
              monitorIds: {
                isEmpty: true, // Empty means all monitors
              },
            },
            {
              monitorIds: {
                has: incident.monitorId,
              },
            },
          ],
        },
        include: {
          Org: true,
        },
      });

      if (rules.length === 0) {
        logger.warn(`No rules found for incident ${incidentId}`);
        return;
      }

      // Get all channels from rules
      const channelIds = [...new Set(rules.flatMap(rule => rule.channelIds))];
      
      const channels = await prisma.alertChannel.findMany({
        where: {
          id: {
            in: channelIds,
          },
        },
      });

      logger.info(`Routing alert to ${channels.length} channels`);

      // Dispatch to each channel
      for (const channel of channels) {
        if (channel.type === 'EMAIL') {
          await emailQueue.add('send-email-alert', {
            incidentId,
            channelId: channel.id,
          });
        } else if (channel.type === 'SLACK') {
          await slackQueue.add('send-slack-alert', {
            incidentId,
            channelId: channel.id,
          });
        } else if (channel.type === 'DISCORD') {
          await discordQueue.add('send-discord-alert', {
            incidentId,
            channelId: channel.id,
            type: 'alert',
          });
        } else if (channel.type === 'WEBHOOK') {
          await webhookQueue.add('send-webhook', {
            incidentId,
            channelId: channel.id,
            event: 'incident.opened',
          });
        } else if (channel.type === 'PAGERDUTY') {
          await alertsQueue.add('send-pagerduty-alert', {
            incidentId,
            channelId: channel.id,
            action: 'trigger',
          });
        } else if (channel.type === 'TEAMS') {
          await alertsQueue.add('send-teams-alert', {
            incidentId,
            channelId: channel.id,
            action: 'opened',
          });
        } else if (channel.type === 'SMS') {
          await alertsQueue.add('send-sms-alert', {
            incidentId,
            channelId: channel.id,
            action: 'opened',
          });
        }
      }

      // Update lastAlertedAt
      await prisma.incident.update({
        where: { id: incidentId },
        data: {
          lastAlertedAt: new Date(),
        },
      });

      logger.info(`Alert dispatched for incident ${incidentId}`);
    },
    { connection }
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Job ${job?.id} failed`);
  });

  return worker;
}

