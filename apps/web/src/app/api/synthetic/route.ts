import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

/**
 * GET /api/synthetic
 * List all synthetic monitors for the user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        orgId: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get all synthetic monitors for this org
    const monitors = await prisma.syntheticMonitor.findMany({
      where: {
        orgId: membership.orgId,
      },
      include: {
        SyntheticStep: {
          orderBy: {
            order: 'asc',
          },
        },
        _count: {
          select: {
            SyntheticRun: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(monitors);
  } catch (error) {
    console.error('Error fetching synthetic monitors:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/synthetic
 * Create a new synthetic monitor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] },
      },
      select: {
        orgId: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
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

    // Validation
    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json(
        { error: 'At least one step is required' },
        { status: 400 }
      );
    }

    // Create monitor with steps
    const monitor = await prisma.syntheticMonitor.create({
      data: {
        orgId: membership.orgId,
        name,
        url,
        description,
        isEnabled: isEnabled !== undefined ? isEnabled : true,
        intervalMinutes: intervalMinutes || 5,
        timeout: timeout || 30000,
        viewport,
        userAgent,
        headers,
        cookies,
        SyntheticStep: {
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
        },
      },
      include: {
        SyntheticStep: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return NextResponse.json(monitor, { status: 201 });
  } catch (error) {
    console.error('Error creating synthetic monitor:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

