# Deployment Guide - Saturn Monitoring

## Overview

Saturn consists of two main deployable components:
1. **Web App** - Deployed to Vercel
2. **Worker** - Deployed to Fly.io

---

## 🌐 Web App Deployment (Vercel)

### Prerequisites
- Vercel CLI installed: `bun install -g vercel`
- Vercel account with project linked

### Environment Variables Required

Add these to your Vercel project settings or via CLI:

```bash
# Core
NODE_ENV=production
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
REDIS_URL=redis://...
NEXTAUTH_SECRET=<32-char-secret>
NEXTAUTH_URL=https://your-domain.com

# MFA (Required after migration)
MFA_ENC_KEY=<32-byte-base64-key>

# Email (Resend)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=hello@yourdomain.com

# Alert Channels (Optional)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+15551234567

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_ENABLED=true

# Staff Access
IS_STAFF_EMAILS=admin@yourdomain.com

# Feature Flags
NEXT_PUBLIC_MFA_ENABLED=true
NEXT_PUBLIC_TAGS_ENABLED=true
NEXT_PUBLIC_PAGERDUTY_ENABLED=true
NEXT_PUBLIC_TEAMS_ENABLED=true
NEXT_PUBLIC_SMS_ENABLED=true
NEXT_PUBLIC_ONBOARDING_ENABLED=true

# Error Tracking
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

### Deploy

```bash
# Add PATH if needed
export PATH="/home/roshan/snap/bun-js/78/.bun/bin:$PATH"

# Deploy to production
cd /path/to/pulse-guard
vercel --prod
```

### Set Environment Variables via CLI

```bash
# Example: Set MFA key
vercel env add MFA_ENC_KEY production

# Or use file
vercel env pull .env.production
vercel env push .env.production production
```

### Verify Deployment

1. Check build logs: `vercel inspect <deployment-url> --logs`
2. Visit: https://your-domain.com
3. Test login and features

---

## 🚀 Worker Deployment (Fly.io)

### Prerequisites
- Fly.io CLI installed: `curl -L https://fly.io/install.sh | sh`
- Fly.io account: `flyctl auth signup` or `flyctl auth login`

### Setup Fly.io App (First Time Only)

```bash
# Add PATH if needed
export PATH="/home/roshan/.fly/bin:$PATH"

# Navigate to root
cd /path/to/pulse-guard

# Deploy (will create app if it doesn't exist)
flyctl deploy --config apps/worker/fly.toml
```

### Environment Variables (Secrets)

Set secrets via Fly.io CLI:

```bash
# Core secrets
flyctl secrets set \
  NODE_ENV=production \
  DATABASE_URL="postgresql://..." \
  DIRECT_URL="postgresql://..." \
  REDIS_URL="redis://..." \
  --app saturn-worker

# MFA encryption key
flyctl secrets set \
  MFA_ENC_KEY="<your-base64-key>" \
  --app saturn-worker

# Twilio (if using SMS)
flyctl secrets set \
  TWILIO_ACCOUNT_SID="ACxxxxx" \
  TWILIO_AUTH_TOKEN="xxxxx" \
  TWILIO_FROM_NUMBER="+15551234567" \
  --app saturn-worker

# Resend (for email alerts)
flyctl secrets set \
  RESEND_API_KEY="re_xxxxx" \
  RESEND_FROM_EMAIL="hello@yourdomain.com" \
  --app saturn-worker

# PostHog (optional)
flyctl secrets set \
  POSTHOG_API_KEY="phc_xxxxx" \
  --app saturn-worker

# Sentry (optional)
flyctl secrets set \
  SENTRY_DSN="https://xxxxx@sentry.io/xxxxx" \
  --app saturn-worker
```

### Deploy Worker

```bash
# From repository root
cd /path/to/pulse-guard

# Deploy
flyctl deploy --config apps/worker/fly.toml

# Check status
flyctl status --app saturn-worker

# View logs
flyctl logs --app saturn-worker

# Scale if needed
flyctl scale count 2 --app saturn-worker
```

### Verify Worker Deployment

1. Check logs: `flyctl logs --app saturn-worker`
2. Check health: Visit your web app at `/api/_internal/health` (staff only)
3. Verify worker heartbeats appear in health check

---

## 🔄 Update Deployments

### Update Web App

```bash
# Just push to main branch
git push origin main

# Or deploy manually
vercel --prod
```

### Update Worker

```bash
# From repository root
flyctl deploy --config apps/worker/fly.toml --app saturn-worker
```

---

## 🗄️ Database Migration

