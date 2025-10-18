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

  // Determine plan based on price ID
  let plan = 'FREE';
  let planConfig = PLANS.FREE;

  if (session.line_items?.data?.[0]?.price?.id) {
    const priceId = session.line_items.data[0].price.id;
    
    if (priceId === PLANS.DEVELOPER.priceId) {
      plan = 'DEVELOPER';
      planConfig = PLANS.DEVELOPER;
    } else if (priceId === PLANS.TEAM.priceId) {
      plan = 'TEAM';
      planConfig = PLANS.TEAM;
    } else if (priceId === PLANS.BUSINESS.priceId) {
      plan = 'BUSINESS';
      planConfig = PLANS.BUSINESS;
    }
  }

  await prisma.subscriptionPlan.upsert({
    where: { orgId },
    create: {
      id: crypto.randomUUID(),
      orgId,
      stripeCustomerId: customerId,
      stripeSubId: subscriptionId,
      plan,
      monitorLimit: planConfig.monitorLimit,
      userLimit: planConfig.userLimit,
      statusPageLimit: planConfig.statusPageLimit,
      syntheticRunsLimit: planConfig.syntheticRunsLimit,
      syntheticRunsUsed: 0,
      retentionDays: planConfig.retentionDays,
      minIntervalSec: planConfig.minIntervalSec,
      allowsWebhooks: planConfig.allowsWebhooks,
      allowsCustomDomains: planConfig.allowsCustomDomains,
      allowsSso: planConfig.allowsSso,
      allowsAuditLogs: planConfig.allowsAuditLogs,
      updatedAt: new Date(),
    },
    update: {
      stripeCustomerId: customerId,
      stripeSubId: subscriptionId,
      plan,
      monitorLimit: planConfig.monitorLimit,
      userLimit: planConfig.userLimit,
      statusPageLimit: planConfig.statusPageLimit,
      syntheticRunsLimit: planConfig.syntheticRunsLimit,
      syntheticRunsUsed: 0,
      retentionDays: planConfig.retentionDays,
      minIntervalSec: planConfig.minIntervalSec,
      allowsWebhooks: planConfig.allowsWebhooks,
      allowsCustomDomains: planConfig.allowsCustomDomains,
      allowsSso: planConfig.allowsSso,
      allowsAuditLogs: planConfig.allowsAuditLogs,
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
    
    let plan = 'FREE';
    let planConfig = PLANS.FREE;

    if (priceId === PLANS.DEVELOPER.priceId) {
      plan = 'DEVELOPER';
      planConfig = PLANS.DEVELOPER;
    } else if (priceId === PLANS.TEAM.priceId) {
      plan = 'TEAM';
      planConfig = PLANS.TEAM;
    } else if (priceId === PLANS.BUSINESS.priceId) {
      plan = 'BUSINESS';
      planConfig = PLANS.BUSINESS;
    }

    await prisma.subscriptionPlan.update({
      where: { id: subscriptionPlan.id },
      data: {
        plan,
        monitorLimit: planConfig.monitorLimit,
        userLimit: planConfig.userLimit,
        statusPageLimit: planConfig.statusPageLimit,
        syntheticRunsLimit: planConfig.syntheticRunsLimit,
        retentionDays: planConfig.retentionDays,
        minIntervalSec: planConfig.minIntervalSec,
        allowsWebhooks: planConfig.allowsWebhooks,
        allowsCustomDomains: planConfig.allowsCustomDomains,
        allowsSso: planConfig.allowsSso,
        allowsAuditLogs: planConfig.allowsAuditLogs,
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
      statusPageLimit: PLANS.FREE.statusPageLimit,
      syntheticRunsLimit: PLANS.FREE.syntheticRunsLimit,
      syntheticRunsUsed: 0,
      retentionDays: PLANS.FREE.retentionDays,
      minIntervalSec: PLANS.FREE.minIntervalSec,
      allowsWebhooks: PLANS.FREE.allowsWebhooks,
      allowsCustomDomains: PLANS.FREE.allowsCustomDomains,
      allowsSso: PLANS.FREE.allowsSso,
      allowsAuditLogs: PLANS.FREE.allowsAuditLogs,
      stripeSubId: null,
    },
  });

  console.log(`Subscription cancelled for org ${subscriptionPlan.orgId}, downgraded to FREE`);
}

