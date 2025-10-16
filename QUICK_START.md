# 🚀 Quick Start: Deploy PulseGuard in 10 Minutes

This guide will get you from zero to production in 10 minutes using Vercel CLI and Fly.io.

---

## ⚡ Prerequisites (2 minutes)

### 1. Create Accounts
- [ ] [Vercel Account](https://vercel.com/signup) - Free
- [ ] [Fly.io Account](https://fly.io/app/sign-up) - Free tier available
- [ ] [Upstash Account](https://upstash.com) - Free Redis
- [ ] [Neon Account](https://neon.tech) - Free PostgreSQL
- [ ] [Resend Account](https://resend.com) - Free email API

### 2. Install CLIs

```bash
# Vercel CLI
npm install -g vercel

# Fly.io CLI (Linux/macOS)
curl -L https://fly.io/install.sh | sh

# Or with Homebrew (macOS)
brew install flyctl
```

---

## 🗄️ Step 1: Set Up Services (3 minutes)

### PostgreSQL (Neon)
1. Go to [console.neon.tech](https://console.neon.tech)
2. Create new project: "pulseguard"
3. Copy connection string (both pooled and direct)

### Redis (Upstash)
1. Go to [console.upstash.com](https://console.upstash.com)
2. Create new database: "pulseguard-redis"
3. Copy connection URL (starts with `rediss://`)

### Email (Resend)
1. Go to [resend.com/api-keys](https://resend.com/api-keys)
2. Create API key: "pulseguard"
3. Copy the key (starts with `re_`)

---

## 🌐 Step 2: Deploy Web App (3 minutes)

```bash
cd /home/roshan/development/personal/pulse-guard/apps/web

# Login to Vercel
vercel login

# Deploy (first time - this creates the project)
vercel

# Set environment variables (required)
vercel env add DATABASE_URL production
# Paste your Neon connection string (pooled)

vercel env add REDIS_URL production
# Paste your Upstash Redis URL

vercel env add RESEND_API_KEY production
# Paste your Resend API key

# Generate and set auth secret
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo $NEXTAUTH_SECRET | vercel env add NEXTAUTH_SECRET production

JWT_SECRET=$(openssl rand -base64 32)
echo $JWT_SECRET | vercel env add JWT_SECRET production

# Set other required vars
echo "production" | vercel env add NODE_ENV production
echo "noreply@yourdomain.com" | vercel env add FROM_EMAIL production

# Deploy to production with env vars
vercel --prod
```

**Get your URL:**
```bash
vercel inspect --wait | grep "URL:"
# Example: https://pulseguard-abc123.vercel.app
```

**Set the URL in env vars:**
```bash
# Replace with your actual URL
YOUR_URL="https://pulseguard-abc123.vercel.app"
echo $YOUR_URL | vercel env add NEXTAUTH_URL production
echo $YOUR_URL | vercel env add NEXT_PUBLIC_APP_URL production
echo $YOUR_URL | vercel env add NEXT_PUBLIC_API_URL production

# Redeploy to pick up new vars
vercel --prod
```

---

## 📊 Step 3: Run Database Migrations (1 minute)

```bash
cd /home/roshan/development/personal/pulse-guard/packages/db

# Set your database URL
export DATABASE_URL="YOUR_NEON_CONNECTION_STRING"

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

---

## 🔨 Step 4: Deploy Worker (3 minutes)

```bash
cd /home/roshan/development/personal/pulse-guard/apps/worker

# Login to Fly.io
flyctl auth login

# Create and deploy (first time)
flyctl launch --no-deploy

# When prompted:
# - App name: pulseguard-worker
# - Region: Choose closest to your database
# - PostgreSQL: No
# - Redis: No

# Set secrets
flyctl secrets set \
  DATABASE_URL="YOUR_NEON_CONNECTION_STRING" \
  REDIS_URL="YOUR_UPSTASH_REDIS_URL" \
  RESEND_API_KEY="YOUR_RESEND_API_KEY" \
  FROM_EMAIL="noreply@yourdomain.com"

# Deploy
flyctl deploy
```

---

## ✅ Step 5: Verify Everything Works

### Test Web App
```bash
# Test health endpoint (replace with your URL)
curl https://pulseguard-abc123.vercel.app/api/health

# Expected response:
# {"status":"healthy","checks":{"database":{"status":"healthy"},"redis":{"status":"healthy"}}}
```

### Test Worker
```bash
# Check worker status
flyctl status --app pulseguard-worker

# View logs
flyctl logs --app pulseguard-worker

# Should see:
# ✅ Database connected
# ✅ All workers running
```

### Create Your First Monitor
1. Visit your web app URL
2. Click "Sign Up"
3. Create an account
4. Create a new organization
5. Create a monitor (e.g., check every 5 minutes)
6. Test the ping URL:
   ```bash
   curl https://pulseguard-abc123.vercel.app/api/ping/YOUR_MONITOR_ID
   ```

---

## 🎉 Success!

Your PulseGuard instance is now live!

**Your URLs:**
- 🌐 Web App: `https://your-app.vercel.app`
- 🔨 Worker: `https://pulseguard-worker.fly.dev`

**What you got:**
- ✅ Serverless web app on Vercel
- ✅ Background worker on Fly.io
- ✅ PostgreSQL database on Neon
- ✅ Redis cache on Upstash
- ✅ Email delivery via Resend
- ✅ All running on free tiers!

---

## 🔄 Quick Commands for Later

### Update Web App
```bash
cd /home/roshan/development/personal/pulse-guard/apps/web
vercel --prod
```

### Update Worker
```bash
cd /home/roshan/development/personal/pulse-guard/apps/worker
flyctl deploy
```

### View Logs
```bash
# Web app logs
vercel logs

# Worker logs
flyctl logs --app pulseguard-worker -f
```

### Manage Environment Variables
```bash
# List env vars
vercel env ls

# Add new env var
vercel env add VARIABLE_NAME production

# Pull env vars locally
vercel env pull .env.production
```

---

## 💰 Free Tier Limits

**Vercel:**
- Unlimited deployments
- 100 GB bandwidth/month
- Serverless functions: 100 GB-hours

**Fly.io:**
- 3 shared VMs
- 160 GB outbound transfer
- 3 GB storage

**Neon:**
- 0.5 GB storage
- 191 compute hours/month

**Upstash:**
- 10,000 commands/day
- 256 MB storage

**Resend:**
- 100 emails/day
- 1 domain

This setup will easily handle:
- 100+ monitors
- 10,000+ pings/day
- Small team usage

---

## 🚨 Troubleshooting

### Web app build fails
```bash
# Clear cache and retry
vercel --prod --force
```

### Worker won't start
```bash
# Check secrets are set
flyctl secrets list --app pulseguard-worker

# View detailed logs
flyctl logs --app pulseguard-worker
```

### Database connection issues
```bash
# Test connection
cd packages/db
npx prisma db pull
```

### Redis connection issues
```bash
# Test Redis connection
redis-cli -u "YOUR_REDIS_URL" ping
```

---

## 📚 Next Steps

1. **Custom Domain**
   ```bash
   vercel domains add yourdomain.com
   ```

2. **Set up Stripe** (for billing)
   - See `docs/STRIPE.md`

3. **Configure Slack Integration**
   - See `docs/integrations/slack.md`

4. **Enable Error Tracking**
   - See `docs/SENTRY_SETUP.md`

5. **Scale Up**
   ```bash
   # Scale worker
   flyctl scale count 2 --app pulseguard-worker
   flyctl scale memory 1024 --app pulseguard-worker
   ```

---

## 🆘 Need Help?

- 📖 Full guide: `DEPLOY_CLI.md`
- 🐛 Issues: Check logs first
- 💬 Community: [Your Discord/Slack]

**Common Issues:**
- Environment variables not set → Run `vercel env ls` to check
- Worker not processing → Check `flyctl logs`
- Database errors → Verify connection strings

---

**Congratulations! You're now running PulseGuard in production! 🎊**

