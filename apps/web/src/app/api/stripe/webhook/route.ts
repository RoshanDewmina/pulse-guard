import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';
import { constructWebhookEvent, PLANS } from '@/lib/stripe';
import Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const event = await constructWebhookEvent(body, signature);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { orgId } = session.metadata as { orgId: string };

  if (!orgId) {
    console.error('No orgId in checkout session metadata');
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Determine plan based on price
  let plan = 'PRO';
  let monitorLimit = PLANS.PRO.monitorLimit;
  let userLimit = PLANS.PRO.userLimit;

  if (session.amount_total === PLANS.BUSINESS.price * 100) {
    plan = 'BUSINESS';
    monitorLimit = PLANS.BUSINESS.monitorLimit;
    userLimit = PLANS.BUSINESS.userLimit;
  }

  await prisma.subscriptionPlan.upsert({
    where: { orgId },
    create: {
      id: crypto.randomUUID(),
      orgId,
      stripeCustomerId: customerId,
      stripeSubId: subscriptionId,
      plan,
      monitorLimit,
      userLimit,
      updatedAt: new Date(),
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubId: subscriptionId,
      plan,
      monitorLimit,
      userLimit,
      updatedAt: new Date(),
    },
  });

  console.log(`Subscription created for org ${orgId}: ${plan}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
    where: { stripeSubId: subscription.id },
  });

  if (!subscriptionPlan) {
    console.error(`No subscription plan found for ${subscription.id}`);
    return;
  }

  // Update plan limits based on subscription status
  if (subscription.status === 'active') {
    const priceId = subscription.items.data[0]?.price.id;
    
    let plan = 'PRO';
    let monitorLimit = PLANS.PRO.monitorLimit;
    let userLimit = PLANS.PRO.userLimit;

    if (priceId === PLANS.BUSINESS.priceId) {
      plan = 'BUSINESS';
      monitorLimit = PLANS.BUSINESS.monitorLimit;
      userLimit = PLANS.BUSINESS.userLimit;
    }

    await prisma.subscriptionPlan.update({
      where: { id: subscriptionPlan.id },
      data: {
        plan,
        monitorLimit,
        userLimit,
      },
    });

    console.log(`Subscription updated for org ${subscriptionPlan.orgId}: ${plan}`);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const subscriptionPlan = await prisma.subscriptionPlan.findUnique({
    where: { stripeSubId: subscription.id },
  });

  if (!subscriptionPlan) {
    console.error(`No subscription plan found for ${subscription.id}`);
    return;
  }

  // Downgrade to free plan
  await prisma.subscriptionPlan.update({
    where: { id: subscriptionPlan.id },
    data: {
      plan: 'FREE',
      monitorLimit: PLANS.FREE.monitorLimit,
      userLimit: PLANS.FREE.userLimit,
      stripeSubId: null,
    },
  });

  console.log(`Subscription cancelled for org ${subscriptionPlan.orgId}, downgraded to FREE`);
}

