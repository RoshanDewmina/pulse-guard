# 🚀 Saturn Production Deployment Guide

## 📋 Overview

Deploy Saturn to production with:
- **Vercel** - Next.js web app (free tier available)
- **Neon** - PostgreSQL database (you have this!) ✅
- **Upstash** - Redis cache (you have this!) ✅
- **Resend** - Email service (you have this!) ✅
- **Vercel Cron** or **Railway** - BullMQ worker
- **AWS S3** or **Vercel Blob** - File storage (upgrade from MinIO)

---

## 🎯 Quick Deploy (5 minutes)

### Step 1: Install Vercel CLI

```bash
npm i -g vercel
# or
bun add -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

### Step 3: Deploy

```bash
cd /home/roshan/development/personal/pulse-guard/apps/web
vercel --prod
```

That's it! But you need to set environment variables...

---

## 🔐 Environment Variables for Vercel

You'll need to add these in the Vercel dashboard:

### Required Variables

```bash
# Database (Neon)
DATABASE_URL="postgresql://neondb_owner:npg_RBVXn3ewop9c@ep-silent-sun-admrfa2d-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_RBVXn3ewop9c@ep-silent-sun-admrfa2d.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# Redis (Upstash)
REDIS_URL="rediss://default:AWRQAAIncDI1YmIxN2UxMjk3OGU0YjYzYmVlYjRhMzk1NGMwZDlmMXAyMjU2ODA@mint-giraffe-25680.upstash.io:6379"

# Next.js Auth
NEXTAUTH_URL="https://your-app.vercel.app"  # Update after first deploy!
NEXTAUTH_SECRET="<generate-new-secret-here>"

# Email (Resend)
RESEND_API_KEY="re_PZYyMBji_LcvWNfV3fWhqwa6Eu8pM3aDG"
FROM_EMAIL="noreply@yourdomain.com"

# Node Environment
NODE_ENV="production"
```

### Generate New NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

### Optional (for later)

```bash
# Stripe (if you want billing)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Slack (if you want Slack integration)
SLACK_CLIENT_ID="..."
SLACK_CLIENT_SECRET="..."

# S3 Storage (recommended for production)
S3_BUCKET_NAME="saturn-outputs"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
```

---

## 📦 Deployment Steps (Detailed)

### Option A: Vercel CLI (Recommended)

```bash
# 1. Navigate to web app
cd /home/roshan/development/personal/pulse-guard/apps/web

# 2. Login to Vercel
vercel login

# 3. Deploy (first time - preview)
vercel

# 4. Follow prompts:
#    - Set up and deploy? Y
#    - Which scope? [Select your account]
#    - Link to existing project? N
#    - What's your project's name? saturn
#    - In which directory is your code located? ./
#    - Want to override settings? N

# 5. Add environment variables (see next section)

# 6. Deploy to production
vercel --prod
```

### Option B: GitHub + Vercel (Best for Teams)

```bash
# 1. Push to GitHub
git remote add origin https://github.com/yourusername/saturn.git
git add .
git commit -m "Initial Saturn deployment"
git push -u origin main

# 2. Go to vercel.com
# 3. Click "Add New Project"
# 4. Import from GitHub
# 5. Select your repository
# 6. Configure:
#    - Framework Preset: Next.js
#    - Root Directory: apps/web
#    - Build Command: bun run build
#    - Output Directory: .next
# 7. Add environment variables (see below)
# 8. Deploy!
```

---

## 🔧 Adding Environment Variables in Vercel

### Via Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - Key: `DATABASE_URL`
   - Value: `postgresql://...`
   - Environments: ✅ Production, ✅ Preview, ✅ Development
5. Click **Save**
6. Redeploy

### Via CLI

```bash
# Set production variables
vercel env add DATABASE_URL production
# Paste your database URL when prompted

vercel env add REDIS_URL production
# Paste your Redis URL when prompted

vercel env add NEXTAUTH_SECRET production
# Generate with: openssl rand -base64 32

# ... repeat for all variables
```

---

## 🔄 Deploy the BullMQ Worker

The worker runs background jobs (missed detection, alerts).

### Option 1: Vercel Cron (Easiest, but limited)

Create `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/check-missed",
      "schedule": "* * * * *"
    }
  ]
}
```

Then create the cron endpoint: `apps/web/src/app/api/cron/check-missed/route.ts`

**Limitation**: Vercel crons run max every 1 minute. Worker should run continuously.

### Option 2: Railway (Recommended for Worker)

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Create new project
railway init

# 4. Create worker service
cd /home/roshan/development/personal/pulse-guard/apps/worker
railway up

# 5. Add environment variables in Railway dashboard
# Same as Vercel (DATABASE_URL, REDIS_URL, etc.)

# 6. Deploy
railway up --detach
```

Railway config file: `apps/worker/railway.json`
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "bun run start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Option 3: Render.com (Alternative)

1. Go to https://render.com
2. Create **Background Worker**
3. Connect GitHub repo
4. Configure:
   - Build Command: `cd apps/worker && bun install`
   - Start Command: `cd apps/worker && bun run start`
5. Add environment variables
6. Deploy

---

## 📊 Storage: Upgrade from MinIO

For production, switch from local MinIO to cloud storage.

### Option A: Vercel Blob (Easiest with Vercel)

```bash
# 1. Enable in Vercel dashboard
# Project → Storage → Create Blob Store

