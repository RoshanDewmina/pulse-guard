# Deployment Guide - Vercel & Fly.io
**Date:** October 17, 2025  
**What Changed:** Web app pages (frontend only)

---

## 📋 Quick Answer

### Vercel (Web App) - ✅ NEEDS UPDATE
**Why:** You added/modified 9 pages in `apps/web/`
- New: Integrations, Profile, Audit Logs, Organization Settings
- Modified: Incidents, Settings Layout, Alerts

### Fly.io (Worker) - ⚠️ NO UPDATE NEEDED (But Currently Stopped)
**Why:** No worker code changed
- Worker is stopped due to Redis limits (500K requests exhausted)
- Once Redis is fixed, worker will auto-restart
- No code changes to deploy

---

## 🚀 Step 1: Deploy to Vercel (Required)

### Option A: Deploy via Vercel CLI (Recommended)

```bash
cd /home/roshan/development/personal/pulse-guard

# Preview deployment first (optional)
vercel

# Production deployment
vercel --prod
```

**What this does:**
- ✅ Deploys all new pages
- ✅ Updates modified pages
- ✅ Builds optimized production bundle
- ✅ Updates live site at saturnmonitor.com
- ⏱️ Takes ~2-3 minutes

### Option B: Deploy via Git (If Auto-Deploy Enabled)

```bash
cd /home/roshan/development/personal/pulse-guard

# Stage all changes
git add .

# Commit
git commit -m "Add integrations, profile, audit logs, and organization settings pages"

# Push to main branch
git push origin main
```

**What this does:**
- Vercel automatically detects the push
- Triggers a build and deployment
- Updates production automatically
- ⏱️ Takes ~3-5 minutes

### Verify Deployment

After deploying, test the new pages:

```bash
# Test new pages (should return 307 redirect to auth or 200 if logged in)
curl -I https://app.saturnmonitor.com/app/integrations
curl -I https://app.saturnmonitor.com/app/profile
curl -I https://app.saturnmonitor.com/app/settings/audit-logs
curl -I https://app.saturnmonitor.com/app/settings/organization

# Test existing pages still work
curl -I https://app.saturnmonitor.com/app/incidents
curl -I https://app.saturnmonitor.com/app/settings/alerts
```

---

## 🔧 Step 2: Fly.io Worker (Not Needed Now)

### Current Status: ⚠️ Worker Stopped

**Issue:** Redis free tier limit exceeded (500,000 requests/month)

```
❌ Worker Status: STOPPED
❌ Redis: Limit exceeded
✅ Web App: Working (doesn't need Redis for viewing pages)
```

### Worker Code: ✅ No Changes

Your worker code **hasn't changed**, so no deployment needed. However, the worker is currently stopped because of the Redis issue we discussed earlier.

### When Worker Will Auto-Restart

The worker will automatically restart when:
1. **Redis limit resets** (monthly reset)
2. **You upgrade Redis** (Upstash paid tier or self-hosted on Fly.io)
3. **You switch Redis provider** (Redis Cloud free tier with unlimited requests)

### If You Want to Redeploy Worker Anyway

Even though code didn't change, you could redeploy to clear any cached issues:

```bash
cd /home/roshan/development/personal/pulse-guard

# Set up Fly.io CLI
export PATH="/home/roshan/.fly/bin:$PATH"

# Deploy worker with fresh build
flyctl deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile --no-cache

# Check status
flyctl status --app saturn-worker
flyctl logs --app saturn-worker --no-tail
```

⚠️ **Note:** This will still fail until Redis is fixed. The worker needs Redis for job queuing.

---

## 📊 What Each Service Does

### Vercel (Web App)
**Purpose:** Serves your Next.js web application
- Homepage and landing pages
- Dashboard UI
- Settings pages
- Authentication pages
- API routes (most of them)

**When to Deploy:**
- ✅ When you change pages/components
- ✅ When you modify API routes
- ✅ When you update styles
- ✅ When you fix bugs in the UI

### Fly.io (Worker)
**Purpose:** Background job processing
- Monitor health checks (every 60 seconds)
- Alert dispatching (email, Slack, Discord, webhooks)
- Scheduled evaluations
- Incident detection

**When to Deploy:**
- ✅ When you change worker code in `apps/worker/`
- ✅ When you update job processing logic
- ✅ When you modify alert templates
- ⚠️ **NOT for web page changes**

---

## 🔄 How Deployment Works

### Vercel Deployment Flow

```
1. You run: vercel --prod
2. Vercel: Clones your code
3. Vercel: Runs npm/bun install
4. Vercel: Runs next build
5. Vercel: Uploads to CDN
6. Vercel: Updates DNS
7. Your site: Live in ~2 minutes!
```

**Vercel deploys from:**
- Your local files (if using CLI)
- Your Git repo (if using auto-deploy)

### Fly.io Deployment Flow

```
1. You run: flyctl deploy
2. Fly.io: Builds Docker image
3. Fly.io: Runs tests (if configured)
4. Fly.io: Deploys to VMs
5. Fly.io: Health check
6. Worker: Starts processing jobs
```

**Fly.io deploys from:**
- Your local `apps/worker/` directory
- Dockerfile in `apps/worker/`

---

## 🎯 Current Deployment Strategy

### Right Now: Deploy Vercel Only

