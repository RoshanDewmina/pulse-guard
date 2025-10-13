import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';
import { updateSlackMessage, buildIncidentBlocks } from '@/lib/slack';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(new URLSearchParams(body).get('payload') || '{}');

    if (payload.type !== 'block_actions') {
      return NextResponse.json({ ok: true });
    }

    const action = payload.actions[0];
    const incidentId = action.value;

    if (action.action_id === 'acknowledge_incident') {
      await handleAcknowledge(incidentId, payload);
    } else if (action.action_id === 'mute_incident') {
      await handleMute(incidentId, payload);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Slack actions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleAcknowledge(incidentId: string, payload: any) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      monitor: true,
    },
  });

  if (!incident) {
    return;
  }

  // Update incident
  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status: 'ACKED',
      acknowledgedAt: new Date(),
    },
  });

  // Create event
  await prisma.incidentEvent.create({
    data: {
      incidentId,
      eventType: 'acknowledged',
      message: `Acknowledged via Slack by ${payload.user.name}`,
      metadata: {
        slackUserId: payload.user.id,
        slackUserName: payload.user.name,
      },
    },
  });

  // Update Slack message
  const updatedBlocks = buildIncidentBlocks({
    monitorName: incident.monitor.name,
    incidentId: incident.id,
    incidentKind: incident.kind,
    summary: `✅ ACKNOWLEDGED - ${incident.summary}`,
    dashboardUrl: `${process.env.NEXTAUTH_URL}/app/monitors/${incident.monitorId}`,
  });

  // Get Slack access token from alert channel
  const channel = await prisma.alertChannel.findFirst({
    where: {
      orgId: incident.monitor.orgId,
      type: 'SLACK',
    },
  });

  if (channel) {
    const config = channel.configJson as any;
    await updateSlackMessage(
      config.accessToken,
      payload.channel.id,
      payload.message.ts,
      updatedBlocks
    );
  }
}

async function handleMute(incidentId: string, payload: any) {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      monitor: true,
    },
  });

  if (!incident) {
    return;
  }

  // Mute for 2 hours
  const suppressUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);

  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      suppressUntil,
    },
  });

  // Create event
  await prisma.incidentEvent.create({
    data: {
      incidentId,
      eventType: 'muted',
      message: `Muted for 2h via Slack by ${payload.user.name}`,
      metadata: {
        slackUserId: payload.user.id,
        slackUserName: payload.user.name,
        suppressUntil: suppressUntil.toISOString(),
      },
    },
  });
}