# 2. Environment variables are auto-added:
# BLOB_READ_WRITE_TOKEN (auto-configured)

# 3. Update code to use Vercel Blob
# In apps/web/src/lib/s3.ts:
# import { put } from '@vercel/blob';
```

### Option B: AWS S3 (Most flexible)

```bash
# 1. Create S3 bucket
aws s3 mb s3://saturn-outputs --region us-east-1

# 2. Create IAM user with S3 access
# Get Access Key ID and Secret Access Key

# 3. Add to Vercel env vars:
S3_BUCKET_NAME="saturn-outputs"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="AKIA..."
S3_SECRET_ACCESS_KEY="..."
```

### Option C: Cloudflare R2 (S3-compatible, no egress fees)

```bash
# 1. Go to Cloudflare dashboard → R2
# 2. Create bucket: saturn-outputs
# 3. Create API token
# 4. Add to Vercel:
S3_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"
S3_BUCKET_NAME="saturn-outputs"
S3_ACCESS_KEY_ID="..."
S3_SECRET_ACCESS_KEY="..."
S3_REGION="auto"
```

---

## 🧪 Post-Deployment Testing

### 1. Test the Application

```bash
# Your deployed URL
curl https://your-app.vercel.app

# Should return 200 OK
```

### 2. Create Test Monitor

1. Go to https://your-app.vercel.app
2. Sign up
3. Create organization
4. Create monitor
5. Copy ping URL

### 3. Test Ping API

```bash
# Test start ping
curl -X POST "https://your-app.vercel.app/api/ping/YOUR_MONITOR_TOKEN?state=start"

# Should return: {"ok":true}

# Test success ping
curl -X POST "https://your-app.vercel.app/api/ping/YOUR_MONITOR_TOKEN?state=success&durationMs=1234"
```

### 4. Test Worker

Check if missed detection is working:
- Create a monitor
- Don't send any pings
- Wait for grace period + 1 minute
- Check if incident was created

### 5. Test Email

- Create alert rule with email channel
- Trigger an incident
- Check if email was sent

---

## 🎯 Production Checklist

Before going live:

### Security
- [ ] Generated new `NEXTAUTH_SECRET` (not dev secret!)
- [ ] Database password is strong
- [ ] Redis URL uses TLS (`rediss://`)
- [ ] API keys are in Vercel secrets (not in git)
- [ ] `.env` files in `.gitignore`

### Performance
- [ ] Database connection pooling enabled (Neon does this)
- [ ] Redis connection pooling configured
- [ ] Image optimization enabled (Next.js default)
- [ ] Response caching configured

### Monitoring
- [ ] Sentry configured (optional but recommended)
- [ ] Uptime monitor for Saturn itself (meta-monitoring!)
- [ ] Database backup scheduled (Neon has this)

### Features
- [ ] Email sending works
- [ ] Worker is running
- [ ] Missed detection works
- [ ] Alerts are sent
- [ ] Status pages accessible

---

## 🚨 Troubleshooting

### "Build failed on Vercel"

Check:
1. Build command is correct: `bun run build`
2. All dependencies in `package.json`
3. No TypeScript errors: `npx tsc --noEmit`

### "Database connection failed"

Check:
1. `DATABASE_URL` is set correctly
2. `DATABASE_URL_UNPOOLED` is set (for Neon)
3. Connection string includes `?sslmode=require`

### "Redis connection failed"

Check:
1. `REDIS_URL` uses `rediss://` (with double 's' for TLS)
2. Redis is reachable from Vercel servers
3. Upstash allows connections from any IP

### "Worker not processing jobs"

Check:
1. Worker is deployed and running
2. Worker has same `REDIS_URL` as web app
3. Check worker logs for errors

---

## 💰 Cost Estimate

### Current Setup (Serverless)

| Service | Plan | Cost |
|---------|------|------|
| **Vercel** | Hobby | Free (or $20/mo Pro) |
| **Neon PostgreSQL** | Free Tier | $0 (0.5GB storage, 10M rows) |
| **Upstash Redis** | Free Tier | $0 (10K commands/day) |
| **Resend Email** | Free Tier | $0 (100 emails/day) |
| **Railway/Render** | Free Tier | $0 (or $5-10/mo) |
| **AWS S3** | Pay-as-you-go | ~$1-5/mo |
| **Total** | | **$0-50/month** |

### At Scale (1000+ monitors)

| Service | Plan | Cost |
|---------|------|------|
| **Vercel** | Pro | $20/mo |
| **Neon** | Scale | $19/mo |
| **Upstash** | Pay-as-you-go | $10-50/mo |
| **Resend** | Pro | $20/mo |
| **Railway** | Pro | $20/mo |
| **S3** | Standard | $10-50/mo |
| **Total** | | **$99-179/month** |

---

## 🎉 You're Ready to Deploy!

### Quick Commands

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
cd apps/web
vercel --prod

# 4. Add environment variables in dashboard
# https://vercel.com/dashboard

# 5. Redeploy
vercel --prod

# Done! 🚀
```

---

## 📞 Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Neon Docs: https://neon.tech/docs
- Upstash Docs: https://docs.upstash.com

---

**Let's deploy Saturn to production!** 🚀

