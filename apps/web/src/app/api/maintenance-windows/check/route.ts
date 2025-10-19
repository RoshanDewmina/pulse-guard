import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

/**
 * GET /api/maintenance-windows/check
 * Check if any monitors are currently in maintenance windows
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const monitorId = searchParams.get('monitorId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Verify user has access to this org
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        orgId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const now = new Date();

    // Find active maintenance windows
    const activeMaintenanceWindows = await prisma.maintenanceWindow.findMany({
      where: {
        orgId,
        isActive: true,
        startAt: { lte: now },
        endAt: { gte: now },
      },
      include: {
        Incidents: {
          where: monitorId ? { monitorId } : undefined,
          include: {
            Monitor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // If checking for a specific monitor
    if (monitorId) {
      const monitorInMaintenance = activeMaintenanceWindows.some(window => 
        window.Incidents.some(incident => incident.monitorId === monitorId)
      );

      return NextResponse.json({
        inMaintenance: monitorInMaintenance,
        maintenanceWindows: activeMaintenanceWindows.filter(window => 
          window.Incidents.some(incident => incident.monitorId === monitorId)
        ),
      });
    }

    // Return all active maintenance windows
    return NextResponse.json({
      activeMaintenanceWindows,
      count: activeMaintenanceWindows.length,
    });
  } catch (error) {
    console.error('Error checking maintenance windows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
