import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

/**
 * GET /api/synthetic/:id
 * Get a specific synthetic monitor with its steps and recent runs
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

    // Get monitor with access check
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
        SyntheticStep: {
          orderBy: {
            order: 'asc',
          },
        },
        SyntheticRun: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 20, // Last 20 runs
          include: {
            SyntheticStepResult: {
              include: {
                SyntheticStep: true,
              },
            },
          },
        },
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    return NextResponse.json(monitor);
  } catch (error) {
    console.error('Error fetching synthetic monitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/synthetic/:id
 * Update a synthetic monitor
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

    // Verify access and permissions
    const monitor = await prisma.syntheticMonitor.findFirst({
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

    const body = await request.json();
    const {
      name,
      url,
      description,
      isEnabled,
      intervalMinutes,
      timeout,
      viewport,
      userAgent,
      headers,
      cookies,
      steps,
    } = body;

    // Update monitor
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (url !== undefined) updateData.url = url;
    if (description !== undefined) updateData.description = description;
    if (isEnabled !== undefined) updateData.isEnabled = isEnabled;
    if (intervalMinutes !== undefined) updateData.intervalMinutes = intervalMinutes;
    if (timeout !== undefined) updateData.timeout = timeout;
    if (viewport !== undefined) updateData.viewport = viewport;
    if (userAgent !== undefined) updateData.userAgent = userAgent;
    if (headers !== undefined) updateData.headers = headers;
    if (cookies !== undefined) updateData.cookies = cookies;

    // If steps are provided, replace all steps
    if (steps && Array.isArray(steps)) {
      // Delete existing steps
      await prisma.syntheticStep.deleteMany({
        where: { syntheticMonitorId: id },
      });

      // Create new steps
      updateData.SyntheticStep = {
        create: steps.map((step: any, index: number) => ({
          order: index,
          type: step.type,
          label: step.label,
          selector: step.selector,
          value: step.value,
          url: step.url,
          timeout: step.timeout || 5000,
          screenshot: step.screenshot || false,
          optional: step.optional || false,
        })),
      };
    }

    const updated = await prisma.syntheticMonitor.update({
      where: { id },
      data: updateData,
      include: {
        SyntheticStep: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating synthetic monitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/synthetic/:id
 * Delete a synthetic monitor
 */
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

    // Verify access and permissions
    const monitor = await prisma.syntheticMonitor.findFirst({
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

    // Delete monitor (cascades to steps and runs)
    await prisma.syntheticMonitor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting synthetic monitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

