# Tokiflow - Quick Start Deployment Guide

Get Tokiflow running in production in under 30 minutes.

## 🚀 Fastest Path to Production

### Option 1: Vercel + Supabase (Easiest, ~15 minutes)

#### Step 1: Database (Supabase - FREE)
```bash
# 1. Go to https://supabase.com
# 2. Create new project
# 3. Get connection string from Settings → Database
#    Format: postgresql://postgres:[password]@[host]:5432/postgres
# 4. Run migrations:
cd packages/db
DATABASE_URL="your-supabase-url" npx prisma migrate deploy
DATABASE_URL="your-supabase-url" bun run seed
```

#### Step 2: Storage (Supabase Storage - FREE)
```bash
# In Supabase Dashboard:
# 1. Go to Storage → Create bucket: "pulseguard-outputs"
# 2. Set bucket to public
# 3. Get API URL and anon key
```

#### Step 3: Email (Resend - FREE tier)
```bash
# 1. Go to https://resend.com
# 2. Sign up (100 emails/day free)
# 3. Verify your domain (or use resend.dev for testing)
# 4. Get API key
```

#### Step 4: OAuth (Google - FREE)
```bash
# 1. Go to https://console.cloud.google.com
# 2. Create project "Tokiflow"
# 3. Enable Google+ API
# 4. Create OAuth credentials
# 5. Add redirect URI: https://your-app.vercel.app/api/auth/callback/google
# 6. Copy Client ID and Secret
```

#### Step 5: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd apps/web
vercel

# Configure environment variables in Vercel dashboard:
DATABASE_URL=postgresql://...  # From Step 1
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=...  # From Step 4
GOOGLE_CLIENT_SECRET=...
S3_REGION=us-east-1
S3_ENDPOINT=https://[project-ref].supabase.co/storage/v1/s3
S3_ACCESS_KEY_ID=...  # Supabase service key
S3_SECRET_ACCESS_KEY=...
S3_BUCKET=pulseguard-outputs
RESEND_API_KEY=...  # From Step 3
EMAIL_FROM=noreply@yourdomain.com
SITE_URL=https://your-app.vercel.app
```

#### Step 6: Deploy Worker
```bash
# Railway (FREE tier available)
cd apps/worker
# Create railway.json:
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "bun run src/index.ts"
  }
}

# Deploy:
railway login
railway init
railway up

# Configure same env vars as web app
```

**Done!** Your app is live at `https://your-app.vercel.app`

---

### Option 2: Docker VPS (Full Control, ~30 minutes)

#### Prerequisites
- VPS with Ubuntu 22.04+ (DigitalOcean, Hetzner, Linode)
- 2GB RAM minimum, 4GB recommended
- Domain name pointing to your VPS IP

#### Step 1: Server Setup
```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin

# Install Caddy (for SSL)
apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
apt update
apt install caddy
```

#### Step 2: Clone and Configure
```bash
# Clone repo
cd /opt
git clone https://github.com/your-username/pulse-guard.git tokiflow
cd tokiflow

# Create production env file
cat > apps/web/.env.production << EOF
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pulseguard
NEXTAUTH_URL=https://tokiflow.co
NEXTAUTH_SECRET=$(openssl rand -base64 32)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
S3_REGION=us-east-1
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
S3_BUCKET=pulseguard-outputs
RESEND_API_KEY=your_resend_key
EMAIL_FROM=noreply@tokiflow.co
SITE_URL=https://tokiflow.co
REDIS_URL=redis://localhost:6379
EOF

# Start services
docker compose up -d

# Run migrations
cd packages/db
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pulseguard npx prisma migrate deploy
```

#### Step 3: Build and Run
```bash
# Build web app
cd apps/web
bun install
bun run build

# Start with PM2
npm install -g pm2
pm2 start "bun run start" --name tokiflow-web
pm2 startup
pm2 save

# Start worker
cd ../worker
pm2 start "bun run src/index.ts" --name tokiflow-worker
```

