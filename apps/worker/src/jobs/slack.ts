import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../logger';
import { format } from 'date-fns';

// Dynamically import Slack SDK to avoid dependency issues
async function postSlackMessage(accessToken: string, channel: string, blocks: any[], text: string) {
  try {
    const { WebClient } = await import('@slack/web-api');
    const client = new WebClient(accessToken);
    return await client.chat.postMessage({
      channel,
      blocks,
      text,
    });
  } catch (error: any) {
    if (error.code === 'MODULE_NOT_FOUND') {
      throw new Error('Slack SDK not installed');
    }
    throw error;
  }
}

const logger = createLogger('slack');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export function startSlackWorker() {
  const worker = new Worker(
    'slack',
    async (job) => {
      const { incidentId, channelId } = job.data;

      logger.info(`Sending Slack alert for incident ${incidentId}`);

      const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
          Monitor: {
            include: {
              runs: {
                take: 5,
                orderBy: {
                  startedAt: 'desc',
                },
              },
            },
          },
        },
      });

      const channel = await prisma.alertChannel.findUnique({
        where: { id: channelId },
      });

      if (!incident || !channel) {
        logger.warn(`Incident or channel not found`);
        return;
      }

      const config = channel.configJson as any;
      const slackChannel = config.channel || config.channelId;
      const accessToken = config.accessToken;

      if (!slackChannel || !accessToken) {
        logger.warn(`No Slack channel or token configured for channel ${channelId}`);
        return;
      }

      const emoji = {
        MISSED: '⏰',
        LATE: '🕐',
        FAIL: '❌',
        ANOMALY: '📊',
        DEGRADED: '⚠️',
      }[incident.kind] || '⚠️';

      const recentRuns = incident.Monitor.runs
        .map(run => (run.outcome === 'SUCCESS' ? '✅' : '❌'))
        .join(' ');

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${incident.kind} — ${incident.Monitor.name}`,
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${incident.summary}*`,
          },
        },
        {
          type: 'section',
          fields: [
            ...(incident.Monitor.nextDueAt ? [{
              type: 'mrkdwn' as const,
              text: `*Next Due:*\n${format(incident.Monitor.nextDueAt, 'PPpp')}`,
            }] : []),
            ...(incident.Monitor.lastRunAt ? [{
              type: 'mrkdwn' as const,
              text: `*Last Run:*\n${format(incident.Monitor.lastRunAt, 'PPpp')}`,
            }] : []),
            ...(incident.Monitor.lastDurationMs ? [{
              type: 'mrkdwn' as const,
              text: `*Duration:*\n${incident.Monitor.lastDurationMs}ms`,
            }] : []),
            ...(incident.Monitor.lastExitCode !== null && incident.Monitor.lastExitCode !== undefined ? [{
              type: 'mrkdwn' as const,
              text: `*Exit Code:*\n${incident.Monitor.lastExitCode}`,
            }] : []),
          ],
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Recent runs: ${recentRuns || 'No runs yet'}`,
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Acknowledge',
                emoji: true,
              },
              style: 'primary',
              value: incidentId,
              action_id: 'acknowledge_incident',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'View Dashboard',
                emoji: true,
              },
              url: `${process.env.NEXTAUTH_URL}/app/monitors/${incident.monitorId}`,
              action_id: 'view_dashboard',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Mute 2h',
                emoji: true,
              },
              value: incidentId,
              action_id: 'mute_incident',
            },
          ],
        },
      ];

      try {
        const result = await postSlackMessage(
          accessToken,
          slackChannel,
          blocks,
          `${incident.kind}: ${incident.Monitor.name} - ${incident.summary}`
        );

        // Store message timestamp and channel for future updates
        if (result && result.ts) {
          await prisma.incident.update({
            where: { id: incidentId },
            data: {
              slackMessageTs: result.ts,
              slackChannelId: result.channel || slackChannel,
            },
          });
          logger.info(`Stored Slack message TS ${result.ts} for incident ${incidentId}`);
        }

        logger.info(`Slack message sent to ${slackChannel} for incident ${incidentId}`);
      } catch (error: any) {
        if (error.message === 'Slack SDK not installed') {
          logger.warn('Slack SDK not available, skipping Slack alert');
          return;
        }
        logger.error({ err: error }, `Failed to send Slack message`);
        throw error;
      }
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

