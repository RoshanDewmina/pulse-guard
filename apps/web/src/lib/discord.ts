/**
 * Discord Webhook Integration
 * 
 * Send rich embeds to Discord channels via webhooks
 */

// Local minimal types to avoid depending on Prisma types in web layer
type Monitor = {
  id: string;
  name: string;
  status: string;
  lastRunAt?: Date | null;
  nextDueAt?: Date | null;
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
  slackMessageTs?: string | null;
  slackChannelId?: string | null;
  Monitor: Monitor;
};

export interface DiscordConfig {
  webhookUrl: string;
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  footer?: {
    text: string;
  };
  timestamp?: string;
}

export interface DiscordWebhookPayload {
  username?: string;
  avatar_url?: string;
  content?: string;
  embeds?: DiscordEmbed[];
}

/**
 * Send a Discord webhook message
 * 
 * @param config - Discord configuration
 * @param payload - Webhook payload
 * @returns Success status
 */
export async function sendDiscordWebhook(
  config: DiscordConfig,
  payload: DiscordWebhookPayload
): Promise<boolean> {
  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Discord webhook failed:', response.status, text);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Discord webhook error:', error);
    return false;
  }
}

/**
 * Get color for incident kind
 */
function getDiscordColor(kind: string, status: string): number {
  if (status === 'RESOLVED') {
    return 0x00ff00; // Green
  }

  switch (kind) {
    case 'FAIL':
      return 0xff0000; // Red
    case 'MISSED':
      return 0xff9900; // Orange
    case 'LATE':
      return 0xffcc00; // Yellow
    case 'ANOMALY':
      return 0x9900ff; // Purple
    default:
      return 0x808080; // Gray
  }
}

/**
 * Get emoji for incident kind
 */
function getEmojiForKind(kind: string, status: string): string {
  if (status === 'RESOLVED') {
    return '✅';
  }

  switch (kind) {
    case 'FAIL':
      return '❌';
    case 'MISSED':
      return '🟠';
    case 'LATE':
      return '🟡';
    case 'ANOMALY':
      return '⚠️';
    default:
      return '🔔';
  }
}

/**
 * Build Discord embed for incident alert
 * 
 * @param incident - Incident data
 * @param monitor - Monitor data
 * @returns Discord embed
 */
export function buildIncidentEmbed(
  incident: Incident
): DiscordEmbed {
  const emoji = getEmojiForKind(incident.kind, incident.status);
  const color = getDiscordColor(incident.kind, incident.status);

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: '📊 Monitor',
      value: incident.Monitor.name,
      inline: true,
    },
    {
      name: '🔖 Kind',
      value: incident.kind,
      inline: true,
    },
    {
      name: '📍 Status',
      value: incident.status,
      inline: true,
    },
  ];

  if (incident.Monitor.lastRunAt) {
    fields.push({
      name: '⏰ Last Run',
      value: new Date(incident.Monitor.lastRunAt).toLocaleString(),
      inline: true,
    });
  }

  if (incident.Monitor.nextDueAt) {
    fields.push({
      name: '⏭️ Next Due',
      value: new Date(incident.Monitor.nextDueAt).toLocaleString(),
      inline: true,
    });
  }

  if (incident.Monitor.lastDurationMs) {
    fields.push({
      name: '⏱️ Duration',
      value: `${incident.Monitor.lastDurationMs}ms`,
      inline: true,
    });
  }

  if (incident.details) {
    fields.push({
      name: '📝 Details',
      value: incident.details.substring(0, 1024), // Discord limit
      inline: false,
    });
  }

  return {
    title: `${emoji} ${incident.summary}`,
    description: `Incident opened at ${new Date(incident.openedAt).toLocaleString()}`,
    color,
    fields,
    footer: {
      text: 'Saturn Monitoring',
    },
    timestamp: incident.openedAt.toISOString(),
  };
}

/**
 * Send incident alert to Discord
 * 
 * @param config - Discord configuration
 * @param incident - Incident data
 * @param monitor - Monitor data
 * @returns Success status
 */
export async function sendIncidentAlert(
  config: DiscordConfig,
  incident: Incident
): Promise<boolean> {
  const embed = buildIncidentEmbed(incident);

  const payload: DiscordWebhookPayload = {
    username: 'Saturn',
    embeds: [embed],
  };

  return await sendDiscordWebhook(config, payload);
}

/**
 * Send incident resolution to Discord
 * 
 * @param config - Discord configuration
 * @param incident - Incident data
 * @param monitor - Monitor data
 * @returns Success status
 */
export async function sendIncidentResolution(
  config: DiscordConfig,
  incident: Incident
): Promise<boolean> {
  const embed: DiscordEmbed = {
    title: `✅ Incident Resolved: ${incident.Monitor.name}`,
    description: incident.summary,
    color: 0x00ff00, // Green
    fields: [
      {
        name: 'Resolved At',
        value: incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : 'Now',
        inline: true,
      },
      {
        name: 'Duration',
        value: incident.resolvedAt && incident.openedAt
          ? `${Math.round((new Date(incident.resolvedAt).getTime() - new Date(incident.openedAt).getTime()) / 60000)}m`
          : 'N/A',
        inline: true,
      },
    ],
    footer: {
      text: 'Saturn Monitoring',
    },
    timestamp: new Date().toISOString(),
  };

  return await sendDiscordWebhook(config, {
    username: 'Saturn',
    embeds: [embed],
  });
}

/**
 * Validate Discord webhook URL
 * 
 * @param url - Webhook URL
 * @returns True if valid Discord webhook URL
 */
export function isValidDiscordWebhook(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'discord.com' ||
      parsed.hostname === 'discordapp.com'
    ) && parsed.pathname.includes('/api/webhooks/');
  } catch {
    return false;
  }
}




