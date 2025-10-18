import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { syntheticMonitorQueue } from '@tokiflow/shared';

/**
 * POST /api/synthetic/:id/run
 * Manually trigger a synthetic monitor run
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

    // Verify access
    const monitor = await prisma.syntheticMonitor.findFirst({
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
        isEnabled: true,
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Queue the synthetic test
    const job = await syntheticMonitorQueue.add(
      `manual-run-${id}`,
      { monitorId: id },
      {
        jobId: `synthetic-manual-${id}-${Date.now()}`,
        removeOnComplete: 10,
        removeOnFail: 10,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Synthetic test queued',
      jobId: job.id,
    });
  } catch (error) {
    console.error('Error triggering synthetic run:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