**Important:** Run database migrations before deploying new code with schema changes.

```bash
# Connect to your production database
DATABASE_URL="postgresql://..." bunx prisma migrate deploy

# Or use Prisma Studio to verify
DATABASE_URL="postgresql://..." bunx prisma studio
```

### For Launch Readiness Features

```bash
# Run this once after deploying the launch readiness code
cd packages/db
DATABASE_URL="postgresql://your-prod-db" bunx prisma db push
DATABASE_URL="postgresql://your-prod-db" bunx prisma generate
```

---

## 🔐 Generate Required Secrets

### MFA Encryption Key (32 bytes, base64)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### NextAuth Secret (32+ characters)

```bash
openssl rand -base64 32
```

---

## 📊 Post-Deployment Checks

### Web App
- [ ] Homepage loads
- [ ] Sign in works
- [ ] Dashboard accessible
- [ ] API endpoints respond
- [ ] Environment variables set correctly

### Worker
- [ ] Worker is running (check `flyctl status`)
- [ ] Logs show no errors (check `flyctl logs`)
- [ ] Heartbeats appearing in health check
- [ ] Evaluator running (check logs)
- [ ] Alerts sending correctly

### Database
- [ ] Migration applied
- [ ] Tables exist
- [ ] New fields present (MFA, tags, etc.)

### Features
- [ ] MFA enrollment works
- [ ] PagerDuty/Teams/SMS channels can be added
- [ ] Onboarding checklist appears for new users
- [ ] Health endpoint returns data (`/api/_internal/health`)
- [ ] Cookie consent banner appears
- [ ] Analytics tracking (if enabled)

---

## 🐛 Troubleshooting

### Web App Build Fails

**Check:**
1. All environment variables are set
2. Database is accessible
3. Prisma client is generated
4. Build logs for specific errors: `vercel inspect <url> --logs`

**Fix:**
```bash
# Redeploy
vercel --prod --force

# Or clear build cache
vercel build --prod --force
```

### Worker Not Starting

**Check:**
1. `flyctl logs --app saturn-worker` for errors
2. All secrets are set: `flyctl secrets list --app saturn-worker`
3. Database/Redis connectivity

**Fix:**
```bash
# Restart worker
flyctl apps restart saturn-worker

# Check health
flyctl checks list --app saturn-worker
```

### Worker Health Check Failing

**Possible causes:**
- Port 8080 not exposed
- Health endpoint not responding
- Worker crashed

**Fix:**
```bash
# Check processes
flyctl ssh console --app saturn-worker
ps aux | grep node

# Restart
flyctl apps restart saturn-worker
```

### Database Connection Issues

**Check:**
1. Connection string is correct
2. Database allows connections from Vercel/Fly.io IPs
3. SSL mode is correct (for Neon: `?sslmode=require`)

**Fix:**
```bash
# Test connection
DATABASE_URL="postgresql://..." bunx prisma db pull
```

### MFA Not Working

**Check:**
1. `MFA_ENC_KEY` is set in both Vercel and Fly.io
2. Database migration applied
3. Key is exactly 32 bytes (44 chars base64)

**Fix:**
```bash
# Regenerate key
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Set in Vercel
vercel env add MFA_ENC_KEY production

# Set in Fly.io
flyctl secrets set MFA_ENC_KEY="<key>" --app saturn-worker
```

---

## 📞 Support

- **Documentation:** `/website/docs/`
- **Health Check:** `https://your-domain.com/api/_internal/health`
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Fly.io Dashboard:** https://fly.io/dashboard

---

## 🎉 Deployment Checklist

### Pre-Deployment
- [ ] All code committed and pushed
- [ ] Database backup created
- [ ] Migration SQL reviewed
- [ ] Environment variables documented
- [ ] Secrets generated

### Deployment
- [ ] Run database migration
- [ ] Deploy web app to Vercel
- [ ] Deploy worker to Fly.io
- [ ] Set all environment variables
- [ ] Set all secrets

### Post-Deployment
- [ ] Verify web app loads
- [ ] Verify worker is running
- [ ] Test authentication
- [ ] Test alert channels
- [ ] Test onboarding flow
- [ ] Monitor logs for errors
- [ ] Check health endpoint

### Rollback Plan
- [ ] Previous deployment URL saved
- [ ] Database backup available
- [ ] Rollback command ready:
  ```bash
  # Web
  vercel rollback <previous-deployment-url>
  
  # Worker
  flyctl releases rollback --app saturn-worker
  ```

---

**Last Updated:** October 18, 2025  
**Version:** 1.0.0 (Launch Readiness)

