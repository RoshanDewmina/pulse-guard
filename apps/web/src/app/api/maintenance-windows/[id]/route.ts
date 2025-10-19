import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

const updateMaintenanceWindowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/maintenance-windows/[id]
 * Get a specific maintenance window
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const maintenanceWindow = await prisma.maintenanceWindow.findUnique({
      where: { id },
      include: {
        Org: {
          include: {
            Membership: {
              where: { userId: session.user.id },
            },
          },
        },
        Incidents: {
          include: {
            Monitor: true,
          },
        },
      },
    });

    if (!maintenanceWindow) {
      return NextResponse.json({ error: 'Maintenance window not found' }, { status: 404 });
    }

    if (maintenanceWindow.Org.Membership.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(maintenanceWindow);
  } catch (error) {
    console.error('Error fetching maintenance window:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/maintenance-windows/[id]
 * Update a maintenance window
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const updates = updateMaintenanceWindowSchema.parse(body);

    // Get existing maintenance window and verify access
    const existing = await prisma.maintenanceWindow.findUnique({
      where: { id },
      include: {
        Org: {
          include: {
            Membership: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Maintenance window not found' }, { status: 404 });
    }

    if (existing.Org.Membership.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name;
    }

    if (updates.description !== undefined) {
      updateData.description = updates.description;
    }

    if (updates.isActive !== undefined) {
      updateData.isActive = updates.isActive;
    }

    if (updates.startAt !== undefined || updates.endAt !== undefined) {
      const startDate = updates.startAt ? new Date(updates.startAt) : existing.startAt;
      const endDate = updates.endAt ? new Date(updates.endAt) : existing.endAt;

      if (startDate >= endDate) {
        return NextResponse.json({ error: 'End time must be after start time' }, { status: 400 });
      }

      updateData.startAt = startDate;
      updateData.endAt = endDate;

      // Check for overlapping maintenance windows (excluding current one)
      const overlapping = await prisma.maintenanceWindow.findFirst({
        where: {
          id: { not: id },
          orgId: existing.orgId,
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
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    updateData.updatedAt = new Date();

    const updated = await prisma.maintenanceWindow.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating maintenance window:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/maintenance-windows/[id]
 * Delete a maintenance window
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get maintenance window and verify access
    const maintenanceWindow = await prisma.maintenanceWindow.findUnique({
      where: { id },
      include: {
        Org: {
          include: {
            Membership: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!maintenanceWindow) {
      return NextResponse.json({ error: 'Maintenance window not found' }, { status: 404 });
    }

    if (maintenanceWindow.Org.Membership.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if maintenance window is currently active
    const now = new Date();
    if (maintenanceWindow.isActive && maintenanceWindow.startAt <= now && maintenanceWindow.endAt >= now) {
      return NextResponse.json({ 
        error: 'Cannot delete active maintenance window',
        details: 'Please end the maintenance window before deleting it'
      }, { status: 400 });
    }

    await prisma.maintenanceWindow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting maintenance window:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
