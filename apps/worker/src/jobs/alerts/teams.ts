import axios from 'axios';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../../logger';

const logger = createLogger('teams');

interface TeamsConfig {
  webhookUrl: string;
}

interface Incident {
  id: string;
  status: string;
  kind: string;
  summary: string;
  details: string | null;
  openedAt: Date;
  acknowledgedAt: Date | null;
  resolvedAt: Date | null;
  monitor: {
    id: string;
    name: string;
    org: {
      name: string;
    };
  };
}

/**
 * Get color based on incident status and kind
 */
function getColor(status: string, kind: string): string {
  if (status === 'RESOLVED') return '00FF00'; // Green
  if (status === 'ACKED') return 'FFA500'; // Orange
  
  // For open incidents, color by severity
  switch (kind) {
    case 'MISSED':
      return 'FF0000'; // Red
    case 'FAIL':
      return 'DC143C'; // Crimson
    case 'LATE':
      return 'FFA500'; // Orange
    case 'ANOMALY':
      return 'FFD700'; // Gold
    default:
      return 'FF0000'; // Red
  }
}

/**
 * Get emoji for incident kind
 */
function getEmoji(kind: string): string {
  switch (kind) {
    case 'MISSED':
      return '🚫';
    case 'FAIL':
      return '❌';
    case 'LATE':
      return '⏰';
    case 'ANOMALY':
      return '⚠️';
    default:
      return '🔔';
  }
}

/**
 * Get status emoji
 */
function getStatusEmoji(status: string): string {
  switch (status) {
    case 'RESOLVED':
      return '✅';
    case 'ACKED':
      return '👀';
    case 'OPEN':
      return '🔴';
    default:
      return '🔔';
  }
}

/**
 * Create Adaptive Card for Teams
 */
function createAdaptiveCard(incident: Incident, action: 'opened' | 'acked' | 'resolved'): any {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.saturn.sh';
  const incidentUrl = `${appUrl}/app/incidents/${incident.id}`;
  const monitorUrl = `${appUrl}/app/monitors/${incident.monitor.id}`;

  let title = '';
  let subtitle = '';

  switch (action) {
    case 'opened':
      title = `${getEmoji(incident.kind)} Incident Opened: ${incident.monitor.name}`;
      subtitle = incident.summary;
      break;
    case 'acked':
      title = `${getStatusEmoji('ACKED')} Incident Acknowledged: ${incident.monitor.name}`;
      subtitle = 'The incident has been acknowledged';
      break;
    case 'resolved':
      title = `${getStatusEmoji('RESOLVED')} Incident Resolved: ${incident.monitor.name}`;
      subtitle = 'The incident has been resolved';
      break;
  }

  const facts = [];
  
  facts.push({
    title: 'Monitor',
    value: incident.monitor.name,
  });
  
  facts.push({
    title: 'Organization',
    value: incident.monitor.org.name,
  });
  
  facts.push({
    title: 'Type',
    value: incident.kind,
  });
  
  facts.push({
    title: 'Status',
    value: incident.status,
  });
  
  facts.push({
    title: 'Opened',
    value: incident.openedAt.toLocaleString(),
  });

  if (incident.acknowledgedAt) {
    facts.push({
      title: 'Acknowledged',
      value: incident.acknowledgedAt.toLocaleString(),
    });
  }

  if (incident.resolvedAt) {
    facts.push({
      title: 'Resolved',
      value: incident.resolvedAt.toLocaleString(),
    });
  }

  return {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'Container',
              style: 'emphasis',
              items: [
                {
                  type: 'TextBlock',
                  text: title,
                  wrap: true,
                  size: 'large',
                  weight: 'bolder',
                  color: action === 'resolved' ? 'good' : action === 'acked' ? 'warning' : 'attention',
                },
                {
                  type: 'TextBlock',
                  text: subtitle,
                  wrap: true,
                  size: 'medium',
                  spacing: 'small',
                },
              ],
            },
            {
              type: 'FactSet',
              facts: facts,
              spacing: 'medium',
            },
            ...(incident.details ? [
              {
                type: 'TextBlock',
                text: 'Details',
                weight: 'bolder',
                spacing: 'medium',
              },
              {
                type: 'TextBlock',
                text: incident.details.length > 500 
                  ? incident.details.substring(0, 500) + '...' 
                  : incident.details,
                wrap: true,
                spacing: 'small',
              },
            ] : []),
          ],
          actions: [
            {
              type: 'Action.OpenUrl',
              title: 'View Incident',
              url: incidentUrl,
            },
            {
              type: 'Action.OpenUrl',
              title: 'View Monitor',
              url: monitorUrl,
            },
          ],
        },
      },
    ],
  };
}

/**
 * Send Teams webhook
 */
async function sendTeamsWebhook(
  config: TeamsConfig,
  incident: Incident,
  action: 'opened' | 'acked' | 'resolved'
): Promise<void> {
  const card = createAdaptiveCard(incident, action);

  try {
    const response = await axios.post(config.webhookUrl, card, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    logger.info({
      incidentId: incident.id,
      action,
      status: response.status,
    }, 'Teams webhook sent');
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error({
        incidentId: incident.id,
        action,
        status: error.response?.status,
        error: error.response?.data,
      }, 'Teams webhook failed');
      
      throw new Error(`Teams webhook error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
}

/**
 * Send Teams alert for incident opened
 */
export async function sendTeamsOpened(
  incidentId: string,
  channelId: string
): Promise<void> {
  if (!process.env.TEAMS_ENABLED || process.env.TEAMS_ENABLED === 'false') {
    logger.info('Teams integration disabled');
    return;
  }

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      monitor: {
        include: {
          org: true,
        },
      },
    },
  });

  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const channel = await prisma.alertChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel || channel.type !== 'TEAMS') {
    throw new Error(`Invalid Teams channel ${channelId}`);
  }

  const config = channel.configJson as unknown as TeamsConfig;

  await sendTeamsWebhook(config, incident as any, 'opened');
}

/**
 * Send Teams alert for incident acknowledged
 */
export async function sendTeamsAcknowledged(
  incidentId: string,
  channelId: string
): Promise<void> {
  if (!process.env.TEAMS_ENABLED || process.env.TEAMS_ENABLED === 'false') {
    return;
  }

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      monitor: {
        include: {
          org: true,
        },
      },
    },
  });

  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const channel = await prisma.alertChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel || channel.type !== 'TEAMS') {
    throw new Error(`Invalid Teams channel ${channelId}`);
  }

  const config = channel.configJson as unknown as TeamsConfig;

  await sendTeamsWebhook(config, incident as any, 'acked');
}

/**
 * Send Teams alert for incident resolved
 */
export async function sendTeamsResolved(
  incidentId: string,
  channelId: string
): Promise<void> {
  if (!process.env.TEAMS_ENABLED || process.env.TEAMS_ENABLED === 'false') {
    return;
  }

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      monitor: {
        include: {
          org: true,
        },
      },
    },
  });

  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const channel = await prisma.alertChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel || channel.type !== 'TEAMS') {
    throw new Error(`Invalid Teams channel ${channelId}`);
  }

  const config = channel.configJson as unknown as TeamsConfig;

  await sendTeamsWebhook(config, incident as any, 'resolved');
}

