import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { createCustomerPortalSession } from '@/lib/stripe';
import { z } from 'zod';

export const runtime = 'nodejs';

const portalSchema = z.object({
  orgId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId } = portalSchema.parse(body);

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: session.user.id,
          orgId,
        },
      },
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const org = await prisma.org.findUnique({
      where: { id: orgId },
      include: {
        subscriptionPlan: true,
      },
    });

    if (!org?.subscriptionPlan?.stripeCustomerId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    const portalSession = await createCustomerPortalSession(
      org.subscriptionPlan.stripeCustomerId,
      `${process.env.NEXTAUTH_URL}/app/settings/billing`
    );

    return NextResponse.json({ url: portalSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Customer portal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

