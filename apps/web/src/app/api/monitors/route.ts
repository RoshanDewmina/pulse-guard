import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma, generateToken } from '@tokiflow/db';
import { calculateNextDueAt } from '@/lib/schedule';
import { z } from 'zod';

export const runtime = 'nodejs';

const createMonitorSchema = z.object({
  orgId: z.string(),
  name: z.string().min(1).max(100),
  scheduleType: z.enum(['INTERVAL', 'CRON']),
  intervalSec: z.number().int().positive().optional(),
  cronExpr: z.string().optional(),
  timezone: z.string().default('UTC'),
  graceSec: z.number().int().positive().default(300),
  tags: z.array(z.string()).default([]),
  captureOutput: z.boolean().default(false),
  captureLimitKb: z.number().int().positive().default(32),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: session.user.id,
          orgId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const where: any = { orgId };
    if (status) {
      where.status = status;
    }

    const monitors = await prisma.monitor.findMany({
      where,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        _count: {
          select: {
            Run: true,
            Incident: {
              where: {
                status: { in: ['OPEN', 'ACKED'] },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ monitors });
  } catch (error) {
    console.error('Get monitors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createMonitorSchema.parse(body);

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: session.user.id,
          orgId: data.orgId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check plan limits
    const org = await prisma.org.findUnique({
      where: { id: data.orgId },
      include: {
        SubscriptionPlan: true,
        _count: {
          select: { Monitor: true },
        },
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const monitorLimit = org.SubscriptionPlan?.monitorLimit || 5;
    if (org._count.Monitor >= monitorLimit) {
      return NextResponse.json(
        { error: `Monitor limit reached (${monitorLimit}). Please upgrade your plan.` },
        { status: 403 }
      );
    }

    // Validate schedule
    if (data.scheduleType === 'INTERVAL' && !data.intervalSec) {
      return NextResponse.json(
        { error: 'intervalSec is required for INTERVAL schedule' },
        { status: 400 }
      );
    }

    if (data.scheduleType === 'CRON' && !data.cronExpr) {
      return NextResponse.json(
        { error: 'cronExpr is required for CRON schedule' },
        { status: 400 }
      );
    }

    // Calculate initial nextDueAt
    const nextDueAt = calculateNextDueAt({
      scheduleType: data.scheduleType,
      intervalSec: data.intervalSec,
      cronExpr: data.cronExpr,
      timezone: data.timezone,
    });

    // Generate unique token
    const token = generateToken('pg');

    const monitor = await prisma.monitor.create({
      data: {
        id: crypto.randomUUID(),
        ...data,
        token,
        nextDueAt,
        status: 'OK',
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
          id: crypto.randomUUID(),
        orgId: data.orgId,
        userId: session.user.id,
        action: 'monitor.created',
        targetId: monitor.id,
        meta: {
          name: monitor.name,
        },
      },
    });

    return NextResponse.json({ monitor }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Create monitor error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

