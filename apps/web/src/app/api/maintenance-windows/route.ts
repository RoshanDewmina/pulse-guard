import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

const createMaintenanceWindowSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
});

/**
 * GET /api/maintenance-windows
 * Get all maintenance windows for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

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

    const maintenanceWindows = await prisma.maintenanceWindow.findMany({
      where: { orgId },
      orderBy: { startAt: 'desc' },
    });

    return NextResponse.json(maintenanceWindows);
  } catch (error) {
    console.error('Error fetching maintenance windows:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/maintenance-windows
 * Create a new maintenance window
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, startAt, endAt } = createMaintenanceWindowSchema.parse(body);

    // Get user's primary organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { Org: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Validate dates
    const startDate = new Date(startAt);
    const endDate = new Date(endAt);
    
    if (startDate >= endDate) {
      return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
    }

    if (startDate < new Date()) {
      return NextResponse.json({ error: 'Start time cannot be in the past' }, { status: 400 });
    }

    // Check for overlapping maintenance windows
    const overlapping = await prisma.maintenanceWindow.findFirst({
      where: {
        orgId: membership.orgId,
        OR: [
          {
            startAt: { lte: endDate },
            endAt: { gte: startDate },
          },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json({ 
        error: 'Maintenance window overlaps with existing window',
        details: `Overlaps with "${overlapping.name}" (${overlapping.startAt.toISOString()} - ${overlapping.endAt.toISOString()})`
      }, { status: 400 });
    }

    const maintenanceWindow = await prisma.maintenanceWindow.create({
      data: {
        orgId: membership.orgId,
        name,
        description,
        startAt: startDate,
        endAt: endDate,
        updatedAt: new Date(),
      },
    });

    // Log maintenance window creation
    const { createAuditLog, AuditAction } = await import('@/lib/audit');
    await createAuditLog({
      action: AuditAction.MAINTENANCE_WINDOW_CREATED,
      orgId: membership.orgId,
      userId: session.user.id,
      targetId: maintenanceWindow.id,
      meta: { 
        name: maintenanceWindow.name,
        startAt: maintenanceWindow.startAt.toISOString(),
        endAt: maintenanceWindow.endAt.toISOString(),
      },
    });

    return NextResponse.json(maintenanceWindow, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance window:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