#### Step 4: Configure Caddy (SSL)
```bash
# Create Caddyfile
cat > /etc/caddy/Caddyfile << EOF
tokiflow.co {
    reverse_proxy localhost:3000
    encode gzip
    
    # Security headers
    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
    }
}
EOF

# Reload Caddy
systemctl reload caddy
```

**Done!** Your app is live at `https://tokiflow.co`

---

## 🔐 Essential Security Steps

### Before Going Live
1. **Generate strong secrets**:
   ```bash
   openssl rand -base64 32  # NEXTAUTH_SECRET
   openssl rand -hex 32     # Webhook secrets
   ```

2. **Configure Stripe webhooks**:
   - Endpoint: `https://tokiflow.co/api/stripe/webhook`
   - Events: `customer.subscription.*`, `invoice.*`
   - Get webhook secret

3. **Configure Slack app** (if using):
   - Redirect URI: `https://tokiflow.co/api/slack/callback`
   - Request URL: `https://tokiflow.co/api/slack/commands`
   - Interactivity: `https://tokiflow.co/api/slack/actions`

4. **Set up monitoring**:
   - Create a monitor in Tokiflow to monitor Tokiflow!
   - Add health check: `curl https://tokiflow.co/api/health`

5. **Enable backups**:
   - Database: Automated daily backups
   - S3: Enable versioning

---

## 📊 Post-Deployment Checklist

- [ ] Visit homepage: `https://tokiflow.co`
- [ ] Sign up for an account
- [ ] Create your first monitor
- [ ] Send a test ping: `curl https://tokiflow.co/api/ping/YOUR_TOKEN`
- [ ] Verify alert delivery (check email)
- [ ] Test billing flow (Stripe test mode)
- [ ] Check error tracking (Sentry)
- [ ] Monitor resource usage (CPU, RAM, DB connections)

---

## 🆘 Troubleshooting

### "Internal Server Error"
- Check logs: `pm2 logs tokiflow-web` or `vercel logs`
- Verify all env vars are set
- Check database connection: `DATABASE_URL` correct?

### "Monitor not found" on ping
- Check token is correct
- Verify monitor exists in database
- Check rate limiting (60/min per token)

### "Alerts not sending"
- Verify worker is running: `pm2 status` or check Railway/Render
- Check Redis connection
- Verify BullMQ queues are processing
- Check email/Slack credentials

### Database connection errors
- Check connection pooling (use PgBouncer for high traffic)
- Verify firewall allows connections
- Check DATABASE_URL format

---

## 💰 Estimated Setup Time & Cost

### Vercel + Supabase (Recommended for MVP)
- **Setup Time**: 15-20 minutes
- **Monthly Cost**: 
  - Vercel: FREE (Pro: $20/mo for team features)
  - Supabase: FREE (Pro: $25/mo for more resources)
  - Resend: FREE (100 emails/day)
  - Domain: $30/year (~$2.50/mo)
  - **Total: ~$2.50-50/month**

### VPS (Full Control)
- **Setup Time**: 30-45 minutes
- **Monthly Cost**:
  - VPS (DigitalOcean): $12-24/mo (2-4GB RAM)
  - Domain: $30/year (~$2.50/mo)
  - **Total: ~$15-30/month**

### Kubernetes (Overkill for start, but you have Helm charts!)
- **Setup Time**: 1-2 hours
- **Monthly Cost**: $50-200/mo (cluster + managed services)

---

## 🎁 Bonus: One-Command Demo Deploy

For a quick demo/staging deployment:

```bash
# Clone repo
git clone https://github.com/your-username/pulse-guard.git
cd pulse-guard

# Start everything locally
make setup

# Start dev server
make dev

# Visit http://localhost:3000
# Login: dewminaimalsha2003@gmail.com / test123
```

---

**Need help?** Check `PUBLISH_READINESS.md` for comprehensive guide or open an issue on GitHub!


