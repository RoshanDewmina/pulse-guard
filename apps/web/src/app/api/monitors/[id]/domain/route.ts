import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

/**
 * GET /api/monitors/:id/domain
 * Get domain expiration status for a monitor
 */
export async function GET(
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
        checkDomain: true,
        domainAlertThresholds: true,
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Get domain expiration records (latest first)
    const domainExpirations = await prisma.domainExpiration.findMany({
      where: {
        monitorId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 30, // Last 30 checks
    });

    const latest = domainExpirations[0] || null;

    return NextResponse.json({
      monitor: {
        id: monitor.id,
        name: monitor.name,
        checkDomain: monitor.checkDomain,
        domainAlertThresholds: monitor.domainAlertThresholds,
      },
      latest,
      history: domainExpirations,
    });
  } catch (error) {
    console.error('Error fetching domain expiration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/monitors/:id/domain
 * Update domain monitoring settings for a monitor
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { checkDomain, domainAlertThresholds } = body;

    // Verify user has access and permission
    const monitor = await prisma.monitor.findFirst({
      where: {
        id,
        Org: {
          Membership: {
            some: {
              userId: session.user.id,
              role: { in: ['OWNER', 'ADMIN'] },
            },
          },
        },
      },
    });

    if (!monitor) {
      return NextResponse.json(
        { error: 'Monitor not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Validate alert thresholds
    if (domainAlertThresholds && !Array.isArray(domainAlertThresholds)) {
      return NextResponse.json(
        { error: 'domainAlertThresholds must be an array of numbers' },
        { status: 400 }
      );
    }

    if (domainAlertThresholds && domainAlertThresholds.some((t: any) => typeof t !== 'number' || t < 0)) {
      return NextResponse.json(
        { error: 'domainAlertThresholds must contain only positive numbers' },
        { status: 400 }
      );
    }

    // Update monitor
    const updated = await prisma.monitor.update({
      where: { id },
      data: {
        ...(typeof checkDomain === 'boolean' && { checkDomain }),
        ...(domainAlertThresholds && { domainAlertThresholds }),
      },
      select: {
        id: true,
        name: true,
        checkDomain: true,
        domainAlertThresholds: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating domain settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

