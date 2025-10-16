# Production Deployment

Deploy Saturn to production in 15 minutes.

## Stack

- **Web App**: Vercel
- **Worker**: Fly.io / Render / Railway
- **Database**: Neon / Supabase PostgreSQL
- **Redis**: Upstash
- **Storage**: Cloudflare R2 / AWS S3

## Prerequisites

- GitHub repository
- Vercel account
- Database (Neon/Supabase)
- Redis instance (Upstash)
- Email service (Resend)
- Storage (R2/S3)

## Step 1: Deploy Web App (Vercel)

### Import to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Framework: **Next.js** (auto-detected)
4. Root Directory: `apps/web`
5. Click **Deploy** (will fail initially - add env vars next)

### Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```env
# Database (Neon/Supabase)
DATABASE_URL=postgresql://user:pass@host:6543/db?pgbouncer=true
DIRECT_URL=postgresql://user:pass@host:5432/db

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<openssl rand -base64 32>

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret

# Email (Resend)
RESEND_API_KEY=re_your_key
EMAIL_FROM=noreply@yourdomain.com

# Redis (Upstash)
REDIS_URL=rediss://default:pass@host:6379

# Storage (R2/S3)
S3_REGION=auto
S3_ENDPOINT=https://account.r2.cloudflarestorage.com
S3_BUCKET=saturn-outputs
S3_ACCESS_KEY_ID=your_key
S3_SECRET_ACCESS_KEY=your_secret
S3_FORCE_PATH_STYLE=false

# Stripe (optional, for billing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...

# Slack (optional, for alerts)
SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_secret
SLACK_SIGNING_SECRET=your_signing_secret

# Sentry (optional, for monitoring)
SENTRY_DSN=https://key@org.ingest.sentry.io/project
NEXT_PUBLIC_SENTRY_DSN=https://key@org.ingest.sentry.io/project
```

### Run Migrations

```bash
# Set DATABASE_URL to production database
export DATABASE_URL="postgresql://..."

# Run migrations
cd packages/db
npx prisma migrate deploy
```

### Redeploy

After adding env vars, trigger a new deployment in Vercel or:
```bash
cd apps/web
vercel --prod
```

## Step 2: Deploy Worker

### Option A: Fly.io

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize (from apps/worker directory)
cd apps/worker
fly launch

# Configure secrets
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set REDIS_URL="rediss://..."
fly secrets set RESEND_API_KEY="re_..."
# ... add all required env vars

# Deploy
fly deploy
```

### Option B: Render

1. Go to https://render.com/new
2. Choose "Background Worker"
3. Connect GitHub repository
4. Build Command: `cd apps/worker && npm install && npm run build`
5. Start Command: `cd apps/worker && npm start`
6. Add environment variables (same as Vercel)
7. Deploy

### Option C: Railway

1. Go to https://railway.app/new
2. Deploy from GitHub repo
3. Root Directory: `apps/worker`
4. Add environment variables
5. Deploy

## Step 3: External Services Setup

### Neon (Database)

1. Sign up at https://neon.tech
2. Create project
3. Copy connection strings (pooled & direct)
4. Add to Vercel/Worker env vars

### Upstash (Redis)

1. Sign up at https://upstash.com
2. Create Redis database
3. Copy connection string (starts with `rediss://`)
4. Add as REDIS_URL

### Cloudflare R2 (Storage)

1. Go to Cloudflare Dashboard → R2
2. Create bucket: `saturn-outputs`
3. Create API token with R2 access
4. Add credentials to env vars

### Resend (Email)

1. Sign up at https://resend.com
2. Get API key from dashboard
3. Add to env vars as RESEND_API_KEY
4. Verify domain (optional but recommended)

### Stripe (Billing - Optional)

1. Sign up at https://stripe.com
2. Get API keys from dashboard
3. Create products/prices
4. Configure webhook endpoint: `https://your-app.vercel.app/api/webhooks/stripe`
5. Add env vars

## Verification

### Check Web App
```bash
curl https://your-app.vercel.app/api/health
# Should return: {"status":"ok"}
```

### Check Worker
View logs in Fly.io/Render/Railway dashboard. Should see:
```
Worker started
Connected to Redis
Connected to PostgreSQL
```

### Test Ping API
```bash
# Create a monitor in dashboard, get token
curl https://your-app.vercel.app/api/ping/YOUR_TOKEN
# Should return: {"ok":true}
```

## Post-Deployment

### Security
- [ ] Enable Vercel authentication (if needed)
- [ ] Configure custom domain with SSL
- [ ] Set up firewall rules
- [ ] Enable rate limiting (configured in code)

### Monitoring
- [ ] Set up Sentry (see [SENTRY_SETUP.md](SENTRY_SETUP.md))
- [ ] Configure uptime monitoring
- [ ] Set up log aggregation
- [ ] Create alerts for critical errors

### Backups
- [ ] Enable automated database backups (Neon/Supabase)
- [ ] Configure R2 bucket lifecycle rules
- [ ] Export and save environment variables

## Troubleshooting

**Build fails on Vercel:**
- Check build logs for specific errors
- Ensure all dependencies are in package.json
- Verify TypeScript builds locally: `npm run build`

**Database connection errors:**
- Use pooled connection string for Vercel (port 6543)
- Use direct connection string for migrations (port 5432)
- Check firewall rules allow Vercel/Worker IPs

**Worker not processing jobs:**
- Verify REDIS_URL is correct
- Check worker logs for connection errors
- Ensure database migrations are applied

**Emails not sending:**
- Verify RESEND_API_KEY is correct
- Check domain verification status
- Review Resend dashboard for errors

## Scaling

### Horizontal Scaling
- Web: Vercel scales automatically
- Worker: Increase instance count in Fly.io/Render
- Database: Upgrade Neon/Supabase plan

### Performance Optimization
- Enable Redis caching for monitor lookups
- Add database read replicas (Neon/Supabase)
- Configure CDN for static assets (Vercel handles this)
- Optimize database queries with indexes

## Cost Estimate (Monthly)

**Small scale** (< 100 monitors):
- Vercel: $0 (Hobby) or $20 (Pro)
- Fly.io: $5-10 (256MB RAM)
- Neon: $0 (Free) or $19 (Launch)
- Upstash: $0 (Free tier)
- R2: ~$1 (10GB storage)
**Total: ~$0-50/month**

**Medium scale** (100-1000 monitors):
- Vercel: $20 (Pro)
- Fly.io: $20-40 (512MB-1GB RAM)
- Neon: $69 (Scale)
- Upstash: $10 (Pay-as-you-go)
- R2: ~$5 (50GB storage)
**Total: ~$124-144/month**

## Resources

- Vercel Docs: https://vercel.com/docs
- Fly.io Docs: https://fly.io/docs
- Neon Docs: https://neon.tech/docs
- Upstash Docs: https://upstash.com/docs
