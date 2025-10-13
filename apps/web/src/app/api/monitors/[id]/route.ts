import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

// GET /api/monitors/:id - Get monitor details
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

    const monitor = await prisma.monitor.findFirst({
      where: {
        id,
        org: {
          memberships: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      include: {
        org: true,
        runs: {
          take: 20,
          orderBy: { startedAt: 'desc' },
        },
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json(monitor);
  } catch (error) {
    console.error('Error fetching monitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/monitors/:id - Update monitor
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

    // TODO: Implement full validation and update logic
    // For now, this is a placeholder that returns success

    // Verify user has access to this monitor
    const monitor = await prisma.monitor.findFirst({
      where: {
        id,
        org: {
          memberships: {
            some: {
              userId: session.user.id,
              role: { in: ['OWNER', 'ADMIN'] }, // Only owners/admins can edit
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

    // TODO: Validate input data
    // TODO: Update monitor fields
    // TODO: Handle schedule changes
    // TODO: Update grace period
    // TODO: Handle output capture settings

    const updatedMonitor = await prisma.monitor.update({
      where: { id },
      data: {
        name: body.name || monitor.name,
        graceSec: body.graceSec || monitor.graceSec,
        captureOutput: body.captureOutput ?? monitor.captureOutput,
        captureLimitKb: body.captureLimitKb || monitor.captureLimitKb,
        // TODO: Add more fields as needed
      },
    });

    return NextResponse.json(updatedMonitor);
  } catch (error) {
    console.error('Error updating monitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/monitors/:id - Delete monitor
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Verify user has access and is owner/admin
    const monitor = await prisma.monitor.findFirst({
      where: {
        id,
        org: {
          memberships: {
            some: {
              userId: session.user.id,
              role: { in: ['OWNER', 'ADMIN'] },
            },
          },
        },
      },
      include: {
        _count: {
          select: {
            runs: true,
            incidents: true,
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

    // TODO: Add confirmation check (require explicit confirmation in request body)
    // TODO: Archive monitor instead of hard delete (optional)
    // TODO: Clean up associated S3 objects (run outputs)
    // TODO: Send notification to team about deletion

    // Delete monitor (cascades to runs, incidents, etc.)
    await prisma.monitor.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Monitor "${monitor.name}" deleted successfully`,
      deletedCounts: {
        runs: monitor._count.runs,
        incidents: monitor._count.incidents,
      },
    });
  } catch (error) {
    console.error('Error deleting monitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
