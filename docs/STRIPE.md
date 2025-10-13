# Stripe Integration Guide

Complete guide for setting up Stripe billing in Tokiflow.

## Quick Setup (Automated)

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe
# Or: https://stripe.com/docs/stripe-cli

# 2. Login
stripe login

# 3. Run automated setup
cd docs/stripe
./setup-stripe.sh
./create-stripe-products.sh

# 4. Start webhook listener (keep running)
stripe listen --forward-to localhost:3000/api/stripe/webhook
# Copy the whsec_... secret to .env as STRIPE_WEBHOOK_SECRET
```

## Manual Setup

### 1. Get API Keys

1. Create account at [dashboard.stripe.com](https://dashboard.stripe.com/register)
2. Enable **Test Mode** (toggle in top right)
3. Go to [API Keys](https://dashboard.stripe.com/test/apikeys)
4. Copy **Secret key** (`sk_test_...`)
5. Add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ```

### 2. Create Products

#### Pro Plan ($19/month)
```bash
stripe products create \
  --name="Tokiflow Pro" \
  --description="Professional plan with up to 100 monitors"

stripe prices create \
  --product=prod_xxx \
  --unit-amount=1900 \
  --currency=usd \
  --recurring[interval]=month
```

Copy the `price_xxx` and add to `.env`:
```env
STRIPE_PRICE_PRO=price_xxx
```

#### Business Plan ($49/month)
```bash
stripe products create \
  --name="Tokiflow Business" \
  --description="Business plan with up to 500 monitors"

stripe prices create \
  --product=prod_yyy \
  --unit-amount=4900 \
  --currency=usd \
  --recurring[interval]=month
```

Add to `.env`:
```env
STRIPE_PRICE_BUSINESS=price_yyy
```

### 3. Setup Webhooks

**For Local Development:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**For Production:**
1. Go to [Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://yourdomain.com/api/stripe/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy **Signing secret** to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## Testing

```bash
# Test API connection
cd docs/stripe
./test-stripe-api.sh

# Test billing flow (requires running app)
./test-stripe-billing.sh
```

### Manual Testing

1. Start app: `make dev`
2. Login at http://localhost:3000
3. Go to Settings → Billing
4. Click "Upgrade to Pro"
5. Use test card: `4242 4242 4242 4242`
6. Expiry: Any future date, CVC: Any 3 digits
7. Complete checkout
8. Verify subscription in Stripe dashboard

### Test Cards

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

## Pricing Tiers

| Tier | Price | Monitors | Users | History |
|------|-------|----------|-------|---------|
| Free | $0 | 5 | 3 | 7 days |
| Pro | $19/mo | 100 | 10 | 90 days |
| Business | $49/mo | 500 | Unlimited | 365 days |

## Implementation Details

### Checkout Flow
1. User clicks "Upgrade" button
2. API creates Stripe Checkout Session
3. User redirected to Stripe hosted checkout
4. On success, redirected back to app
5. Webhook updates subscription in database

### Webhook Events Handled
- `checkout.session.completed` - New subscription
- `customer.subscription.updated` - Plan change/renewal
- `customer.subscription.deleted` - Cancellation

### Subscription Enforcement
Limits enforced in:
- `/api/monitors` - Monitor creation
- `/api/incidents` - Incident access
- Dashboard - UI controls

## Production Checklist

- [ ] Switch to Live mode in Stripe
- [ ] Get live API keys (`sk_live_...`)
- [ ] Create live products/prices
- [ ] Setup production webhook endpoint
- [ ] Test with real card (then refund)
- [ ] Enable Stripe Radar for fraud protection
- [ ] Configure email receipts
- [ ] Set up tax collection (Stripe Tax)

## Troubleshooting

**Webhook not receiving events:**
```bash
# Check webhook secret matches
stripe listen --forward-to localhost:3000/api/stripe/webhook --print-secret

# Check endpoint is accessible
curl -X POST http://localhost:3000/api/stripe/webhook
```

**Subscription not updating:**
- Check webhook logs in Stripe dashboard
- Verify webhook secret in `.env`
- Check server logs for errors
- Ensure webhook endpoint returns 200 status

**Test mode vs Live mode:**
- Test keys start with `sk_test_` and `pk_test_`
- Live keys start with `sk_live_` and `pk_live_`
- Keep them separate!

## Scripts Available

All scripts located in `docs/stripe/`:

- `setup-stripe.sh` - Initial Stripe CLI setup
- `create-stripe-products.sh` - Create products/prices
- `verify-stripe-setup.sh` - Verify configuration
- `test-stripe-api.sh` - Test API connection
- `test-stripe-billing.sh` - Test billing flow

## Support

- Stripe Docs: https://stripe.com/docs
- Test Mode: https://dashboard.stripe.com/test/dashboard
- Webhook Testing: `stripe trigger checkout.session.completed`