```bash
cd /home/roshan/development/personal/pulse-guard
vercel --prod
```

**Why?**
- ✅ All changes are in web app
- ✅ Worker code unchanged
- ✅ Web app doesn't need worker to display pages
- ⚠️ Worker can't run until Redis is fixed anyway

### Later: Fix Redis, Then Worker Auto-Restarts

**Option 1: Self-host Redis on Fly.io (FREE)**
```bash
# I can help you set this up in ~5 minutes
# Creates a Redis container on Fly.io
# Uses your existing free tier
```

**Option 2: Upgrade Upstash ($1-5/month)**
```bash
# Visit https://console.upstash.com/
# Upgrade to pay-as-you-go
# Worker auto-restarts when limit increases
```

**Option 3: Redis Cloud Free Tier ($0/month)**
```bash
# Sign up at https://redis.io/try-free/
# Get 30MB storage, unlimited requests
# Update REDIS_URL in Fly.io and Vercel
```

---

## 🔐 Environment Variables

### Vercel Environment Variables

Your web app uses these (already configured):
- `DATABASE_URL` - Neon PostgreSQL
- `REDIS_URL` - Upstash Redis
- `NEXTAUTH_SECRET` - Auth secret
- `NEXTAUTH_URL` - https://app.saturnmonitor.com
- And ~20 more...

**No changes needed** - Vercel keeps these during deployment.

### Fly.io Environment Variables

Your worker uses these (already configured):
- `DATABASE_URL` - Same Neon database
- `REDIS_URL` - Same Upstash Redis
- `RESEND_API_KEY` - For email alerts
- And more...

**No changes needed** - Fly.io keeps these between deployments.

---

## 📝 Deployment Checklist

### For This Update (Web Pages)

- [ ] **Commit changes** (optional but recommended)
- [ ] **Run `vercel --prod`** (required)
- [ ] **Wait 2-3 minutes** for build
- [ ] **Test new pages** (curl or browser)
- [ ] **Verify existing pages** still work
- [ ] **Done!** ✅

### NOT Needed

- ❌ Don't deploy worker (no changes)
- ❌ Don't update environment variables (unchanged)
- ❌ Don't touch Redis (web app works without it)
- ❌ Don't restart Fly.io (will fail anyway)

---

## 🚨 Common Issues & Solutions

### Issue: "Vercel build failed"
**Solution:**
```bash
# Test build locally first
cd apps/web
NODE_ENV=production bunx next build

# If local build succeeds, try deploying again
vercel --prod
```

### Issue: "New pages still show 404"
**Solution:**
- Wait 2-3 minutes for CDN to update
- Clear your browser cache (Ctrl+Shift+R)
- Try incognito/private mode
- Check deployment status: `vercel inspect`

### Issue: "Worker still stopped after deploying"
**Solution:**
- Worker is stopped due to Redis, not code issues
- Fix Redis first (see Redis options above)
- Worker will auto-restart when Redis is available

---

## 📊 Deployment History

### What You're Deploying Now
```
✅ 4 new pages (integrations, profile, audit-logs, organization)
✅ 5 modified pages (incidents, settings, alerts)
✅ Test file fixes
✅ Configuration updates
```

### What's Already Deployed
```
✅ All 57 existing pages
✅ API routes (36 total)
✅ Auth system
✅ Database connection
✅ Monitoring system
```

---

## 🎯 Next Steps

### Immediate (Now)

1. **Deploy to Vercel:**
   ```bash
   cd /home/roshan/development/personal/pulse-guard
   vercel --prod
   ```

2. **Verify Deployment:**
   ```bash
   # Should see new pages working
   curl -I https://app.saturnmonitor.com/app/integrations
   ```

### Soon (When Ready)

3. **Fix Redis** (choose one):
   - Self-host on Fly.io (I can help!)
   - Upgrade Upstash ($1-5/month)
   - Switch to Redis Cloud ($0/month)

4. **Verify Worker:**
   ```bash
   flyctl status --app saturn-worker
   # Should show: running
   ```

---

## 💡 Pro Tips

### Vercel Tips
- Use `vercel` (no --prod) for preview deployments
- Preview deployments get unique URLs for testing
- Production deploys update your live site
- Vercel keeps last 10 deployments for rollback

### Fly.io Tips
- Worker restarts automatically on crash
- Logs available: `flyctl logs --app saturn-worker`
- Status check: `flyctl status --app saturn-worker`
- Scale up: `flyctl scale count 3` (for more workers)

### Redis Tips
- Monitor usage at https://console.upstash.com/
- Set up alerts at 80% usage
- Consider self-hosting if hitting limits often
- Redis Cloud free tier = unlimited requests!

---

## 🤝 Need Help?

**Deployment Issues:**
- Check Vercel dashboard: https://vercel.com/
- Check Fly.io dashboard: https://fly.io/dashboard/saturn-worker
- View logs: `vercel logs` or `flyctl logs`

**Redis Issues:**
- I can help set up self-hosted Redis on Fly.io
- Takes ~5 minutes
- Completely free
- No request limits

---

**Ready to Deploy?**

Run this command now:
```bash
cd /home/roshan/development/personal/pulse-guard && vercel --prod
```

That's it! Your new pages will be live in 2-3 minutes! 🚀

