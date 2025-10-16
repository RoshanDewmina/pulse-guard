# 🚀 PulseGuard Deployment Guide

Complete deployment guide for PulseGuard using **Vercel CLI** (frontend) and **Fly.io** (worker).

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Quick Start](#quick-start)
4. [Detailed Guides](#detailed-guides)
5. [Deployment Scripts](#deployment-scripts)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)
8. [Cost Estimates](#cost-estimates)

---

## 🎯 Overview

PulseGuard is a distributed monitoring application that consists of:

- **Web Application (Next.js)** - Deployed to Vercel
  - User interface
  - API endpoints
  - Authentication
  - Real-time monitoring

- **Background Worker (Node.js)** - Deployed to Fly.io
  - Job processing (BullMQ)
  - Monitor evaluation
  - Alert delivery
  - Email notifications

### Third-Party Services

- **PostgreSQL** - Database (Neon, Supabase, etc.)
- **Redis** - Job queue & caching (Upstash, Redis Cloud)
- **Email** - Transactional emails (Resend)
- **Stripe** - Billing & subscriptions (optional)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Internet                          │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
             │                            │
    ┌────────▼─────────┐        ┌────────▼─────────┐
    │   Vercel CDN     │        │    Fly.io Edge   │
    │   (Web App)      │        │    (Worker)      │
    └────────┬─────────┘        └────────┬─────────┘
             │                            │
             │                            │
    ┌────────▼────────────────────────────▼─────────┐
    │              Redis (Upstash)                   │
    │           Job Queue & Cache                    │
    └────────────────────┬───────────────────────────┘
                         │
                         │
              ┌──────────▼───────────┐
              │  PostgreSQL (Neon)   │
              │     Database         │
              └──────────────────────┘
```

### How It Works

1. **User visits web app** → Vercel serves Next.js app
2. **User creates monitor** → Saved to PostgreSQL
3. **Monitor check due** → Web app adds job to Redis queue
4. **Worker picks up job** → Evaluates monitor status
5. **Alert triggered** → Worker sends notifications (email, Slack, etc.)

---

## ⚡ Quick Start

Choose your path:

### Option A: 10-Minute Quick Start (Recommended for first-time users)
👉 See [QUICK_START.md](./QUICK_START.md)

### Option B: Automated Deployment (Recommended for experienced users)
```bash
# 1. Set up environment variables interactively
./setup-env.sh

# 2. Deploy everything automatically
./deploy-all.sh production
```

### Option C: Manual Deployment (Full control)
👉 See [DEPLOY_CLI.md](./DEPLOY_CLI.md)

---

## 📖 Detailed Guides

### 📄 [QUICK_START.md](./QUICK_START.md)
**Best for:** First-time deployment, learning the platform
- Step-by-step instructions
- No scripts, just commands
- ~10 minutes to complete
- Explains what each step does

### 📄 [DEPLOY_CLI.md](./DEPLOY_CLI.md)
**Best for:** Production deployments, understanding the full process
- Comprehensive deployment guide
- Using Vercel CLI & Fly.io CLI
- Environment variable management
- Monitoring & scaling instructions
- Troubleshooting section

### 📄 [VERCEL_DEPLOY.md](./VERCEL_DEPLOY.md)
**Best for:** Web dashboard deployment (alternative to CLI)
- Deploy via Vercel web interface
- No CLI tools required
- Good for beginners
- Visual step-by-step

---

## 🛠️ Deployment Scripts

All scripts are located in the project root:

### `./setup-env.sh`
Interactive script to configure all environment variables.

```bash
./setup-env.sh
```

**What it does:**
- Prompts for all required secrets
- Generates secure random secrets (NEXTAUTH_SECRET, JWT_SECRET)
- Creates `.env.production` file
- Creates helper scripts for Vercel & Fly.io

**Output files:**
- `.env.production` - Environment variables
- `set-vercel-env.sh` - Script to set Vercel env vars
- `set-flyio-secrets.sh` - Script to set Fly.io secrets

---

### `./deploy-vercel-cli.sh`
Deploy web app to Vercel.

```bash
# Preview deployment
./deploy-vercel-cli.sh preview

# Production deployment
./deploy-vercel-cli.sh production
```

**What it does:**
- Checks Vercel CLI installation
- Authenticates with Vercel
- Deploys web app
- Shows deployment URL

---

### `./deploy-flyio.sh`
Deploy worker to Fly.io.

```bash
./deploy-flyio.sh
```

**What it does:**
- Checks Fly.io CLI installation
- Authenticates with Fly.io
- Builds worker
- Creates/updates Fly.io app
- Deploys worker

---

### `./deploy-all.sh`
Deploy entire stack in one command.

```bash
# Deploy everything to production
./deploy-all.sh production

# Preview deployment
./deploy-all.sh preview
```

**What it does:**
1. Runs database migrations
2. Deploys web app to Vercel
3. Deploys worker to Fly.io
4. Verifies both deployments
5. Shows status and URLs

---

## 🔐 Environment Variables

### Required Variables

| Variable | Description | Example | Where |
|----------|-------------|---------|-------|
| `DATABASE_URL` | PostgreSQL connection (pooled) | `postgresql://...` | Both |
| `DATABASE_URL_UNPOOLED` | PostgreSQL connection (direct) | `postgresql://...` | Both |
| `REDIS_URL` | Redis connection | `rediss://...` | Both |
| `NEXTAUTH_SECRET` | NextAuth.js secret (32+ chars) | `openssl rand -base64 32` | Web |
| `NEXTAUTH_URL` | Your app URL | `https://app.com` | Web |
| `JWT_SECRET` | JWT signing secret (32+ chars) | `openssl rand -base64 32` | Web |
| `RESEND_API_KEY` | Email API key | `re_...` | Both |
| `FROM_EMAIL` | Sender email address | `noreply@app.com` | Both |
| `NODE_ENV` | Environment | `production` | Both |
| `NEXT_PUBLIC_APP_URL` | Public app URL | `https://app.com` | Web |
| `NEXT_PUBLIC_API_URL` | Public API URL | `https://app.com` | Web |

### Optional Variables

| Variable | Description | Example | Where |
|----------|-------------|---------|-------|
| `STRIPE_SECRET_KEY` | Stripe API key | `sk_...` | Web |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | `whsec_...` | Web |
| `STRIPE_PRICE_PRO` | Pro plan price ID | `price_...` | Web |
| `STRIPE_PRICE_BUSINESS` | Business plan price ID | `price_...` | Web |
| `SENTRY_DSN` | Error tracking | `https://...` | Both |
| `SLACK_CLIENT_ID` | Slack app client ID | `123...` | Both |
| `SLACK_CLIENT_SECRET` | Slack app secret | `abc...` | Both |
| `S3_ENDPOINT` | S3-compatible storage | `https://...` | Web |
| `S3_BUCKET` | S3 bucket name | `pulseguard` | Web |
| `S3_ACCESS_KEY_ID` | S3 access key | `...` | Web |
| `S3_SECRET_ACCESS_KEY` | S3 secret key | `...` | Web |

### Setting Variables

**Vercel (Web App):**
```bash
# Using CLI
vercel env add VARIABLE_NAME production

# Or use the helper script
./set-vercel-env.sh
```

**Fly.io (Worker):**
```bash
# Using CLI
flyctl secrets set VARIABLE_NAME="value" --app pulseguard-worker

# Or use the helper script
./set-flyio-secrets.sh
```

---

## 🐛 Troubleshooting

### Web App Issues

**Build fails with "Module not found"**
```bash
# Clear cache and redeploy
cd apps/web
vercel --prod --force
```

**Environment variables not working**
```bash
# Verify variables are set
vercel env ls

# Pull variables to check locally
vercel env pull .env.production
```

**Database connection errors**
```bash
# Test database connection
cd packages/db
npx prisma db pull
```

---

### Worker Issues

**Worker won't start**
```bash
# Check logs
flyctl logs --app pulseguard-worker

# Verify secrets are set
flyctl secrets list --app pulseguard-worker

# SSH into machine for debugging
flyctl ssh console --app pulseguard-worker
```

**Out of memory errors**
```bash
# Scale up memory
flyctl scale memory 1024 --app pulseguard-worker
```

**Jobs not processing**
```bash
# Check Redis connection
flyctl ssh console --app pulseguard-worker
# Inside the container:
node -e "const Redis = require('ioredis'); const r = new Redis(process.env.REDIS_URL); r.ping().then(console.log)"
```

---

### Database Issues

**Migrations fail**
```bash
# Check connection
cd packages/db
export DATABASE_URL="your_connection_string"
npx prisma db pull

# Run migrations manually
npx prisma migrate deploy

# Reset (DANGEROUS - deletes all data)
npx prisma migrate reset
```

**Connection pool exhausted**
```bash
# Use unpooled connection for migrations
export DATABASE_URL="$DATABASE_URL_UNPOOLED"
npx prisma migrate deploy
```

---

## 💰 Cost Estimates

### Free Tier Deployment

**Vercel Free:**
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless functions
- **Limit:** Good for 1-2 users, light testing

**Fly.io Free:**
- ✅ 3 shared-cpu-1x VMs (256MB RAM each)
- ✅ 160 GB outbound transfer
- ✅ 3 GB storage
- **Limit:** Good for 50-100 monitors

**Neon Free:**
- ✅ 0.5 GB storage
- ✅ 191 compute hours/month
- **Limit:** Good for small projects

**Upstash Free:**
- ✅ 10,000 commands/day
- ✅ 256 MB storage
- **Limit:** Good for light usage

**Resend Free:**
- ✅ 100 emails/day
- ✅ 1 domain
- **Limit:** Good for testing

**Total Free Tier:** $0/month
**Suitable for:** Testing, personal use, <100 monitors

---

### Production Tier

**Vercel Pro:** $20/month
- 100 GB bandwidth
- Priority support
- Better performance

**Fly.io:** ~$10/month
- 1 shared-cpu-1x VM
- 512 MB RAM
- Automatic scaling

**Neon Pro:** $20/month
- 10 GB storage
- Better performance
- Point-in-time recovery

**Upstash:** ~$5/month
- 100,000 commands/day
- 1 GB storage

**Resend:** Pay-as-you-go
- ~$10/month for 10k emails

**Total Production:** ~$65/month
**Suitable for:** Small teams, 500-1000 monitors

---

### Enterprise Tier

**Vercel Enterprise:** Custom pricing
**Fly.io:** ~$50-100/month (multiple VMs, more memory)
**Neon/Supabase:** ~$100+/month
**Upstash/Redis:** ~$50+/month

**Total Enterprise:** $200-500+/month
**Suitable for:** Large teams, 5000+ monitors, high availability

---

## 📊 Monitoring Your Deployment

### Vercel

```bash
# View logs
vercel logs

# View deployment details
vercel inspect

# List all deployments
vercel list

# Open project in browser
vercel open
```

### Fly.io

```bash
# Check status
flyctl status --app pulseguard-worker

# View logs (live)
flyctl logs --app pulseguard-worker -f

# View metrics
flyctl dashboard --app pulseguard-worker

# Scale up/down
flyctl scale count 2 --app pulseguard-worker
flyctl scale memory 1024 --app pulseguard-worker
```

### Health Checks

```bash
# Test web app
curl https://your-app.vercel.app/api/health

# Expected response:
# {"status":"healthy","checks":{"database":{"status":"healthy"},"redis":{"status":"healthy"}}}

# Test worker (from Fly.io)
flyctl ssh console --app pulseguard-worker
# Inside container:
curl localhost:8080/health
```

---

## 🔄 Updating & Redeploying

### Quick Updates

```bash
# Update web app only
cd apps/web
vercel --prod

# Update worker only
cd apps/worker
flyctl deploy

# Update everything
./deploy-all.sh production
```

### With Database Changes

```bash
# 1. Create migration
cd packages/db
npx prisma migrate dev --name your_migration_name

# 2. Deploy migration to production
export DATABASE_URL="your_production_url"
npx prisma migrate deploy

# 3. Redeploy apps
./deploy-all.sh production
```

---

## 🆘 Getting Help

1. **Check logs first**
   - Web: `vercel logs`
   - Worker: `flyctl logs --app pulseguard-worker`

2. **Verify environment variables**
   - Web: `vercel env ls`
   - Worker: `flyctl secrets list --app pulseguard-worker`

3. **Test connections**
   - Database: `npx prisma db pull`
   - Redis: `redis-cli -u "$REDIS_URL" ping`

4. **Review documentation**
   - [Vercel Docs](https://vercel.com/docs)
   - [Fly.io Docs](https://fly.io/docs)
   - [Next.js Docs](https://nextjs.org/docs)
   - [Prisma Docs](https://www.prisma.io/docs)

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] Web app loads: `https://your-app.vercel.app`
- [ ] Health check passes: `/api/health`
- [ ] Can create account
- [ ] Can create organization
- [ ] Can create monitor
- [ ] Worker is running: `flyctl status`
- [ ] Worker logs show no errors
- [ ] Test ping works
- [ ] Email notifications work
- [ ] Stripe integration works (if configured)

---

## 📚 Additional Resources

- **Development Guide**: `docs/DEVELOPMENT.md`
- **Testing Guide**: `docs/TESTING.md`
- **Security Guide**: `docs/SECURITY.md`
- **Stripe Setup**: `docs/STRIPE.md`
- **Sentry Setup**: `docs/SENTRY_SETUP.md`

---

**Need help?** Open an issue or check the troubleshooting section in each guide.

**Ready to deploy?** Start with [QUICK_START.md](./QUICK_START.md)!

