import { App, ExpressReceiver } from '@slack/bolt';
import { WebClient } from '@slack/web-api';

// Create Express receiver for Next.js API routes compatibility
export function createSlackReceiver() {
  return new ExpressReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET!,
    processBeforeResponse: true,
  });
}

// Initialize Slack app
let slackApp: App | null = null;

export function getSlackApp(): App {
  if (!slackApp) {
    const receiver = createSlackReceiver();
    
    slackApp = new App({
      receiver,
      clientId: process.env.SLACK_CLIENT_ID,
      clientSecret: process.env.SLACK_CLIENT_SECRET,
      stateSecret: process.env.SLACK_STATE_SECRET || 'default-state-secret',
      scopes: [
        'chat:write',
        'commands',
        'channels:read',
        'users:read',
      ],
    });
  }

  return slackApp;
}

// Create a Slack client for posting messages
export function createSlackClient(accessToken: string): WebClient {
  return new WebClient(accessToken);
}

interface IncidentCardData {
  monitorName: string;
  incidentId: string;
  incidentKind: string;
  summary: string;
  nextDueAt?: string;
  lastRunAt?: string;
  lastDuration?: string;
  lastExitCode?: number;
  recentRuns?: ('success' | 'fail')[];
  dashboardUrl: string;
}

export function buildIncidentBlocks(data: IncidentCardData) {
  const {
    monitorName,
    incidentId,
    incidentKind,
    summary,
    nextDueAt,
    lastRunAt,
    lastDuration,
    lastExitCode,
    recentRuns,
    dashboardUrl,
  } = data;

  const emoji = {
    MISSED: '⏰',
    LATE: '🕐',
    FAIL: '❌',
    ANOMALY: '📊',
  }[incidentKind] || '⚠️';

  const fields = [];
  
  if (nextDueAt) {
    fields.push({
      type: 'mrkdwn',
      text: `*Next Due:*\n${nextDueAt}`,
    });
  }
  
  if (lastRunAt) {
    fields.push({
      type: 'mrkdwn',
      text: `*Last Run:*\n${lastRunAt}`,
    });
  }
  
  if (lastDuration) {
    fields.push({
      type: 'mrkdwn',
      text: `*Duration:*\n${lastDuration}`,
    });
  }
  
  if (lastExitCode !== undefined) {
    fields.push({
      type: 'mrkdwn',
      text: `*Exit Code:*\n${lastExitCode}`,
    });
  }

  let recentRunsText = '';
  if (recentRuns && recentRuns.length > 0) {
    recentRunsText = recentRuns
      .map(status => (status === 'success' ? '✅' : '❌'))
      .join(' ');
  }

  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${emoji} ${incidentKind} — ${monitorName}`,
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${summary}*`,
      },
    },
  ];

  if (fields.length > 0) {
    blocks.push({
      type: 'section',
      fields,
    });
  }

  if (recentRunsText) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Recent runs: ${recentRunsText}`,
        },
      ],
    });
  }

  blocks.push({
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
        url: dashboardUrl,
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
  });

  return blocks;
}

interface PostSlackAlertParams {
  accessToken: string;
  channel: string;
  blocks: any[];
  text: string;
}

export async function postSlackAlert(params: PostSlackAlertParams) {
  const { accessToken, channel, blocks, text } = params;
  
  const client = createSlackClient(accessToken);
  
  try {
    const result = await client.chat.postMessage({
      channel,
      blocks,
      text, // Fallback text for notifications
    });
    
    return result;
  } catch (error) {
    console.error('Failed to post Slack message:', error);
    throw error;
  }
}

export async function updateSlackMessage(
  accessToken: string,
  channel: string,
  messageTs: string,
  blocks: any[]
) {
  const client = createSlackClient(accessToken);
  
  try {
    const result = await client.chat.update({
      channel,
      ts: messageTs,
      blocks,
    });
    
    return result;
  } catch (error) {
    console.error('Failed to update Slack message:', error);
    throw error;
  }
}

/**
 * Post a threaded reply to an existing Slack message
 */
export async function postSlackThreadReply(
  accessToken: string,
  channel: string,
  threadTs: string,
  text: string,
  blocks?: any[]
) {
  const client = createSlackClient(accessToken);
  
  try {
    const result = await client.chat.postMessage({
      channel,
      thread_ts: threadTs,
      text,
      blocks,
    });
    
    return result;
  } catch (error) {
    console.error('Failed to post Slack thread reply:', error);
    throw error;
  }
}

/**
 * Open a modal dialog in Slack
 */
export async function openSlackModal(
  accessToken: string,
  triggerId: string,
  view: any
) {
  const client = createSlackClient(accessToken);
  
  try {
    const result = await client.views.open({
      trigger_id: triggerId,
      view,
    });
    
    return result;
  } catch (error) {
    console.error('Failed to open Slack modal:', error);
    throw error;
  }
}

