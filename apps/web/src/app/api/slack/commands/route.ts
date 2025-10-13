import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';
import { formatSchedule } from '@/lib/schedule';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    const command = params.get('command');
    const text = params.get('text')?.trim() || '';
    const teamId = params.get('team_id');
    const userId = params.get('user_id');

    if (command === '/pulse') {
      const [subCommand, ...args] = text.split(' ');

      if (!subCommand || subCommand === 'help') {
        return handleHelp();
      } else if (subCommand === 'status') {
        return await handleStatus(teamId!, args.join(' '));
      } else if (subCommand === 'ack') {
        return await handleAck(teamId!, args[0], userId);
      } else if (subCommand === 'list' || subCommand === 'monitors') {
        return await handleList(teamId!);
      } else if (subCommand === 'incidents') {
        return await handleIncidents(teamId!);
      } else {
        return NextResponse.json({
          response_type: 'ephemeral',
          text: `Unknown command: ${subCommand}. Type \`/pulse help\` for usage.`,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Slack commands error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'An error occurred processing your command.',
    });
  }
}

function handleHelp() {
  return NextResponse.json({
    response_type: 'ephemeral',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚀 PulseGuard Commands',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Available commands:*',
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: '`/pulse monitors`\nList all monitors',
          },
          {
            type: 'mrkdwn',
            text: '`/pulse incidents`\nList open incidents',
          },
          {
            type: 'mrkdwn',
            text: '`/pulse status <name>`\nShow monitor details',
          },
          {
            type: 'mrkdwn',
            text: '`/pulse ack <incident-id>`\nAcknowledge incident',
          },
          {
            type: 'mrkdwn',
            text: '`/pulse help`\nShow this help',
          },
        ],
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '💡 Tip: Monitor names are case-insensitive and support partial matching',
          },
        ],
      },
    ],
  });
}

async function handleList(teamId: string) {
  // Find org by Slack team ID
  const channel = await prisma.alertChannel.findFirst({
    where: {
      type: 'SLACK',
      configJson: {
        path: ['teamId'],
        equals: teamId,
      },
    },
    include: {
      org: true,
    },
  });

  if (!channel) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Slack workspace not connected to PulseGuard.',
    });
  }

  const monitors = await prisma.monitor.findMany({
    where: {
      orgId: channel.orgId,
      status: {
        not: 'DISABLED',
      },
    },
    take: 20,
    orderBy: {
      name: 'asc',
    },
  });

  if (monitors.length === 0) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'No monitors found. Create your first monitor at https://app.pulseguard.com',
    });
  }

  const statusEmoji: Record<string, string> = {
    OK: '✅',
    LATE: '🟡',
    MISSED: '🟠',
    FAILING: '🔴',
    DISABLED: '⚫',
  };

  const monitorList = monitors.map(m => 
    `${statusEmoji[m.status] || '⚪'} *${m.name}* - ${m.status}`
  ).join('\n');

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📊 Your Monitors',
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: monitorList,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Showing ${monitors.length} monitors. Use \`/pulse status <name>\` for details.`,
          },
        ],
      },
    ],
  });
}

async function handleStatus(teamId: string, monitorName: string) {
  // Find org by Slack team ID
  const channel = await prisma.alertChannel.findFirst({
    where: {
      type: 'SLACK',
      configJson: {
        path: ['teamId'],
        equals: teamId,
      },
    },
    include: {
      org: true,
    },
  });

  if (!channel) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Slack workspace not connected to PulseGuard.',
    });
  }

  // If no monitor name provided, suggest using /pulse list
  if (!monitorName) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Usage: `/pulse status <monitor-name>` or use `/pulse list` to see all monitors.',
    });
  }

  // Find monitor
  const monitor = await prisma.monitor.findFirst({
    where: {
      orgId: channel.orgId,
      name: {
        contains: monitorName,
        mode: 'insensitive',
      },
    },
    include: {
      runs: {
        take: 10,
        orderBy: {
          startedAt: 'desc',
        },
      },
    },
  });

  if (!monitor) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Monitor "${monitorName}" not found. Use \`/pulse list\` to see all monitors.`,
    });
  }

  // Generate sparkline with better visualization
  const recentRuns = monitor.runs.reverse().slice(-7);
  const sparkline = recentRuns.map(run => {
    switch (run.outcome) {
      case 'SUCCESS': return '✅';
      case 'FAIL': return '❌';
      case 'LATE': return '🟡';
      case 'MISSED': return '🟠';
      case 'TIMEOUT': return '⏱️';
      default: return '⚪';
    }
  }).join(' ');

  // Calculate success rate
  const successCount = recentRuns.filter(r => r.outcome === 'SUCCESS').length;
  const successRate = recentRuns.length > 0 ? ((successCount / recentRuns.length) * 100).toFixed(0) : '0';

  // Calculate average duration
  const durationsWithValues = recentRuns.filter(r => r.durationMs !== null).map(r => r.durationMs!);
  const avgDuration = durationsWithValues.length > 0
    ? (durationsWithValues.reduce((a, b) => a + b, 0) / durationsWithValues.length).toFixed(0)
    : null;

  const statusEmoji: Record<string, string> = {
    OK: '✅',
    LATE: '🟡',
    MISSED: '🟠',
    FAILING: '🔴',
    DISABLED: '⚫',
  };

  const schedule = formatSchedule(monitor.scheduleType, monitor.intervalSec, monitor.cronExpr);
  
  const blocks: any[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${statusEmoji[monitor.status] || '⚪'} ${monitor.name}`,
      },
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Status:* ${monitor.status}`,
        },
        {
          type: 'mrkdwn',
          text: `*Schedule:* ${schedule}`,
        },
        {
          type: 'mrkdwn',
          text: `*Last Run:* ${monitor.lastRunAt ? new Date(monitor.lastRunAt).toLocaleString('en-US', { timeZone: monitor.timezone }) : 'Never'}`,
        },
        {
          type: 'mrkdwn',
          text: `*Next Due:* ${monitor.nextDueAt ? new Date(monitor.nextDueAt).toLocaleString('en-US', { timeZone: monitor.timezone }) : 'N/A'}`,
        },
      ],
    },
  ];

  if (recentRuns.length > 0) {
    blocks.push({
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Success Rate:* ${successRate}%`,
        },
        {
          type: 'mrkdwn',
          text: `*Avg Duration:* ${avgDuration ? `${avgDuration}ms` : 'N/A'}`,
        },
      ],
    });
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `Recent runs: ${sparkline || 'No runs yet'}`,
      },
    ],
  });

  // Add last run details if available
  if (monitor.lastRunAt && monitor.runs.length > 0) {
    const lastRun = monitor.runs[0];
    const timeSinceRun = Math.floor((Date.now() - new Date(lastRun.startedAt).getTime()) / 1000 / 60);
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Last run ${timeSinceRun}m ago • Duration: ${lastRun.durationMs || 'N/A'}ms • Exit: ${lastRun.exitCode ?? 'N/A'}`,
        },
      ],
    });
  }

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks,
  });
}

