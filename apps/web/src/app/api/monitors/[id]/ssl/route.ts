import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

/**
 * GET /api/monitors/:id/ssl
 * Get SSL certificate status for a monitor
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
        checkSsl: true,
        sslAlertThresholds: true,
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Get SSL certificate records (latest first)
    const sslCertificates = await prisma.sslCertificate.findMany({
      where: {
        monitorId: id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 30, // Last 30 checks
    });

    const latest = sslCertificates[0] || null;

    return NextResponse.json({
      monitor: {
        id: monitor.id,
        name: monitor.name,
        checkSsl: monitor.checkSsl,
        sslAlertThresholds: monitor.sslAlertThresholds,
      },
      latest,
      history: sslCertificates,
    });
  } catch (error) {
    console.error('Error fetching SSL certificate:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/monitors/:id/ssl
 * Update SSL monitoring settings for a monitor
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
    const { checkSsl, sslAlertThresholds } = body;

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
    if (sslAlertThresholds && !Array.isArray(sslAlertThresholds)) {
      return NextResponse.json(
        { error: 'sslAlertThresholds must be an array of numbers' },
        { status: 400 }
      );
    }

    if (sslAlertThresholds && sslAlertThresholds.some((t: any) => typeof t !== 'number' || t < 0)) {
      return NextResponse.json(
        { error: 'sslAlertThresholds must contain only positive numbers' },
        { status: 400 }
      );
    }

    // Update monitor
    const updated = await prisma.monitor.update({
      where: { id },
      data: {
        ...(typeof checkSsl === 'boolean' && { checkSsl }),
        ...(sslAlertThresholds && { sslAlertThresholds }),
      },
      select: {
        id: true,
        name: true,
        checkSsl: true,
        sslAlertThresholds: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating SSL settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

