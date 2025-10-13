# Vercel Deployment Guide

Deploy Tokiflow to Vercel in under 15 minutes.

## Prerequisites

- Vercel account (free tier works)
- GitHub repository with Tokiflow code
- Database (Supabase recommended)
- Email service (Resend recommended)

## Step 1: Prepare Your Repository

```bash
# Ensure your code is pushed to GitHub
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## Step 2: Import Project to Vercel

### Via Vercel Dashboard

1. Go to https://vercel.com/new
2. Click "Import" next to your GitHub repository
3. Select "pulse-guard" repository
4. Framework Preset: **Next.js** (auto-detected)
5. Root Directory: `apps/web`
6. Click **"Deploy"** (first deployment will fail - that's okay, we need to add env vars)

### Via Vercel CLI (Alternative)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd apps/web
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your username/org
# - Link to existing project? No
# - Project name: tokiflow (or your choice)
# - Directory: ./
# - Override settings? No
```

## Step 3: Configure Environment Variables

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

### Required Variables

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Email (Resend)
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# Storage (S3/R2/Supabase)
S3_REGION=us-east-1
S3_ENDPOINT=https://your-project.supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=your_access_key
S3_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET=pulseguard-outputs
S3_FORCE_PATH_STYLE=true

# Redis (Upstash)
REDIS_URL=redis://default:[PASSWORD]@your-host.upstash.io:6379

# Sentry (Error Tracking)
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[project]
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=tokiflow-web
SENTRY_AUTH_TOKEN=your_auth_token

# Stripe (Billing)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PRICE_PRO=price_your_pro_price_id
STRIPE_PRICE_BUSINESS=price_your_business_price_id

# Slack (Optional)
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
SLACK_SIGNING_SECRET=your_signing_secret

# Site
SITE_URL=https://your-domain.vercel.app
```

### Add Variables in Vercel

1. Click "Add New" for each variable
2. Select environments: **Production**, **Preview**, **Development**
3. Save

### Quick Add Script

```bash
# Using Vercel CLI (faster)
vercel env add NEXTAUTH_SECRET
# Paste value when prompted
# Select: Production, Preview, Development

# Repeat for all variables...
```

## Step 4: Run Database Migrations

```bash
# Install dependencies
cd packages/db
npm install

# Run migrations against Supabase
DATABASE_URL="your-supabase-url" npx prisma migrate deploy

# Seed database
DATABASE_URL="your-supabase-url" npx prisma db seed
```

## Step 5: Redeploy

After adding environment variables:

### Via Dashboard
1. Go to Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

### Via CLI
```bash
cd apps/web
vercel --prod
```

## Step 6: Configure Custom Domain (Optional)

### Add Domain

1. Go to Project Settings → Domains
2. Add your domain: `tokiflow.co`
3. Configure DNS:

```
# For root domain
A     @     76.76.21.21

# Or use CNAME
CNAME @     cname.vercel-dns.com

# For www subdomain
CNAME www   cname.vercel-dns.com
```

### Update Environment Variables

After domain is configured:

```bash
vercel env rm NEXTAUTH_URL production
vercel env add NEXTAUTH_URL production
# Enter: https://tokiflow.co

vercel env rm SITE_URL production
vercel env add SITE_URL production
# Enter: https://tokiflow.co

# Redeploy
vercel --prod
```

### Update OAuth Redirect URIs

1. Google OAuth Console:
   - Add redirect URI: `https://tokiflow.co/api/auth/callback/google`

2. Slack App Settings (if using):
   - Add redirect URI: `https://tokiflow.co/api/slack/callback`
   - Update request URLs

3. Stripe Webhook:
   - Add endpoint: `https://tokiflow.co/api/stripe/webhook`

## Step 7: Deploy Worker

The worker handles background jobs (alerts, emails, etc.)

### Option A: Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Create project
railway init

# Link to project
cd apps/worker

# Add environment variables (same as web app)
railway variables set DATABASE_URL="your-db-url"
railway variables set REDIS_URL="your-redis-url"
railway variables set RESEND_API_KEY="your-api-key"
railway variables set SENTRY_DSN="your-sentry-dsn"
# ... add all required variables

# Deploy
railway up
```

### Option B: Render

1. Go to https://render.com/dashboard
2. Click "New +" → "Web Service"
3. Connect GitHub repository
4. Settings:
   - Name: `tokiflow-worker`
   - Root Directory: `apps/worker`
   - Build Command: `bun install`
   - Start Command: `bun run src/index.ts`
5. Add environment variables (same as Vercel)
6. Click "Create Web Service"

### Option C: Fly.io

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Create app
cd apps/worker
fly launch --name tokiflow-worker

# Set secrets
fly secrets set DATABASE_URL="your-db-url"
fly secrets set REDIS_URL="your-redis-url"
fly secrets set RESEND_API_KEY="your-api-key"
# ... add all required variables

# Deploy
fly deploy
```