async function handleAck(teamId: string, incidentId: string, userId?: string | null) {
  if (!incidentId) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Usage: `/pulse ack <incident-id>`',
    });
  }

  // Verify org access
  const channel = await prisma.alertChannel.findFirst({
    where: {
      type: 'SLACK',
      configJson: {
        path: ['teamId'],
        equals: teamId,
      },
    },
  });

  if (!channel) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Slack workspace not connected to PulseGuard.',
    });
  }

  const incident = await prisma.incident.findFirst({
    where: { 
      id: incidentId,
      monitor: {
        orgId: channel.orgId,
      },
    },
    include: {
      monitor: true,
    },
  });

  if (!incident) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Incident \`${incidentId}\` not found or you don't have access.`,
    });
  }

  if (incident.status !== 'OPEN') {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `Incident \`${incidentId}\` is already ${incident.status.toLowerCase()}.`,
    });
  }

  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status: 'ACKED',
      acknowledgedAt: new Date(),
    },
  });

  await prisma.incidentEvent.create({
    data: {
      incidentId,
      eventType: 'acknowledged',
      message: `Acknowledged via /pulse command by ${userId || 'Slack user'}`,
      metadata: {
        teamId,
        userId,
      },
    },
  });

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `✅ *Incident Acknowledged*\n\nMonitor: *${incident.monitor.name}*\nKind: ${incident.kind}\nIncident ID: \`${incidentId}\``,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: 'The incident is now acknowledged. Use `/pulse status` to check monitor health.',
          },
        ],
      },
    ],
  });
}

async function handleIncidents(teamId: string) {
  // Find org by Slack team ID
  const channel = await prisma.alertChannel.findFirst({
    where: {
      type: 'SLACK',
      configJson: {
        path: ['teamId'],
        equals: teamId,
      },
    },
    include: {
      org: true,
    },
  });

  if (!channel) {
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Slack workspace not connected to PulseGuard.',
    });
  }

  const incidents = await prisma.incident.findMany({
    where: {
      monitor: {
        orgId: channel.orgId,
      },
      status: {
        in: ['OPEN', 'ACKED'],
      },
    },
    include: {
      monitor: true,
    },
    take: 20,
    orderBy: {
      openedAt: 'desc',
    },
  });

  if (incidents.length === 0) {
    return NextResponse.json({
      response_type: 'ephemeral',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '🎉 *No Open Incidents*\n\nAll systems are healthy! There are no open or acknowledged incidents at this time.',
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: 'Use `/pulse monitors` to see all your monitors.',
            },
          ],
        },
      ],
    });
  }

  const kindEmoji: Record<string, string> = {
    MISSED: '⏰',
    LATE: '🕐',
    FAIL: '❌',
    ANOMALY: '📊',
    DEGRADED: '⚠️',
  };

  const statusEmoji: Record<string, string> = {
    OPEN: '🔴',
    ACKED: '🟡',
    RESOLVED: '✅',
  };

  const incidentList = incidents.map(inc => {
    const timeSinceOpened = Math.floor((Date.now() - new Date(inc.openedAt).getTime()) / 1000 / 60);
    const timeStr = timeSinceOpened < 60 ? `${timeSinceOpened}m ago` : `${Math.floor(timeSinceOpened / 60)}h ago`;
    return `${kindEmoji[inc.kind] || '⚠️'} ${statusEmoji[inc.status]} *${inc.monitor.name}* - ${inc.kind}\n   _${inc.summary}_ • Opened ${timeStr} • ID: \`${inc.id}\``;
  }).join('\n\n');

  return NextResponse.json({
    response_type: 'ephemeral',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🚨 Open Incidents (${incidents.length})`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: incidentList,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `💡 Use \`/pulse ack <incident-id>\` to acknowledge an incident.`,
          },
        ],
      },
    ],
  });
}

