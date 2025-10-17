# Fly.io Worker Deployment Guide

## 🎯 Current Status

**Your worker doesn't need updating right now** because:
- ✅ No worker code changed (only web app pages changed)
- 🔴 Worker is stopped due to Redis limits (not code issues)
- ⏳ Need to fix Redis before worker can run

---

## ⚠️ Important: Fix Redis First

Your worker is currently stopped because:
```
ERROR: Redis limit exceeded (500,000 requests/month)
```

**The worker will automatically restart once Redis is fixed.** No deployment needed!

### Quick Redis Fix Options

**Option 1: Self-host Redis on Fly.io (FREE)**
- Uses your existing free tier
- No request limits
- Takes ~5 minutes to setup

**Option 2: Upgrade Upstash ($1-5/month)**
- Visit: https://console.upstash.com/
- Upgrade to pay-as-you-go
- Worker auto-restarts

**Option 3: Redis Cloud Free Tier ($0)**
- Sign up: https://redis.io/try-free/
- 30MB storage, unlimited requests
- Update REDIS_URL in Fly.io

---

## 🚀 How to Deploy to Fly.io (When Needed)

### Step 1: Check Fly.io CLI

```bash
# Check if Fly.io CLI is installed
export PATH="/home/roshan/.fly/bin:$PATH"
flyctl version
```

If not installed:
```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh
```

### Step 2: Deploy Worker

```bash
cd /home/roshan/development/personal/pulse-guard

# Login to Fly.io (if needed)
flyctl auth login

# Deploy the worker
flyctl deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile

# Or with no cache (fresh build)
flyctl deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile --no-cache
```

### Step 3: Verify Deployment

```bash
# Check status
flyctl status --app saturn-worker

# View logs
flyctl logs --app saturn-worker

# Should see something like:
# ✅ Running on 2 machines
# ✅ All workers started
```

---

## 📊 When to Deploy to Fly.io

Deploy the worker when you change:
- ✅ Worker code in `apps/worker/src/`
- ✅ Job processing logic
- ✅ Alert templates (email, Slack, etc.)
- ✅ Scheduled tasks
- ✅ Dockerfile or dependencies

**Don't deploy when:**
- ❌ You only changed web app pages (like today)
- ❌ You only changed tests
- ❌ You only changed documentation

---

## 🔄 Deployment Commands Reference

### Basic Deployment
```bash
cd /home/roshan/development/personal/pulse-guard
export PATH="/home/roshan/.fly/bin:$PATH"
flyctl deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile
```

### Fresh Build (No Cache)
```bash
flyctl deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile --no-cache
```

### Deploy from Specific Directory
```bash
cd apps/worker
flyctl deploy
```

### Check Status
```bash
# Status of all machines
flyctl status --app saturn-worker

# View logs (real-time)
flyctl logs --app saturn-worker

# View logs (last 100 lines)
flyctl logs --app saturn-worker --no-tail

# Scale workers
flyctl scale count 3 --app saturn-worker

# Restart workers
flyctl apps restart saturn-worker
```

---

## 🛠️ Deployment Configuration

Your Fly.io config is in `apps/worker/fly.toml`:

```toml
app = "saturn-worker"
primary_region = "iad"

[build]
  dockerfile = "apps/worker/Dockerfile"
  build-target = "production"

[env]
  NODE_ENV = "production"

[http_service]
  internal_port = 8080
  force_https = false
  auto_stop_machines = false
  auto_start_machines = false
  min_machines_running = 1

[[vm]]
  size = "shared-cpu-1x"
  memory = "256mb"
```

---

## 🔐 Environment Variables

Your worker environment variables are already set in Fly.io:

```bash
# View secrets
flyctl secrets list --app saturn-worker

# Set a new secret
flyctl secrets set VARIABLE_NAME=value --app saturn-worker

# Set multiple secrets
flyctl secrets set \
  DATABASE_URL="..." \
  REDIS_URL="..." \
  --app saturn-worker
```

**Your current secrets** (already configured):
- `DATABASE_URL` - Neon PostgreSQL
- `REDIS_URL` - Upstash Redis (needs upgrade/replacement)
- `RESEND_API_KEY` - For email alerts
- `STRIPE_SECRET_KEY` - For payments
- `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET` - For Slack integration
- And more...

---

## 📝 Deployment Workflow

### For Worker Code Changes

