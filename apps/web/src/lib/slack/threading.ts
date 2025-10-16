/**
 * Slack Message Threading
 * 
 * Update existing Slack messages when incident status changes
 */

// Local minimal types to avoid depending on Prisma types in web layer
type Monitor = {
  id: string;
  name: string;
  lastRunAt?: Date | null;
  lastDurationMs?: number | null;
  lastExitCode?: number | null;
  nextDueAt?: Date | null;
};

type Incident = {
  id: string;
  kind: string;
  status: string;
  summary: string;
  details?: string | null;
  openedAt: Date;
  acknowledgedAt?: Date | null;
  resolvedAt?: Date | null;
  slackMessageTs?: string | null;
  slackChannelId?: string | null;
  Monitor: Monitor;  // Capitalized to match Prisma relation name
};
import { WebClient } from '@slack/web-api';
import { prisma } from '@tokiflow/db';

export interface SlackMessageUpdate {
  channel: string;
  ts: string;
  text?: string;
  blocks?: any[];
}

/**
 * Update Slack message with new incident status
 * 
 * @param accessToken - Slack OAuth access token
 * @param incident - Incident data
 * @param monitor - Monitor data
 * @returns Success status
 */
export async function updateIncidentMessage(
  accessToken: string,
  incident: Incident
): Promise<boolean> {
  if (!incident.slackMessageTs || !incident.slackChannelId) {
    console.log('No Slack message to update');
    return false;
  }

  const client = new WebClient(accessToken);

  try {
    const blocks = buildUpdatedMessageBlocks(incident);

    await client.chat.update({
      channel: incident.slackChannelId,
      ts: incident.slackMessageTs,
      text: `[${incident.status}] ${incident.summary}`,
      blocks,
    });

    console.log(`Updated Slack message ${incident.slackMessageTs}`);
    return true;
  } catch (error) {
    console.error('Failed to update Slack message:', error);
    return false;
  }
}

/**
 * Post thread reply when incident is resolved
 * 
 * @param accessToken - Slack OAuth access token
 * @param incident - Incident data
 * @param monitor - Monitor data
 * @param userId - User who resolved (optional)
 * @returns Success status
 */
export async function postResolutionReply(
  accessToken: string,
  incident: Incident,
  userId?: string
): Promise<boolean> {
  if (!incident.slackMessageTs || !incident.slackChannelId) {
    return false;
  }

  const client = new WebClient(accessToken);

  try {
    const duration = incident.resolvedAt && incident.openedAt
      ? Math.round((new Date(incident.resolvedAt).getTime() - new Date(incident.openedAt).getTime()) / 60000)
      : null;

    const text = userId
      ? `✅ Incident resolved by <@${userId}>${duration ? ` after ${duration}m` : ''}`
      : `✅ Incident resolved${duration ? ` after ${duration}m` : ''}`;

    await client.chat.postMessage({
      channel: incident.slackChannelId,
      thread_ts: incident.slackMessageTs,
      text,
    });

    console.log(`Posted resolution reply to thread ${incident.slackMessageTs}`);
    return true;
  } catch (error) {
    console.error('Failed to post thread reply:', error);
    return false;
  }
}

/**
 * Build updated message blocks based on incident status
 */
function buildUpdatedMessageBlocks(incident: Incident): any[] {
  const statusEmoji: Record<string, string> = {
    OPEN: '🔴',
    ACKED: '🟡',
    RESOLVED: '✅',
  };

  const statusColor: Record<string, string> = {
    OPEN: 'danger',
    ACKED: 'warning',
    RESOLVED: 'good',
  };

  const kindEmoji: Record<string, string> = {
    FAIL: '❌',
    MISSED: '🟠',
    LATE: '🟡',
    ANOMALY: '⚠️',
  };

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${statusEmoji[incident.status]} ${kindEmoji[incident.kind]} ${incident.Monitor.name}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${incident.summary}*`,
      },
    },
  ];

  // Status information
  const statusFields: any[] = [
    {
      type: 'mrkdwn',
      text: `*Status:* ${incident.status}`,
    },
    {
      type: 'mrkdwn',
      text: `*Kind:* ${incident.kind}`,
    },
  ];

  if (incident.acknowledgedAt) {
    statusFields.push({
      type: 'mrkdwn',
      text: `*Acknowledged:* ${new Date(incident.acknowledgedAt).toLocaleTimeString()}`,
    });
  }

  if (incident.resolvedAt) {
    statusFields.push({
      type: 'mrkdwn',
      text: `*Resolved:* ${new Date(incident.resolvedAt).toLocaleTimeString()}`,
    });
  }

  blocks.push({
    type: 'section',
    fields: statusFields,
  });

  // Monitor details
  blocks.push({
    type: 'section',
    fields: [
      {
        type: 'mrkdwn',
        text: `*Last Run:* ${incident.Monitor.lastRunAt ? new Date(incident.Monitor.lastRunAt).toLocaleString() : 'Never'}`,
      },
      {
        type: 'mrkdwn',
        text: `*Duration:* ${incident.Monitor.lastDurationMs ? `${incident.Monitor.lastDurationMs}ms` : 'N/A'}`,
      },
      {
        type: 'mrkdwn',
        text: `*Exit Code:* ${incident.Monitor.lastExitCode ?? 'N/A'}`,
      },
      {
        type: 'mrkdwn',
        text: `*Next Due:* ${incident.Monitor.nextDueAt ? new Date(incident.Monitor.nextDueAt).toLocaleString() : 'N/A'}`,
      },
    ],
  });

  // Action buttons (only show if not resolved)
  if (incident.status !== 'RESOLVED') {
    const buttons: any[] = [];

    if (incident.status === 'OPEN') {
      buttons.push({
        type: 'button',
        text: {
          type: 'plain_text',
          text: 'Acknowledge',
        },
        style: 'primary',
        action_id: 'acknowledge_incident',
        value: incident.id,
      });
    }

    buttons.push({
      type: 'button',
      text: {
        type: 'plain_text',
        text: 'View Dashboard',
      },
      url: `${process.env.NEXTAUTH_URL}/app/incidents`,
      action_id: 'view_dashboard',
    });

    if (buttons.length > 0) {
      blocks.push({
        type: 'actions',
        elements: buttons,
      });
    }
  }

  // Context footer
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Opened ${new Date(incident.openedAt).toLocaleString()} | Incident ID: \`${incident.id}\``,
      },
    ],
  });

  return blocks;
}

/**
 * Post acknowledgment to thread
 */
export async function postAcknowledgmentReply(
  accessToken: string,
  incident: Incident,
  userId?: string
): Promise<boolean> {
  if (!incident.slackMessageTs || !incident.slackChannelId) {
    return false;
  }

  const client = new WebClient(accessToken);

  try {
    const text = userId
      ? `🟡 Incident acknowledged by <@${userId}>`
      : `🟡 Incident acknowledged`;

    await client.chat.postMessage({
      channel: incident.slackChannelId,
      thread_ts: incident.slackMessageTs,
      text,
    });

    return true;
  } catch (error) {
    console.error('Failed to post acknowledgment reply:', error);
    return false;
  }
}



