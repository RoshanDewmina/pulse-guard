import axios from 'axios';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../../logger';

const logger = createLogger('pagerduty');

const PAGERDUTY_EVENTS_URL = 'https://events.pagerduty.com/v2/enqueue';

interface PagerDutyConfig {
  routingKey: string;
}

interface Incident {
  id: string;
  status: string;
  kind: string;
  summary: string;
  details: string | null;
  dedupeHash: string | null;
  openedAt: Date;
  monitor: {
    id: string;
    name: string;
    org: {
      name: string;
    };
  };
}

/**
 * Map incident severity for PagerDuty
 */
function getSeverity(kind: string): string {
  switch (kind) {
    case 'MISSED':
      return 'critical';
    case 'LATE':
      return 'warning';
    case 'FAIL':
      return 'error';
    case 'ANOMALY':
      return 'warning';
    default:
      return 'error';
  }
}

/**
 * Send PagerDuty event
 */
async function sendPagerDutyEvent(
  config: PagerDutyConfig,
  incident: Incident,
  eventAction: 'trigger' | 'acknowledge' | 'resolve'
) {
  const payload: any = {
    routing_key: config.routingKey,
    event_action: eventAction,
    dedup_key: incident.dedupeHash || incident.id,
  };

  if (eventAction === 'trigger') {
    payload.payload = {
      summary: incident.summary,
      source: incident.monitor.org.name,
      severity: getSeverity(incident.kind),
      timestamp: incident.openedAt.toISOString(),
      component: incident.monitor.name,
      group: 'Saturn Monitoring',
      class: incident.kind,
      custom_details: {
        monitor_id: incident.monitor.id,
        monitor_name: incident.monitor.name,
        incident_id: incident.id,
        incident_type: incident.kind,
        details: incident.details,
        opened_at: incident.openedAt.toISOString(),
      },
    };

    // Add links
    payload.links = [
      {
        href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.saturn.sh'}/app/incidents/${incident.id}`,
        text: 'View Incident in Saturn',
      },
      {
        href: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.saturn.sh'}/app/monitors/${incident.monitor.id}`,
        text: 'View Monitor',
      },
    ];
  }

  try {
    const response = await axios.post(PAGERDUTY_EVENTS_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    logger.info({
      incidentId: incident.id,
      eventAction,
      status: response.status,
    }, 'PagerDuty event sent');

    return { success: true, data: response.data };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error({
        incidentId: incident.id,
        eventAction,
        status: error.response?.status,
        error: error.response?.data,
      }, 'PagerDuty event failed');
      
      throw new Error(`PagerDuty API error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
    }
    throw error;
  }
}

/**
 * Send PagerDuty alert for incident opened
 */
export async function sendPagerDutyTrigger(
  incidentId: string,
  channelId: string
): Promise<void> {
  if (!process.env.PAGERDUTY_ENABLED || process.env.PAGERDUTY_ENABLED === 'false') {
    logger.info('PagerDuty integration disabled');
    return;
  }

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      Monitor: {
        include: {
          Org: true,
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

  if (!channel || channel.type !== 'PAGERDUTY') {
    throw new Error(`Invalid PagerDuty channel ${channelId}`);
  }

  const config = channel.configJson as unknown as PagerDutyConfig;

  await sendPagerDutyEvent(config, incident as any, 'trigger');
}

/**
 * Send PagerDuty acknowledge event
 */
export async function sendPagerDutyAcknowledge(
  incidentId: string,
  channelId: string
): Promise<void> {
  if (!process.env.PAGERDUTY_ENABLED || process.env.PAGERDUTY_ENABLED === 'false') {
    return;
  }

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      Monitor: {
        include: {
          Org: true,
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

  if (!channel || channel.type !== 'PAGERDUTY') {
    throw new Error(`Invalid PagerDuty channel ${channelId}`);
  }

  const config = channel.configJson as unknown as PagerDutyConfig;

  await sendPagerDutyEvent(config, incident as any, 'acknowledge');
}

/**
 * Send PagerDuty resolve event
 */
export async function sendPagerDutyResolve(
  incidentId: string,
  channelId: string
): Promise<void> {
  if (!process.env.PAGERDUTY_ENABLED || process.env.PAGERDUTY_ENABLED === 'false') {
    return;
  }

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      Monitor: {
        include: {
          Org: true,
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

  if (!channel || channel.type !== 'PAGERDUTY') {
    throw new Error(`Invalid PagerDuty channel ${channelId}`);
  }

  const config = channel.configJson as unknown as PagerDutyConfig;

  await sendPagerDutyEvent(config, incident as any, 'resolve');
}