```bash
# 1. Make changes to worker code
cd /home/roshan/development/personal/pulse-guard
# Edit files in apps/worker/src/

# 2. Test locally (optional)
cd apps/worker
bun run dev

# 3. Commit changes
git add .
git commit -m "Update worker: description of changes"

# 4. Deploy to Fly.io
export PATH="/home/roshan/.fly/bin:$PATH"
flyctl deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile

# 5. Verify deployment
flyctl status --app saturn-worker
flyctl logs --app saturn-worker
```

### For Web App + Worker Changes

If you change both:

```bash
# 1. Deploy web app (Vercel)
git push origin master
# Vercel auto-deploys

# 2. Deploy worker (Fly.io)
flyctl deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile
```

---

## 🚨 Common Issues

### Issue: "flyctl: command not found"

**Solution:**
```bash
# Add Fly.io to PATH
export PATH="/home/roshan/.fly/bin:$PATH"

# Or install Fly.io CLI
curl -L https://fly.io/install.sh | sh
```

### Issue: "Worker keeps crashing"

**Check logs:**
```bash
flyctl logs --app saturn-worker --no-tail | tail -50
```

**Common causes:**
- Redis connection failed (current issue!)
- Database connection failed
- Missing environment variables
- Code errors

### Issue: "Deployment stuck"

**Solution:**
```bash
# Cancel deployment
Ctrl+C

# Try with no cache
flyctl deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile --no-cache
```

### Issue: "Machines stopped"

**Current situation!** Fix Redis first, then:
```bash
# Restart machines
flyctl apps restart saturn-worker

# Or scale up
flyctl scale count 2 --app saturn-worker
```

---

## 🎯 Your Current Situation

### What Needs to Happen

1. **Fix Redis** (choose one):
   ```bash
   # Option A: Self-host on Fly.io (I can help!)
   # Option B: Upgrade Upstash at console.upstash.com
   # Option C: Switch to Redis Cloud (free tier)
   ```

2. **Worker Auto-Restarts** (no deployment needed):
   ```bash
   # Worker will automatically restart once Redis is available
   # Check status with:
   flyctl status --app saturn-worker
   ```

3. **Verify Everything Works**:
   ```bash
   # Check logs
   flyctl logs --app saturn-worker
   
   # Should see:
   # ✅ Redis connected
   # ✅ Database connected
   # ✅ Evaluator worker started
   # ✅ Alert workers started
   ```

---

## 💡 Quick Commands Cheat Sheet

```bash
# Setup (run once)
export PATH="/home/roshan/.fly/bin:$PATH"
flyctl auth login

# Deploy worker
flyctl deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile

# Check status
flyctl status --app saturn-worker

# View logs
flyctl logs --app saturn-worker

# Restart
flyctl apps restart saturn-worker

# View secrets
flyctl secrets list --app saturn-worker

# Set secret
flyctl secrets set VARIABLE=value --app saturn-worker

# Scale workers
flyctl scale count 2 --app saturn-worker

# SSH into machine
flyctl ssh console --app saturn-worker
```

---

## 📊 Deployment vs Vercel

| Aspect | Vercel (Web App) | Fly.io (Worker) |
|--------|-----------------|-----------------|
| **Trigger** | Git push (auto) | Manual command |
| **Frequency** | Every code change | Only worker changes |
| **Command** | `git push` | `flyctl deploy` |
| **Build Time** | ~2-3 minutes | ~3-5 minutes |
| **Auto-Deploy** | Yes (via Git) | No (manual only) |

---

## 🎯 Next Steps

### Right Now
1. **No Fly.io deployment needed** - worker code unchanged
2. **Fix Redis** - choose one of the 3 options above
3. **Worker auto-restarts** - no manual action needed

### When You Change Worker Code
1. Make your changes in `apps/worker/src/`
2. Test locally: `cd apps/worker && bun run dev`
3. Commit: `git add . && git commit -m "message"`
4. Deploy: `flyctl deploy --config apps/worker/fly.toml --dockerfile apps/worker/Dockerfile`

---

## 🤝 Need Help?

**For Redis setup:**
- I can help set up self-hosted Redis on Fly.io (free, ~5 minutes)

**For worker deployment:**
- Just ask and I'll run the commands for you
- Or use the commands above

**For troubleshooting:**
- Check logs: `flyctl logs --app saturn-worker`
- Check status: `flyctl status --app saturn-worker`
- View dashboard: https://fly.io/dashboard/saturn-worker

---

**Remember:** Your worker doesn't need updating now. Fix Redis first, then it'll auto-restart! 🚀

