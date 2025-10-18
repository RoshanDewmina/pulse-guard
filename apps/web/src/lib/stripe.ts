import Stripe from 'stripe';

// Use a placeholder key during build if not set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: 'Free (Dev)',
    price: 0,
    monitorLimit: 10,
    userLimit: 3,
    statusPageLimit: 1,
    syntheticRunsLimit: 200,
    retentionDays: 30,
    minIntervalSec: 600, // 10 minutes
    allowsWebhooks: false,
    allowsCustomDomains: false,
    allowsSso: false,
    allowsAuditLogs: false,
    features: [
      'Up to 10 monitors',
      'Up to 3 team members',
      '10-min minimum interval',
      '30-day retention',
      '1 status page',
      '200 synthetic runs/mo',
      'Email + Slack alerts',
    ],
  },
  DEVELOPER: {
    name: 'Developer',
    price: 19,
    priceId: process.env.STRIPE_PRICE_DEVELOPER!,
    monitorLimit: 25,
    userLimit: 5,
    statusPageLimit: 2,
    syntheticRunsLimit: 1000,
    retentionDays: 90,
    minIntervalSec: 60, // 1 minute
    allowsWebhooks: false,
    allowsCustomDomains: false,
    allowsSso: false,
    allowsAuditLogs: false,
    features: [
      'Up to 25 monitors',
      'Up to 5 team members',
      '1-min checks',
      '90-day retention',
      '2 status pages',
      '1,000 synthetic runs/mo',
      'All alert channels',
    ],
  },
  TEAM: {
    name: 'Team',
    price: 39,
    priceId: process.env.STRIPE_PRICE_TEAM!,
    monitorLimit: 100,
    userLimit: 10,
    statusPageLimit: 5,
    syntheticRunsLimit: 5000,
    retentionDays: 180,
    minIntervalSec: 60, // 1 minute
    allowsWebhooks: true,
    allowsCustomDomains: false,
    allowsSso: false,
    allowsAuditLogs: false,
    features: [
      'Up to 100 monitors',
      'Up to 10 team members',
      '1-min checks',
      '180-day retention',
      '5 status pages',
      '5,000 synthetic runs/mo',
      'Slack/Discord/Webhooks',
      'Routing rules',
    ],
  },
  BUSINESS: {
    name: 'Business',
    price: 99,
    priceId: process.env.STRIPE_PRICE_BUSINESS!,
    monitorLimit: 300,
    userLimit: 999,
    statusPageLimit: -1, // Unlimited
    syntheticRunsLimit: 20000,
    retentionDays: 365,
    minIntervalSec: 60, // 1 minute
    allowsWebhooks: true,
    allowsCustomDomains: true,
    allowsSso: true,
    allowsAuditLogs: true,
    features: [
      'Up to 300 monitors',
      'Unlimited team members',
      '1-min checks',
      '1-year retention',
      'Unlimited status pages',
      '20,000 synthetic runs/mo',
      'All Team features',
      'SSO/SAML',
      'Custom domains',
      'Audit logs',
      'Premium support',
    ],
  },
};

export async function createCheckoutSession(params: {
  customerId?: string;
  customerEmail: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const { customerId, customerEmail, priceId, successUrl, cancelUrl, metadata } = params;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    customer_email: customerId ? undefined : customerEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
  });

  return session;
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

export async function constructWebhookEvent(
  body: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

