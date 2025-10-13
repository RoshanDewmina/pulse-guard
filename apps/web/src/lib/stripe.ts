import Stripe from 'stripe';

// Use a placeholder key during build if not set
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build';

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
});

export const PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    monitorLimit: 5,
    userLimit: 3,
    features: [
      'Up to 5 monitors',
      'Up to 3 team members',
      'Email + Slack alerts',
      '7-day run history retention',
    ],
  },
  PRO: {
    name: 'Pro',
    price: 19,
    priceId: process.env.STRIPE_PRICE_PRO!,
    monitorLimit: 100,
    userLimit: 10,
    features: [
      'Up to 100 monitors',
      'Up to 10 team members',
      'All alert channels (Discord, Webhooks)',
      'Output capture & analysis',
      '90-day run history retention',
      'Runtime anomaly detection',
    ],
  },
  BUSINESS: {
    name: 'Business',
    price: 49,
    priceId: process.env.STRIPE_PRICE_BUSINESS!,
    monitorLimit: 500,
    userLimit: 999,
    features: [
      'Up to 500 monitors',
      'Unlimited team members',
      'All Pro features',
      'Priority support',
      '365-day run history retention',
      'Advanced analytics',
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

