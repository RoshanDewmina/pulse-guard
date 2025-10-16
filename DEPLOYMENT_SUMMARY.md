# 📋 Deployment Summary - Vercel CLI + Fly.io

Quick reference for deploying PulseGuard using Vercel CLI and Fly.io.

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `QUICK_START.md` | 10-minute deployment guide |
| `DEPLOY_CLI.md` | Comprehensive CLI deployment guide |
| `DEPLOYMENT_README.md` | Complete deployment reference |
| `README.md` | Project overview and quick links |
| `setup-env.sh` | Interactive environment setup script |
| `deploy-vercel-cli.sh` | Deploy web app to Vercel |
| `deploy-flyio.sh` | Deploy worker to Fly.io |
| `deploy-all.sh` | Deploy entire stack |
| `apps/worker/Dockerfile` | Worker container definition |
| `apps/worker/fly.toml` | Fly.io configuration |
| `apps/worker/src/health.ts` | Health check server |
| `.dockerignore` | Docker build exclusions |

---

## 🚀 Deployment Flow

### Option 1: Automated (Recommended)

```bash
# 1. Configure environment
./setup-env.sh

# 2. Deploy everything
./deploy-all.sh production
```

### Option 2: Step-by-Step

```bash
# 1. Configure environment
./setup-env.sh

# 2. Deploy web app
cd apps/web
vercel --prod

# 3. Set Vercel env vars
../../set-vercel-env.sh

# 4. Deploy worker
cd ../worker
flyctl launch --no-deploy
../../set-flyio-secrets.sh
flyctl deploy
```

### Option 3: Individual Services

```bash
# Deploy only web app
./deploy-vercel-cli.sh production

# Deploy only worker
./deploy-flyio.sh
```

---

## 🔑 Environment Variables

### Web App (Vercel)

**Required:**
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `REDIS_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `JWT_SECRET`
- `RESEND_API_KEY`
- `FROM_EMAIL`
- `NODE_ENV`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_API_URL`

**Optional:**
- Stripe keys
- S3 configuration
- Sentry DSN

### Worker (Fly.io)

**Required:**
- `DATABASE_URL`
- `DATABASE_URL_UNPOOLED`
- `REDIS_URL`
- `RESEND_API_KEY`
- `FROM_EMAIL`

**Optional:**
- Slack credentials
- Sentry DSN

---

## 🏗️ Architecture

```
Internet
   ↓
┌──────────────────────┐
│   Vercel (Web App)   │
│   - Next.js          │
│   - API Routes       │
│   - Auth             │
└──────────┬───────────┘
           │
           ↓
    ┌────────────┐
    │   Redis    │ ← BullMQ Queue
    │ (Upstash)  │
    └──────┬─────┘
           ↑
           │
┌──────────┴───────────┐
│ Fly.io (Worker)      │
│ - Job Processing     │
│ - Alerts             │
│ - Email              │
└──────────┬───────────┘
           │
           ↓
    ┌────────────┐
    │ PostgreSQL │
    │   (Neon)   │
    └────────────┘
```

---

## ✅ Verification Checklist

After deployment, verify:

### Web App
- [ ] Deployment successful: `vercel inspect`
- [ ] URL accessible
- [ ] Health check passes: `curl https://your-app.vercel.app/api/health`
- [ ] Can create account
- [ ] Can create organization
- [ ] Can create monitor

### Worker
- [ ] Deployment successful: `flyctl status --app pulseguard-worker`
- [ ] Logs show "All workers running"
- [ ] No errors in logs: `flyctl logs --app pulseguard-worker`
- [ ] Health check passes: Visit worker URL

### Integration
- [ ] Create a test monitor
- [ ] Trigger a ping: `curl https://your-app.vercel.app/api/ping/MONITOR_ID`
- [ ] Check worker processes job
- [ ] Verify email notifications work

---

## 🔧 Common Commands

### Vercel

```bash
# Deploy
cd apps/web
vercel --prod

# View logs
vercel logs

# Check deployment
vercel inspect

# List deployments
vercel list

# Set env var
vercel env add VARIABLE_NAME production

# View env vars
vercel env ls

# Pull env vars
vercel env pull .env.production
```

### Fly.io

```bash
# Deploy
cd apps/worker
flyctl deploy

# Check status
flyctl status --app pulseguard-worker

# View logs
flyctl logs --app pulseguard-worker

# Live logs
flyctl logs --app pulseguard-worker -f

# Set secret
flyctl secrets set KEY=value --app pulseguard-worker

# List secrets
flyctl secrets list --app pulseguard-worker

# SSH into container
flyctl ssh console --app pulseguard-worker

# Scale
flyctl scale count 2 --app pulseguard-worker
flyctl scale memory 1024 --app pulseguard-worker
```

### Database

```bash
# Run migrations
cd packages/db
export DATABASE_URL="your_production_url"
npx prisma migrate deploy

# Generate client
npx prisma generate

# View database
npx prisma studio
```

---

## 🐛 Troubleshooting

### Web App Won't Deploy

```bash
# Clear cache
vercel --prod --force

# Check build logs
vercel logs

# Verify environment variables
vercel env ls
```

### Worker Won't Start

```bash
# Check logs for errors
flyctl logs --app pulseguard-worker

# Verify secrets
flyctl secrets list --app pulseguard-worker

# Test database connection
flyctl ssh console --app pulseguard-worker
# In container:
node -e "console.log(process.env.DATABASE_URL)"
```

### Jobs Not Processing

```bash
# Check Redis connection
flyctl ssh console --app pulseguard-worker
# In container:
node -e "const Redis = require('ioredis'); new Redis(process.env.REDIS_URL).ping().then(console.log)"

# Check worker logs
flyctl logs --app pulseguard-worker -f

# Restart worker
flyctl restart --app pulseguard-worker
```

---

## 💰 Cost Breakdown

### Free Tier ($0/month)
- Vercel: Free plan
- Fly.io: 3 free VMs
- Neon: 0.5GB free
- Upstash: 10k commands/day free
- Resend: 100 emails/day free

**Good for:** Testing, personal use, <100 monitors

### Production ($65/month)
- Vercel Pro: $20
- Fly.io: $10
- Neon Pro: $20
- Upstash: $5
- Resend: $10

**Good for:** Small teams, 500-1000 monitors

---

## 📚 Documentation Links

- [Quick Start](./QUICK_START.md) - 10-minute deployment
- [CLI Deployment](./DEPLOY_CLI.md) - Comprehensive guide
- [Deployment Reference](./DEPLOYMENT_README.md) - Complete reference
- [Development Guide](./docs/DEVELOPMENT.md) - Local development
- [Testing Guide](./docs/TESTING.md) - Running tests

---

## 🎯 Next Steps

1. ✅ Deploy using one of the methods above
2. ✅ Verify deployment with checklist
3. ✅ Create your first monitor
4. ✅ Set up custom domain (optional)
5. ✅ Configure Stripe for billing (optional)
6. ✅ Set up error tracking with Sentry (optional)
7. ✅ Invite team members

---

## 🆘 Need Help?

1. **Check logs first**
   - Web: `vercel logs`
   - Worker: `flyctl logs --app pulseguard-worker`

2. **Review environment variables**
   - Web: `vercel env ls`
   - Worker: `flyctl secrets list --app pulseguard-worker`

3. **Test connections**
   - Database: `npx prisma db pull`
   - Redis: `redis-cli -u "$REDIS_URL" ping`

4. **Read the docs**
   - See documentation links above
   - Check troubleshooting sections

---

**Ready to deploy?** Start with [QUICK_START.md](./QUICK_START.md)! 🚀

