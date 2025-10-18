import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
// Simple ID generator fallback
function createId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * POST /api/onboarding/test-alert
 * Send a test alert through all connected channels
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await getUserPrimaryOrg(session.user.id);
    
    if (!org) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get the first monitor (or create a test one)
    let monitor = await prisma.monitor.findFirst({
      where: { orgId: org.id },
      orderBy: { createdAt: 'desc' },
    });

    // If no monitor exists, we can't send a test alert
    if (!monitor) {
      return NextResponse.json(
        { error: 'Please create a monitor first before testing alerts' },
        { status: 400 }
      );
    }

    // Get alert channels
    const channels = await prisma.alertChannel.findMany({
      where: { orgId: org.id },
    });

    if (channels.length === 0) {
      return NextResponse.json(
        { error: 'Please connect an alert channel first' },
        { status: 400 }
      );
    }

    // Create a test incident
    const testIncident = await prisma.incident.create({
      data: {
        id: createId(),
        monitorId: monitor.id,
        status: 'OPEN',
        kind: 'FAIL',
        openedAt: new Date(),
        summary: '🎉 Test Alert from Saturn Onboarding',
        details: `This is a test alert to verify your notifications are working correctly. 

Monitor: ${monitor.name}
Organization: ${org.name}
Channels: ${channels.map(c => c.type).join(', ')}

If you received this alert, everything is set up properly! This test incident will be automatically resolved in a few seconds.`,
        dedupeHash: `test-${Date.now()}`,
      },
    });

    // Queue alert to all channels
    const { alertsQueue } = await import('@/lib/queues');
    
    await alertsQueue.add('alert-dispatch', {
      incidentId: testIncident.id,
    });

    // Auto-resolve the test incident after 5 seconds
    setTimeout(async () => {
      try {
        await prisma.incident.update({
          where: { id: testIncident.id },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
          },
        });
        
        // Optionally send resolve notification
        await alertsQueue.add('alert-dispatch', {
          incidentId: testIncident.id,
        });
      } catch (error) {
        console.error('Failed to auto-resolve test incident:', error);
      }
    }, 5000);

    return NextResponse.json({
      success: true,
      incidentId: testIncident.id,
      channelsNotified: channels.length,
      message: 'Test alert sent! Check your notification channels.',
    });
  } catch (error) {
    console.error('Test alert error:', error);
    return NextResponse.json(
      { error: 'Failed to send test alert' },
      { status: 500 }
    );
  }
}

