import twilio from 'twilio';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../../logger';

const logger = createLogger('sms');

interface SMSConfig {
  recipients: string[]; // E.164 format phone numbers
}

interface Incident {
  id: string;
  status: string;
  kind: string;
  summary: string;
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
 * Get Twilio client
 */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }

  return twilio(accountSid, authToken);
}

/**
 * Truncate text to fit SMS length (900 chars to be safe)
 */
function truncateText(text: string, maxLength: number = 900): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format SMS message for incident
 */
function formatSMS(incident: Incident, action: 'opened' | 'acked' | 'resolved'): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.saturn.sh';
  const incidentUrl = `${appUrl}/app/incidents/${incident.id}`;

  let message = '';

  switch (action) {
    case 'opened':
      message = `🚨 INCIDENT OPENED
Monitor: ${incident.monitor.name}
Type: ${incident.kind}
${incident.summary}

View: ${incidentUrl}`;
      break;
    case 'acked':
      message = `👀 INCIDENT ACKNOWLEDGED
Monitor: ${incident.monitor.name}

View: ${incidentUrl}`;
      break;
    case 'resolved':
      message = `✅ INCIDENT RESOLVED
Monitor: ${incident.monitor.name}

View: ${incidentUrl}`;
      break;
  }

  return truncateText(message);
}

/**
 * Check rate limit for SMS
 * Simple in-memory rate limiting per org
 */
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(orgId: string): boolean {
  const now = Date.now();
  const limit = rateLimitCache.get(orgId);

  // Allow 10 SMS per hour per org
  const MAX_SMS_PER_HOUR = 10;
  const ONE_HOUR = 60 * 60 * 1000;

  if (!limit || now > limit.resetAt) {
    rateLimitCache.set(orgId, {
      count: 1,
      resetAt: now + ONE_HOUR,
    });
    return true;
  }

  if (limit.count >= MAX_SMS_PER_HOUR) {
    logger.warn({ orgId }, 'SMS rate limit exceeded');
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Send SMS via Twilio
 */
async function sendSMS(
  config: SMSConfig,
  incident: Incident,
  action: 'opened' | 'acked' | 'resolved'
): Promise<void> {
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!fromNumber) {
    throw new Error('TWILIO_FROM_NUMBER not configured');
  }

  // Check rate limit
  if (!checkRateLimit(incident.monitor.org.name)) {
    logger.warn({
      incidentId: incident.id,
      orgId: incident.monitor.org.name,
    }, 'SMS rate limit exceeded, skipping');
    return;
  }

  const client = getTwilioClient();
  const message = formatSMS(incident, action);

  const results = [];

  for (const recipient of config.recipients) {
    try {
      const result = await client.messages.create({
        body: message,
        from: fromNumber,
        to: recipient,
      });

      logger.info({
        incidentId: incident.id,
        recipient,
        messageSid: result.sid,
        status: result.status,
      }, 'SMS sent');

      results.push({ recipient, success: true, sid: result.sid });
    } catch (error: any) {
      logger.error({
        incidentId: incident.id,
        recipient,
        error: error.message,
      }, 'SMS failed');

      results.push({ recipient, success: false, error: error.message });
    }
  }

  // If all failed, throw error
  if (results.every(r => !r.success)) {
    throw new Error('All SMS messages failed');
  }
}

/**
 * Send SMS alert for incident opened
 */
export async function sendSMSOpened(
  incidentId: string,
  channelId: string
): Promise<void> {
  if (!process.env.TWILIO_ENABLED || process.env.TWILIO_ENABLED === 'false') {
    logger.info('SMS integration disabled');
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

  if (!channel || channel.type !== 'SMS') {
    throw new Error(`Invalid SMS channel ${channelId}`);
  }

  const config = channel.configJson as unknown as SMSConfig;

  await sendSMS(config, incident as any, 'opened');
}

/**
 * Send SMS alert for incident acknowledged
 */
export async function sendSMSAcknowledged(
  incidentId: string,
  channelId: string
): Promise<void> {
  if (!process.env.TWILIO_ENABLED || process.env.TWILIO_ENABLED === 'false') {
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

  if (!channel || channel.type !== 'SMS') {
    throw new Error(`Invalid SMS channel ${channelId}`);
  }

  const config = channel.configJson as unknown as SMSConfig;

  await sendSMS(config, incident as any, 'acked');
}

/**
 * Send SMS alert for incident resolved
 */
export async function sendSMSResolved(
  incidentId: string,
  channelId: string
): Promise<void> {
  if (!process.env.TWILIO_ENABLED || process.env.TWILIO_ENABLED === 'false') {
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

  if (!channel || channel.type !== 'SMS') {
    throw new Error(`Invalid SMS channel ${channelId}`);
  }

  const config = channel.configJson as unknown as SMSConfig;

  await sendSMS(config, incident as any, 'resolved');
}

