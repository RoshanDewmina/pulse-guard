import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';
import { updateSlackMessage, buildIncidentBlocks, openSlackModal, postSlackThreadReply } from '@/lib/slack';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const payload = JSON.parse(new URLSearchParams(body).get('payload') || '{}');

    // Handle block actions (button clicks)
    if (payload.type === 'block_actions') {
      const action = payload.actions[0];
      const incidentId = action.value;

      if (action.action_id === 'acknowledge_incident') {
        await handleAcknowledge(incidentId, payload);
      } else if (action.action_id === 'mute_incident') {
        await handleMuteModal(incidentId, payload);
      } else if (action.action_id === 'resolve_incident') {
        await handleResolveModal(incidentId, payload);
      }

      return NextResponse.json({ ok: true });
    }
    
    // Handle view submissions (modal submissions)
    if (payload.type === 'view_submission') {
      const callbackId = payload.view.callback_id;
      
      if (callbackId.startsWith('mute_')) {
        await handleMuteSubmission(payload);
      } else if (callbackId.startsWith('resolve_')) {
        await handleResolveSubmission(payload);
      }
      
      return NextResponse.json({ ok: true });
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

/**
 * Open mute modal with time picker
 */
async function handleMuteModal(incidentId: string, payload: any) {
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
    return;
  }

  // Get Slack access token
  const channel = await prisma.alertChannel.findFirst({
    where: {
      orgId: incident.monitor.orgId,
      type: 'SLACK',
    },
  });

  if (!channel) {
    return;
  }

  const config = channel.configJson as any;
  
  // Open modal with time picker
  const view = {
    type: 'modal',
    callback_id: `mute_${incidentId}`,
    title: {
      type: 'plain_text',
      text: 'Mute Incident',
    },
    submit: {
      type: 'plain_text',
      text: 'Mute',
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Monitor:* ${incident.monitor.name}\n*Incident:* ${incident.summary}`,
        },
      },
      {
        type: 'input',
        block_id: 'mute_duration',
        element: {
          type: 'static_select',
          action_id: 'duration_select',
          placeholder: {
            type: 'plain_text',
            text: 'Select duration',
          },
          options: [
            { text: { type: 'plain_text', text: '30 minutes' }, value: '30' },
            { text: { type: 'plain_text', text: '1 hour' }, value: '60' },
            { text: { type: 'plain_text', text: '2 hours' }, value: '120' },
            { text: { type: 'plain_text', text: '4 hours' }, value: '240' },
            { text: { type: 'plain_text', text: '8 hours' }, value: '480' },
            { text: { type: 'plain_text', text: '24 hours' }, value: '1440' },
          ],
          initial_option: { text: { type: 'plain_text', text: '2 hours' }, value: '120' },
        },
        label: {
          type: 'plain_text',
          text: 'Mute Duration',
        },
      },
    ],
  };

  await openSlackModal(config.accessToken, payload.trigger_id, view);
}

/**
 * Handle mute modal submission
 */
async function handleMuteSubmission(payload: any) {
  const callbackId = payload.view.callback_id;
  const incidentId = callbackId.replace('mute_', '');
  
  const durationMinutes = parseInt(
    payload.view.state.values.mute_duration.duration_select.selected_option.value
  );
  
  const suppressUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

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
      message: `Muted for ${durationMinutes}m via Slack by ${payload.user.name}`,
      metadata: {
        slackUserId: payload.user.id,
        slackUserName: payload.user.name,
        suppressUntil: suppressUntil.toISOString(),
        durationMinutes,
      },
    },
  });

  // Post thread reply
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

  if (incident?.slackMessageTs && incident?.slackChannelId) {
    const channel = await prisma.alertChannel.findFirst({
      where: {
        orgId: incident.monitor.orgId,
        type: 'SLACK',
      },
    });

    if (channel) {
      const config = channel.configJson as any;
      await postSlackThreadReply(
        config.accessToken,
        incident.slackChannelId,
        incident.slackMessageTs,
        `🔕 *Incident Muted*\nMuted for ${durationMinutes} minutes by <@${payload.user.id}>`
      );
    }
  }
}

/**
 * Open resolve modal with note input
 */
async function handleResolveModal(incidentId: string, payload: any) {
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
    return;
  }

  // Get Slack access token
  const channel = await prisma.alertChannel.findFirst({
    where: {
      orgId: incident.monitor.orgId,
      type: 'SLACK',
    },
  });

  if (!channel) {
    return;
  }

  const config = channel.configJson as any;
  
  // Open modal with note input
  const view = {
    type: 'modal',
    callback_id: `resolve_${incidentId}`,
    title: {
      type: 'plain_text',
      text: 'Resolve Incident',
    },
    submit: {
      type: 'plain_text',
      text: 'Resolve',
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
    },
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Monitor:* ${incident.monitor.name}\n*Incident:* ${incident.summary}`,
        },
      },
      {
        type: 'input',
        block_id: 'resolution_note',
        element: {
          type: 'plain_text_input',
          action_id: 'note_input',
          multiline: true,
          placeholder: {
            type: 'plain_text',
            text: 'Optional: Add resolution notes...',
          },
        },
        label: {
          type: 'plain_text',
          text: 'Resolution Notes',
        },
        optional: true,
      },
    ],
  };

  await openSlackModal(config.accessToken, payload.trigger_id, view);
}

/**
 * Handle resolve modal submission
 */
async function handleResolveSubmission(payload: any) {
  const callbackId = payload.view.callback_id;
  const incidentId = callbackId.replace('resolve_', '');
  
  const note = payload.view.state.values.resolution_note?.note_input?.value || '';

  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      details: note ? `${note}` : undefined,
    },
  });

  // Create event
  await prisma.incidentEvent.create({
    data: {
      incidentId,
      eventType: 'resolved',
      message: `Resolved via Slack by ${payload.user.name}${note ? ` with note: ${note}` : ''}`,
      metadata: {
        slackUserId: payload.user.id,
        slackUserName: payload.user.name,
        note,
      },
    },
  });

  // Post thread reply
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

  if (incident?.slackMessageTs && incident?.slackChannelId) {
    const channel = await prisma.alertChannel.findFirst({
      where: {
        orgId: incident.monitor.orgId,
        type: 'SLACK',
      },
    });

    if (channel) {
      const config = channel.configJson as any;
      let replyText = `🎉 *Incident Resolved*\nResolved by <@${payload.user.id}>`;
      if (note) {
        replyText += `\n\n*Notes:*\n${note}`;
      }
      
      await postSlackThreadReply(
        config.accessToken,
        incident.slackChannelId,
        incident.slackMessageTs,
        replyText
      );
    }
  }
}

