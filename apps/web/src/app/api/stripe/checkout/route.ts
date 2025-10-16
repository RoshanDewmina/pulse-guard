import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { createCheckoutSession } from '@/lib/stripe';
import { z } from 'zod';

export const runtime = 'nodejs';

const checkoutSchema = z.object({
  orgId: z.string(),
  priceId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { orgId, priceId } = checkoutSchema.parse(body);

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
        SubscriptionPlan: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const checkoutSession = await createCheckoutSession({
      customerId: org.SubscriptionPlan?.stripeCustomerId || undefined,
      customerEmail: session.user.email!,
      priceId,
      successUrl: `${process.env.NEXTAUTH_URL}/app/settings/billing?success=true`,
      cancelUrl: `${process.env.NEXTAUTH_URL}/app/settings/billing?canceled=true`,
      metadata: {
        orgId,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Checkout session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

