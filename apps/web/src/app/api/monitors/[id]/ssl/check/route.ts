import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

/**
 * POST /api/monitors/:id/ssl/check
 * Manually trigger an SSL certificate check
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user has access to this monitor
    const monitor = await prisma.monitor.findFirst({
      where: {
        id,
        Org: {
          Membership: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        checkSsl: true,
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    if (!monitor.checkSsl) {
      return NextResponse.json(
        { error: 'SSL checking is not enabled for this monitor' },
        { status: 400 }
      );
    }

    // Queue SSL check job (dynamic import to avoid circular dependencies)
    const { sslCheckQueue } = await import('@tokiflow/shared');
    
    const job = await sslCheckQueue.add(
      'check-ssl-manual',
      { monitorId: id },
      {
        jobId: `ssl-manual-${id}-${Date.now()}`,
        removeOnComplete: 10,
        removeOnFail: 10,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'SSL check queued',
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error triggering SSL check:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

