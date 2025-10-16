# Stripe Billing Integration

## Quick Setup

```bash
# 1. Install Stripe CLI
brew install stripe/stripe-cli/stripe

# 2. Login
stripe login

# 3. Run setup scripts
cd docs/stripe
./setup-stripe.sh
./create-stripe-products.sh

# 4. Start webhook listener (keep running during development)
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the whsec_... secret to .env
```

## Manual Setup

### 1. Get API Keys

1. Create account at https://dashboard.stripe.com
2. Enable **Test Mode** (toggle in dashboard)
3. Go to API Keys section
4. Copy Secret key (`sk_test_...`)
5. Add to `.env`:
```env
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
```

### 2. Create Products & Prices

```bash
# Pro Plan ($29/month)
stripe products create --name="Saturn Pro"
stripe prices create --product=prod_xxx --unit-amount=2900 --currency=usd --recurring[interval]=month

# Business Plan ($99/month)
stripe products create --name="Saturn Business"
stripe prices create --product=prod_yyy --unit-amount=9900 --currency=usd --recurring[interval]=month
```

Add price IDs to `.env`:
```env
STRIPE_PRICE_PRO=price_xxx
STRIPE_PRICE_BUSINESS=price_yyy
```

### 3. Configure Webhooks

**Development:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy signing secret to .env
```

**Production:**
1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://your-app.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret

```env
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Testing

### Test Checkout Flow

1. Start app: `make dev`
2. Login and go to Settings → Billing
3. Click "Upgrade to Pro"
4. Use test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify subscription created in Stripe dashboard

### Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0027 6000 3184

Any future expiry date and any 3-digit CVC.

### Test Scripts

```bash
cd docs/stripe
./test-stripe-api.sh        # Test API connection
./test-stripe-billing.sh    # Test full billing flow
./verify-stripe-setup.sh    # Verify configuration
```

## Pricing Tiers

| Tier | Price | Monitors | Features |
|------|-------|----------|----------|
| **Free** | $0 | 5 | Basic monitoring, email alerts |
| **Pro** | $29/mo | 100 | Anomaly detection, Discord, webhooks |
| **Business** | $99/mo | 500 | Kubernetes, WordPress, everything |

## Implementation

### Files
- `apps/web/src/app/api/stripe/*` - Checkout & customer portal
- `apps/web/src/app/api/webhooks/stripe/route.ts` - Webhook handler
- `apps/web/src/app/app/settings/billing/page.tsx` - Billing UI

### Webhook Events
- `checkout.session.completed` → Create subscription
- `customer.subscription.updated` → Update subscription
- `customer.subscription.deleted` → Cancel subscription

### Subscription Limits
Enforced in:
- Monitor creation (check `subscription.plan`)
- API endpoints (middleware)
- UI (conditional rendering)

## Production Deployment

1. Switch to **Live mode** in Stripe dashboard
2. Get live API keys (`sk_live_...`)
3. Create live products/prices
4. Configure production webhook: `https://your-app.com/api/webhooks/stripe`
5. Update environment variables with live keys
6. Test with real card (small amount, then refund)
7. Enable Stripe Radar (fraud protection)

## Troubleshooting

**Webhook not working:**
```bash
# Check webhook secret
stripe listen --print-secret

# Test webhook delivery
curl -X POST http://localhost:3000/api/webhooks/stripe

# View webhook logs
stripe logs tail
```

**Subscription not updating:**
- Verify `STRIPE_WEBHOOK_SECRET` matches
- Check webhook logs in Stripe dashboard
- Ensure endpoint returns 200 status
- Review application logs

**Test vs Live mode:**
- Test keys: `sk_test_...`, `pk_test_...`
- Live keys: `sk_live_...`, `pk_live_...`
- Keep them separate!
- Toggle mode in Stripe dashboard

## Resources

- Stripe Docs: https://stripe.com/docs
- Test Dashboard: https://dashboard.stripe.com/test
- Webhook Testing: `stripe trigger checkout.session.completed`
- CLI Reference: https://stripe.com/docs/stripe-cli
