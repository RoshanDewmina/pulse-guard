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

async function postSlackThreadReply(
  accessToken: string,
  channel: string,
  threadTs: string,
  text: string,
  blocks?: any[]
) {
  try {
    const { WebClient } = await import('@slack/web-api');
    const client = new WebClient(accessToken);
    return await client.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text,
      blocks,
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
          monitor: {
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
      }[incident.kind] || '⚠️';

      const recentRuns = incident.monitor.runs
        .map(run => (run.outcome === 'SUCCESS' ? '✅' : '❌'))
        .join(' ');

      const blocks = [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${incident.kind} — ${incident.monitor.name}`,
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
            ...(incident.monitor.nextDueAt ? [{
              type: 'mrkdwn' as const,
              text: `*Next Due:*\n${format(incident.monitor.nextDueAt, 'PPpp')}`,
            }] : []),
            ...(incident.monitor.lastRunAt ? [{
              type: 'mrkdwn' as const,
              text: `*Last Run:*\n${format(incident.monitor.lastRunAt, 'PPpp')}`,
            }] : []),
            ...(incident.monitor.lastDurationMs ? [{
              type: 'mrkdwn' as const,
              text: `*Duration:*\n${incident.monitor.lastDurationMs}ms`,
            }] : []),
            ...(incident.monitor.lastExitCode !== null && incident.monitor.lastExitCode !== undefined ? [{
              type: 'mrkdwn' as const,
              text: `*Exit Code:*\n${incident.monitor.lastExitCode}`,
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
                text: 'Resolve',
                emoji: true,
              },
              style: 'primary',
              value: incidentId,
              action_id: 'resolve_incident',
            },
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: 'Mute',
                emoji: true,
              },
              value: incidentId,
              action_id: 'mute_incident',
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
          ],
        },
      ];

      try {
        // Check if this incident already has a Slack message (for threaded updates)
        if (incident.slackMessageTs && incident.slackChannelId) {
          logger.info(`Incident ${incidentId} has existing thread, posting update`);
          
          // Build thread reply based on incident status
          let replyText = '';
          let replyBlocks: any[] = [];
          
          if (incident.status === 'ACKED') {
            replyText = `✅ *Incident Acknowledged*\nThe incident has been acknowledged and is being investigated.`;
            replyBlocks = [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: replyText,
                },
              },
            ];
          } else if (incident.status === 'RESOLVED') {
            replyText = `🎉 *Incident Resolved*\nThe monitor is now healthy and the incident has been resolved.`;
            replyBlocks = [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: replyText,
                },
              },
            ];
          } else {
            // Status update (e.g., incident escalated, repeated failure)
            replyText = `📢 *Incident Update*\n${incident.summary}`;
            replyBlocks = [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: replyText,
                },
                fields: [
                  {
                    type: 'mrkdwn',
                    text: `*Status:*\n${incident.status}`,
                  },
                  {
                    type: 'mrkdwn',
                    text: `*Time:*\n${format(new Date(), 'PPpp')}`,
                  },
                ],
              },
            ];
          }
          
          // Post as thread reply
          await postSlackThreadReply(
            accessToken,
            incident.slackChannelId,
            incident.slackMessageTs,
            replyText,
            replyBlocks
          );
          
          logger.info(`Posted thread update for incident ${incidentId}`);
        } else {
          // First-time alert, post new message
          const result = await postSlackMessage(
            accessToken,
            slackChannel,
            blocks,
            `${incident.kind}: ${incident.monitor.name} - ${incident.summary}`
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
        }
      } catch (error: any) {
        if (error.message === 'Slack SDK not installed') {
          logger.warn('Slack SDK not available, skipping Slack alert');
          return;
        }
        logger.error(`Failed to send Slack message:`, error);
        throw error;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}

