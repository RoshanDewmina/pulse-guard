import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const createChannelSchema = z.object({
  orgId: z.string(),
  type: z.enum(['EMAIL', 'SLACK', 'DISCORD', 'WEBHOOK', 'PAGERDUTY', 'TEAMS', 'SMS']),
  label: z.string().min(1).max(100),
  configJson: z.record(z.any()),
  isDefault: z.boolean().default(false),
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

    const channels = await prisma.alertChannel.findMany({
      where: { orgId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ channels });
  } catch (error) {
    console.error('Get channels error:', error);
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
    const data = createChannelSchema.parse(body);

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

    // Check plan limits for webhook/Discord channels
    if (data.type === 'WEBHOOK' || data.type === 'DISCORD') {
      const org = await prisma.org.findUnique({
        where: { id: data.orgId },
        include: {
          SubscriptionPlan: true,
        },
      });

      if (!org?.SubscriptionPlan) {
        return NextResponse.json({ error: 'No subscription plan found' }, { status: 404 });
      }

      if (!(org.SubscriptionPlan as any).allowsWebhooks) {
        return NextResponse.json(
          { error: 'Webhook and Discord channels require Team plan or higher. Please upgrade your plan.' },
          { status: 403 }
        );
      }
    }

    const channel = await (prisma as any).alertChannel.create({
      data: {
        id: crypto.randomUUID(),
        updatedAt: new Date(),
        ...data,
      },
    });

    return NextResponse.json({ channel }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Create channel error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