## Step 8: Verify Deployment

### Check Web App

```bash
# Visit your deployment
open https://your-app.vercel.app

# Test pages
# - Homepage: /
# - Sign in: /auth/signin
# - Dashboard: /app
```

### Check API

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Test ping endpoint
curl https://your-app.vercel.app/api/ping/test
```

### Check Worker

```bash
# View logs
# Railway:
railway logs

# Render:
# View in dashboard

# Fly.io:
fly logs
```

### Test Alert Delivery

1. Create a test monitor in the dashboard
2. Send a failing ping:
   ```bash
   curl "https://your-app.vercel.app/api/ping/YOUR_TOKEN?state=fail&exitCode=1"
   ```
3. Check email for alert
4. Check Slack (if configured)

## Troubleshooting

### Build Fails

```
Error: Module not found
```

**Solution:**
- Verify `package.json` in `apps/web`
- Run `npm install` locally to test
- Check Vercel build logs for specific error

### Environment Variables Not Working

```
Error: NEXTAUTH_SECRET is not defined
```

**Solution:**
- Verify all variables are added in Vercel dashboard
- Check variable names match exactly (case-sensitive)
- Redeploy after adding variables

### Database Connection Error

```
Error: Can't reach database server
```

**Solution:**
- Verify DATABASE_URL is correct
- Check Supabase firewall (should allow all IPs)
- Use pooling URL (`pgbouncer=true`)

### Prisma Migration Fails

```
Error: Migration failed
```

**Solution:**
```bash
# Reset database (WARNING: deletes data)
DATABASE_URL="your-url" npx prisma migrate reset

# Or manually run migrations
DATABASE_URL="your-url" npx prisma migrate deploy
```

### Worker Not Processing Jobs

**Check:**
1. Worker is running (check platform logs)
2. REDIS_URL is correct
3. Queue names match (`alerts`, `email`, `slack`)
4. Test Redis connection:
   ```bash
   redis-cli -u $REDIS_URL ping
   ```

### Stripe Webhook Not Working

```
Error: No signatures found matching the expected signature
```

**Solution:**
1. Verify webhook endpoint in Stripe dashboard
2. Update STRIPE_WEBHOOK_SECRET
3. Test webhook:
   ```bash
   stripe trigger payment_intent.succeeded
   ```

## Performance Optimization

### Enable Caching

Add to `vercel.json` in `apps/web`:

```json
{
  "crons": [
    {
      "path": "/api/cron/evaluate",
      "schedule": "* * * * *"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=60, stale-while-revalidate=120"
        }
      ]
    }
  ]
}
```

### Enable Edge Functions

For better performance, use Edge Runtime for API routes:

```typescript
// apps/web/src/app/api/your-route/route.ts
export const runtime = 'edge';
```

### Database Query Optimization

```bash
# Add indexes
# Check EXPLAIN ANALYZE for slow queries
# Use connection pooling
```

## Monitoring

### Vercel Analytics

1. Go to Project → Analytics
2. Enable Web Analytics
3. View:
   - Page views
   - User geography
   - Device breakdown

### Sentry Error Tracking

1. Errors automatically reported to Sentry
2. View dashboard: https://sentry.io
3. Set up alerts for critical errors

### Uptime Monitoring

Use Tokiflow to monitor itself!

1. Create monitor in dashboard
2. Ping URL: Your health check endpoint
3. Get alerts if your app goes down

## Cost Estimate

### Free Tier (MVP)

- Vercel: FREE (Pro: $20/mo)
- Supabase: FREE (Pro: $25/mo)
- Upstash Redis: FREE (Pro: $10/mo)
- Resend: FREE (100 emails/day)
- Sentry: FREE (5k errors/month)
- Railway/Render Worker: FREE tier available
- **Total: $0/month**

### Paid Tier (Scale)

- Vercel Pro: $20/mo
- Supabase Pro: $25/mo
- Upstash: $10/mo
- Resend: $20/mo (unlimited)
- Sentry Team: $26/mo
- Railway: $10/mo (worker)
- **Total: $111/month**

## Next Steps

After successful deployment:

1. ✅ Set up custom domain
2. ✅ Enable SSL/TLS (automatic on Vercel)
3. ✅ Configure monitoring
4. ✅ Set up Sentry alerts
5. ✅ Test all features end-to-end
6. ✅ Invite team members
7. ✅ Launch! 🚀

## Support

Need help?

- Vercel Docs: https://vercel.com/docs
- Tokiflow Issues: https://github.com/your-repo/issues
- Email: support@tokiflow.co

Happy deploying! 🎉

