import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const createRuleSchema = z.object({
  orgId: z.string(),
  name: z.string().min(1).max(100),
  monitorIds: z.array(z.string()).default([]),
  channelIds: z.array(z.string()).min(1, 'At least one channel is required'),
  suppressMinutes: z.number().int().positive().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

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

    const rules = await prisma.rule.findMany({
      where: { orgId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Get rules error:', error);
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
    const data = createRuleSchema.parse(body);

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: session.user.id,
          orgId: data.orgId,
        },
      },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Verify channels exist
    const channels = await prisma.alertChannel.findMany({
      where: {
        id: { in: data.channelIds },
        orgId: data.orgId,
      },
    });

    if (channels.length !== data.channelIds.length) {
      return NextResponse.json(
        { error: 'One or more channels not found' },
        { status: 400 }
      );
    }

    // Verify monitors exist (if specified)
    if (data.monitorIds.length > 0) {
      const monitors = await prisma.monitor.findMany({
        where: {
          id: { in: data.monitorIds },
          orgId: data.orgId,
        },
      });

      if (monitors.length !== data.monitorIds.length) {
        return NextResponse.json(
          { error: 'One or more monitors not found' },
          { status: 400 }
        );
      }
    }

    const rule = await prisma.rule.create({
      data,
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Create rule error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

