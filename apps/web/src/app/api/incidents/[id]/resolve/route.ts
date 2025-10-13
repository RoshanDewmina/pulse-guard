import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { updateIncidentMessage, postResolutionReply } from '@/lib/slack/threading';

export const runtime = 'nodejs';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        monitor: true,
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: session.user.id,
          orgId: incident.monitor.orgId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const updated = await prisma.incident.update({
      where: { id: id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
      },
      include: {
        monitor: true,
      },
    });

    // Create incident event
    await prisma.incidentEvent.create({
      data: {
        incidentId: id,
        eventType: 'resolved',
        message: `Resolved by ${session.user.email}`,
        metadata: {
          userId: session.user.id,
        },
      },
    });

    // Update Slack message if available
    if (updated.slackMessageTs && updated.slackChannelId) {
      // Get Slack access token from alert channel
      const slackChannel = await prisma.alertChannel.findFirst({
        where: {
          orgId: incident.monitor.orgId,
          type: 'SLACK',
        },
      });

      if (slackChannel) {
        const config = slackChannel.configJson as any;
        if (config.accessToken) {
          // Update message asynchronously (don't block response)
          updateIncidentMessage(config.accessToken, updated).catch(err => {
            console.error('Failed to update Slack message:', err);
          });
          
          // Post resolution reply
          postResolutionReply(config.accessToken, updated, session.user.id).catch(err => {
            console.error('Failed to post Slack reply:', err);
          });
        }
      }
    }

    return NextResponse.json({ incident: updated });
  } catch (error) {
    console.error('Resolve incident error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

