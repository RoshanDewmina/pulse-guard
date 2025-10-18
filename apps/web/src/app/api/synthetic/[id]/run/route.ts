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

    // Verify access and check quota
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
      include: {
        Org: {
          include: {
            SubscriptionPlan: true,
          },
        },
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Check synthetic run quota
    const plan = monitor.Org.SubscriptionPlan;
    if (!plan) {
      return NextResponse.json({ error: 'No subscription plan found' }, { status: 404 });
    }

    if (plan.syntheticRunsUsed >= plan.syntheticRunsLimit) {
      return NextResponse.json(
        { error: `Synthetic run quota exceeded (${plan.syntheticRunsLimit}/month). Please upgrade your plan.` },
        { status: 403 }
      );
    }

    // Increment usage counter
    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: {
        syntheticRunsUsed: {
          increment: 1,
        },
      },
    });

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

