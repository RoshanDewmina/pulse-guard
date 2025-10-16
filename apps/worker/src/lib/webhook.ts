/**
 * Generic Webhook Integration
 * 
 * Send custom HTTP POST requests to any webhook endpoint
 */

import crypto from 'crypto';

// Local minimal types to avoid depending on Prisma types in web layer
type Monitor = {
  id: string;
  name: string;
  status: string;
  scheduleType: string;
  intervalSec?: number | null;
  cronExpr?: string | null;
  timezone: string;
  lastRunAt?: Date | null;
  lastDurationMs?: number | null;
  lastExitCode?: number | null;
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
};

export interface WebhookConfig {
  url: string;
  method?: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  secret?: string; // For HMAC signature
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
}

export interface WebhookPayload {
  event: 'incident.opened' | 'incident.acknowledged' | 'incident.resolved';
  timestamp: string;
  incident: {
    id: string;
    kind: string;
    status: string;
    summary: string;
    details?: string;
    openedAt: string;
    acknowledgedAt?: string;
    resolvedAt?: string;
  };
  monitor: {
    id: string;
    name: string;
    status: string;
    schedule: {
      type: string;
      interval?: number;
      cron?: string;
      timezone: string;
    };
    lastRun?: {
      at: string;
      durationMs?: number;
      exitCode?: number;
    };
  };
}

/**
 * Generate HMAC signature for webhook payload
 * 
 * @param payload - JSON payload
 * @param secret - Secret key
 * @returns HMAC SHA-256 signature
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Send webhook with retry logic
 * 
 * @param config - Webhook configuration
 * @param payload - Payload to send
 * @param attempt - Current attempt number
 * @returns Success status
 */
export async function sendWebhook(
  config: WebhookConfig,
  payload: WebhookPayload,
  attempt: number = 1
): Promise<boolean> {
  const maxAttempts = config.retryAttempts || 3;
  const retryDelay = config.retryDelay || 1000;
  
  try {
    const payloadString = JSON.stringify(payload);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Saturn/1.0',
      ...config.headers,
    };

    // Add HMAC signature if secret provided
    if (config.secret) {
      headers['X-Saturn-Signature'] = generateSignature(payloadString, config.secret);
      headers['X-Saturn-Timestamp'] = Date.now().toString();
    }

    const response = await fetch(config.url, {
      method: config.method || 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error(`Webhook attempt ${attempt}/${maxAttempts} failed:`, error);

    if (attempt < maxAttempts) {
      // Exponential backoff
      const delay = retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      return await sendWebhook(config, payload, attempt + 1);
    }

    return false;
  }
}

/**
 * Build webhook payload from incident
 * 
 * @param incident - Incident data
 * @param monitor - Monitor data
 * @param event - Event type
 * @returns Webhook payload
 */
export function buildWebhookPayload(
  incident: Incident,
  monitor: Monitor,
  event: 'incident.opened' | 'incident.acknowledged' | 'incident.resolved'
): WebhookPayload {
  return {
    event,
    timestamp: new Date().toISOString(),
    incident: {
      id: incident.id,
      kind: incident.kind,
      status: incident.status,
      summary: incident.summary,
      details: incident.details || undefined,
      openedAt: incident.openedAt.toISOString(),
      acknowledgedAt: incident.acknowledgedAt?.toISOString(),
      resolvedAt: incident.resolvedAt?.toISOString(),
    },
    monitor: {
      id: monitor.id,
      name: monitor.name,
      status: monitor.status,
      schedule: {
        type: monitor.scheduleType,
        interval: monitor.intervalSec || undefined,
        cron: monitor.cronExpr || undefined,
        timezone: monitor.timezone,
      },
      lastRun: monitor.lastRunAt ? {
        at: monitor.lastRunAt.toISOString(),
        durationMs: monitor.lastDurationMs || undefined,
        exitCode: monitor.lastExitCode || undefined,
      } : undefined,
    },
  };
}

/**
 * Send incident opened webhook
 */
export async function sendIncidentOpenedWebhook(
  config: WebhookConfig,
  incident: Incident,
  monitor: Monitor
): Promise<boolean> {
  const payload = buildWebhookPayload(incident, monitor, 'incident.opened');
  return await sendWebhook(config, payload);
}

/**
 * Send incident acknowledged webhook
 */
export async function sendIncidentAcknowledgedWebhook(
  config: WebhookConfig,
  incident: Incident,
  monitor: Monitor
): Promise<boolean> {
  const payload = buildWebhookPayload(incident, monitor, 'incident.acknowledged');
  return await sendWebhook(config, payload);
}

/**
 * Send incident resolved webhook
 */
export async function sendIncidentResolvedWebhook(
  config: WebhookConfig,
  incident: Incident,
  monitor: Monitor
): Promise<boolean> {
  const payload = buildWebhookPayload(incident, monitor, 'incident.resolved');
  return await sendWebhook(config, payload);
}

/**
 * Validate webhook URL
 * 
 * @param url - Webhook URL
 * @returns True if valid URL
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Test webhook by sending a test payload
 */
export async function testWebhook(config: WebhookConfig): Promise<{ success: boolean; message: string }> {
  const testPayload: WebhookPayload = {
    event: 'incident.opened',
    timestamp: new Date().toISOString(),
    incident: {
      id: 'test-incident-id',
      kind: 'FAIL',
      status: 'OPEN',
      summary: 'Test incident from Saturn',
      openedAt: new Date().toISOString(),
    },
    monitor: {
      id: 'test-monitor-id',
      name: 'Test Monitor',
      status: 'FAILING',
      schedule: {
        type: 'INTERVAL',
        interval: 300,
        timezone: 'UTC',
      },
    },
  };

  const success = await sendWebhook(config, testPayload);
  
  return {
    success,
    message: success ? 'Webhook test successful' : 'Webhook test failed',
  };
}


