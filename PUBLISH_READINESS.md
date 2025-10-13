# Tokiflow - Publish Readiness Checklist

This document outlines what's needed to prepare Tokiflow for production and acquire real users.

## ✅ Completed

### Infrastructure & Services
- [x] Docker Compose for local dev (Postgres, Redis, MinIO, Selenium)
- [x] Database schema with Prisma migrations
- [x] NextAuth.js authentication (credentials, Google OAuth, email magic links)
- [x] S3/MinIO for output capture
- [x] Next.js 15 web app with server-side rendering
- [x] Background worker with BullMQ for alerts
- [x] Rate limiting (in-memory, with Redis option)
- [x] Welford statistics for anomaly detection

### Testing
- [x] Playwright e2e tests (166 specs, API tests passing)
- [x] Jest unit tests (3 specs passing)
- [x] Selenium WebDriver smoke test (homepage + signin validation)
- [x] Build process (Next.js build completes successfully)

### API & Features
- [x] Ping API endpoint (`/api/ping/[token]`) for heartbeats
- [x] Monitor CRUD operations
- [x] Incident tracking and management
- [x] Alert channels (Email, Slack, Discord, Webhook)
- [x] Analytics dashboard with health scores
- [x] Output capture with redaction
- [x] Schedule support (Interval & Cron)
- [x] Maintenance windows

---

## 🚧 Required for Production Launch

### 1. Environment & Configuration

#### Production Environment Variables
Create `.env.production` or configure in your hosting platform:

```bash
# Required
DATABASE_URL=postgresql://user:password@host:5432/pulseguard_prod
NEXTAUTH_URL=https://tokiflow.co
NEXTAUTH_SECRET=<generate-strong-random-secret>

# OAuth Providers (at least one)
GOOGLE_CLIENT_ID=<google-oauth-client-id>
GOOGLE_CLIENT_SECRET=<google-oauth-client-secret>

# S3 Storage (AWS or compatible)
S3_REGION=us-east-1
S3_ENDPOINT=https://s3.amazonaws.com  # or your S3-compatible endpoint
S3_ACCESS_KEY_ID=<your-access-key>
S3_SECRET_ACCESS_KEY=<your-secret-key>
S3_BUCKET=tokiflow-outputs
S3_FORCE_PATH_STYLE=false  # true for MinIO, false for AWS S3

# Email (Resend recommended)
EMAIL_FROM=noreply@tokiflow.co
RESEND_API_KEY=<your-resend-api-key>

# Slack (optional but recommended)
SLACK_CLIENT_ID=<slack-app-client-id>
SLACK_CLIENT_SECRET=<slack-app-client-secret>
SLACK_SIGNING_SECRET=<slack-signing-secret>

# Stripe (for billing)
STRIPE_SECRET_KEY=<stripe-secret-key>
STRIPE_PUBLISHABLE_KEY=<stripe-publishable-key>
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>
STRIPE_PRICE_ID_PRO=<stripe-price-id>
STRIPE_PRICE_ID_BUSINESS=<stripe-price-id>

# Redis (recommended for production)
REDIS_URL=redis://redis:6379

# Site & SEO
SITE_URL=https://tokiflow.co
```

#### Generate Secrets
```bash
# NEXTAUTH_SECRET
openssl rand -base64 32

# API keys for integrations (see below)
```

### 2. Third-Party Service Setup

#### A. Database (PostgreSQL)
- [ ] **Provision production PostgreSQL** (Recommended: Supabase, Railway, Render, AWS RDS)
  - Minimum: 1GB RAM, 10GB storage
  - Enable automated backups
  - Configure connection pooling (e.g., PgBouncer)
- [ ] **Run migrations**: `cd packages/db && DATABASE_URL=<prod-url> npx prisma migrate deploy`
- [ ] **Create initial admin user** (modify `packages/db/src/seed.ts` with your email)

#### B. Object Storage (S3 or MinIO)
- [ ] **AWS S3 Bucket** or **DigitalOcean Spaces** or **self-hosted MinIO**
  - Create bucket: `tokiflow-outputs`
  - Configure CORS for presigned URLs
  - Set lifecycle policy (optional): auto-delete outputs after 90 days
- [ ] **IAM User/Credentials**
  - Permissions: `s3:PutObject`, `s3:GetObject` on the bucket
  - Generate access key + secret

#### C. Email Service (Resend or SendGrid)
- [ ] **Sign up for Resend** (https://resend.com) - FREE tier: 100 emails/day
  - Or use SendGrid, Mailgun, AWS SES
- [ ] **Verify domain** for sender email (`noreply@tokiflow.co`)
- [ ] **Get API key**

#### D. Google OAuth (NextAuth)
- [ ] **Google Cloud Console**: https://console.cloud.google.com
  - Create new project: "Tokiflow"
  - Enable "Google+ API"
  - Create OAuth 2.0 credentials
  - Authorized redirect URIs: `https://tokiflow.co/api/auth/callback/google`
  - Copy Client ID & Secret

#### E. Slack Integration (Optional but highly valuable)
- [ ] **Create Slack App**: https://api.slack.com/apps
  - Enable OAuth scopes: `chat:write`, `incoming-webhook`, `commands`
  - Add Slash Command: `/pulse` → `https://tokiflow.co/api/slack/commands`
  - Add Interactivity URL: `https://tokiflow.co/api/slack/actions`
  - Install URL: `https://tokiflow.co/api/slack/install`
  - Copy Client ID, Client Secret, Signing Secret

#### F. Stripe (Billing)
- [ ] **Stripe Account**: https://stripe.com
  - Create products for PRO ($19/mo) and BUSINESS ($49/mo)
  - Get Price IDs (starts with `price_...`)
  - Set up webhook endpoint: `https://tokiflow.co/api/stripe/webhook`
  - Webhook events: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, `invoice.payment_failed`
  - Copy secret keys and webhook secret

#### G. Redis (Optional but recommended)
- [ ] **Provision Redis** (Upstash, Redis Cloud, Railway, or self-hosted)
  - Used for: rate limiting, BullMQ worker queues
  - Minimum: 256MB RAM
  - Get connection URL

### 3. Deployment

#### Option A: Vercel (Recommended for Next.js)
- [ ] **Deploy web app**
  ```bash
  cd apps/web
  vercel deploy --prod
  ```
- [ ] **Configure environment variables** in Vercel dashboard
- [ ] **Deploy worker** separately (Railway, Render, or DigitalOcean App Platform)
  ```bash
  cd apps/worker
  # Deploy as Node.js service
  ```

#### Option B: Docker + VPS
- [ ] **Provision VPS** (DigitalOcean, Linode, Hetzner)
  - Minimum: 2GB RAM, 2 vCPUs, 50GB storage
- [ ] **Install Docker & Docker Compose**
- [ ] **Clone repository** on server
- [ ] **Create production docker-compose.yml** (exclude dev services)
- [ ] **Deploy**:
  ```bash
  docker compose -f docker-compose.prod.yml up -d
  ```
- [ ] **Set up reverse proxy** (Nginx or Caddy) with SSL/TLS
  - Let's Encrypt for free SSL certificates

#### Option C: Kubernetes (For scale)
- [ ] Use Helm charts in `integrations/kubernetes/helm/`
- [ ] Configure ingress with TLS
- [ ] Set up horizontal pod autoscaling

### 4. Domain & DNS
- [ ] **Purchase domain**: tokiflow.co (or your choice)
- [ ] **Configure DNS**:
  - `A` or `CNAME` record → your hosting IP/URL
  - `MX` records if using custom email
- [ ] **SSL Certificate**: Let's Encrypt or Cloudflare
- [ ] **Update NEXTAUTH_URL** and **SITE_URL** to production domain

### 5. Monitoring & Observability
- [ ] **Error tracking**: Sentry (https://sentry.io)
  - FREE tier: 5,000 events/month
  - Add Sentry SDK to Next.js and worker
- [ ] **Uptime monitoring**: Use Tokiflow to monitor itself! 🎉
  - Create monitor for web app health check
  - Create monitor for worker liveness
- [ ] **Application monitoring**: Vercel Analytics or Datadog
- [ ] **Database monitoring**: Built-in DB platform tools

### 6. Security Hardening
- [ ] **Review CORS settings** in API routes
- [ ] **Enable rate limiting with Redis** (replace in-memory)
  - See: `apps/web/src/lib/rate-limit.ts`
- [ ] **Audit environment variables** (no secrets in code)
- [ ] **Set up CSP headers** in `next.config.ts`
- [ ] **Enable HTTPS only** (HSTS headers)
- [ ] **Webhook signature verification** for Stripe & Slack
- [ ] **API key rotation policy** for long-term keys

### 7. Legal & Compliance
- [ ] **Privacy Policy** (required for Google OAuth, EU users)
  - Use template generators (Termly, iubenda)
- [ ] **Terms of Service**
- [ ] **GDPR compliance** if targeting EU
  - Add data export/deletion endpoints
  - Cookie consent banner
- [ ] **SOC 2 / ISO 27001** (for enterprise customers, optional at launch)

### 8. Marketing & User Acquisition

#### Pre-Launch
- [ ] **Landing page** (already exists at `/` ✅)
- [ ] **Documentation**:
  - Getting Started guide
  - API reference
  - Integration examples (Bash, Python, Node.js, CLI)
  - Webhook signature verification guide
- [ ] **Blog** (optional): Launch announcement, how-to guides
- [ ] **SEO optimization**:
  - Meta tags (done ✅)
  - Sitemap (done ✅)
  - robots.txt (done ✅)
  - Structured data / JSON-LD (done ✅)

#### Launch Channels
- [ ] **Product Hunt** (https://producthunt.com)
  - Prepare screenshots, demo video
  - Launch on Tuesday-Thursday for best visibility
- [ ] **Hacker News** (Show HN)
  - Title: "Show HN: Tokiflow – Cron monitoring with Slack alerts and anomaly detection"
- [ ] **Reddit**: r/selfhosted, r/devops, r/sysadmin
- [ ] **Twitter/X**: Tech influencers, DevOps community
- [ ] **Dev.to**: Write launch post with tutorial
- [ ] **GitHub**: Add README badges, star your own repo, share in communities

#### Content Marketing
- [ ] **Comparison pages**: "Tokiflow vs Cronitor", "Tokiflow vs Healthchecks.io"
- [ ] **Use case guides**: "Monitor Kubernetes CronJobs", "Monitor Airflow DAGs"
- [ ] **Integration guides**: WordPress plugin (exists ✅), Kubernetes sidecar (exists ✅)

### 9. Pricing & Billing
- [ ] **Stripe Products configured** (see `apps/web/src/lib/stripe.ts`)
  - FREE: 5 monitors, 3 users
  - PRO: $19/mo - 100 monitors, 10 users
  - BUSINESS: $49/mo - 500 monitors, unlimited users
- [ ] **Billing portal** tested
- [ ] **Webhook handlers** verified
- [ ] **Dunning emails** configured in Stripe

### 10. Support & Feedback
- [ ] **Support email**: support@tokiflow.co
  - Use Crisp, Intercom, or plain email
- [ ] **In-app feedback**: Feedback widget or link
- [ ] **Status page**: status.tokiflow.co (optional: use StatusPage.io)
- [ ] **Community**: Discord server or Slack community (optional)
- [ ] **GitHub Issues**: Enable for bug reports and feature requests

---

## 🔧 Pre-Launch Testing Checklist

Run these tests before going live:

### Functional Testing
- [ ] **Sign up flow**: Create account, verify email works
- [ ] **Monitor creation**: Create monitor via UI
- [ ] **Ping API**: Test heartbeat, start/success, fail pings
- [ ] **Incident creation**: Trigger missed/late/fail incidents
- [ ] **Alert delivery**: Verify email, Slack, Discord, webhook alerts
- [ ] **Billing**: Test Stripe checkout and subscription management
- [ ] **Output capture**: Upload to S3, view in UI, redaction working
- [ ] **Analytics**: Health scores, uptime, MTBF/MTTR calculated correctly
- [ ] **Anomaly detection**: Create monitors with varying durations, verify z-score alerts

### Load Testing
- [ ] **Ping API**: 100+ requests/sec (use Apache Bench or k6)
- [ ] **Database**: Ensure indexes are optimized
- [ ] **Worker**: Test alert queue processing at scale

### Security Testing
- [ ] **OWASP Top 10**: SQL injection, XSS, CSRF (Next.js handles most)
- [ ] **Authentication**: Test session expiry, logout, token refresh
- [ ] **Authorization**: Test org isolation (users can't access others' monitors)
- [ ] **Rate limiting**: Verify API endpoints are protected

---

## 📋 Missing / Nice-to-Have Features

### Critical for Launch
1. **Email sending** (currently logging to console)
   - Configure Resend API in `apps/web/src/lib/email.ts`
2. **Worker deployment** (alerts won't send without it)
   - `apps/worker` needs to run as a separate service
3. **Stripe price IDs** need to be configured
   - Update `apps/web/src/lib/stripe.ts` with real Stripe price IDs

### High Priority (Post-Launch)
1. **Monitor editing UI** (create exists, but edit/delete are buttons with no handlers)
2. **Team invitations** (button exists, no implementation)
3. **API key management UI** (model exists, no UI)
4. **Incident filtering** (UI shows all, add filters by status/kind)
5. **Notification preferences** (per-user alert settings)
6. **Timezone support improvements** (CRON expressions respect timezone but UI could be clearer)
7. **Onboarding flow** (guide new users through first monitor setup)
8. **CLI improvements** (`packages/cli` exists but needs better UX)

### Medium Priority
1. **Monitor dependencies** (model exists, UI missing)
2. **Anomaly detection tuning UI** (thresholds are hardcoded)
3. **Export data** (for GDPR compliance)
4. **Audit logs UI** (model tracks changes, no UI to view)
5. **Advanced Slack features** (message threading works, add slash commands UI)
6. **Discord integration** (webhook support exists, add OAuth flow like Slack)
7. **PagerDuty integration**
8. **Datadog/Prometheus metrics export**

### Low Priority / Future
1. **Mobile app** (React Native or PWA)
2. **SSO (SAML, LDAP)** for enterprise
3. **Multi-region** (deploy across regions for low latency)
4. **Self-hosted edition** (Docker Compose + Helm chart exist, needs docs)
5. **AI-powered root cause analysis** (LLM analyzes failures)
6. **Custom dashboards** (user-defined charts and metrics)

---

## 🚀 Launch Week Checklist

### Week -2: Final Prep
- [ ] Set up production infrastructure
- [ ] Configure all environment variables
- [ ] Run migrations on prod DB
- [ ] Deploy web app + worker to staging
- [ ] Full smoke test on staging
- [ ] Load test on staging

### Week -1: Go-Live
- [ ] Deploy to production
- [ ] Verify all integrations (Stripe, Slack, Email)
- [ ] Create your own account and first monitor
- [ ] Test end-to-end: ping → alert delivery
- [ ] Set up status page
- [ ] Prepare launch materials (screenshots, demo video)

### Launch Day
- [ ] **Morning**: Soft launch to friends/beta users
- [ ] **Afternoon**: Submit to Product Hunt (10am PT for best visibility)
- [ ] **Evening**: Post to Hacker News, Twitter, Reddit
- [ ] Monitor error rates and fix critical bugs immediately
- [ ] Respond to all comments and feedback

### Week +1: Post-Launch
- [ ] Collect user feedback
- [ ] Fix top 3 reported bugs
- [ ] Monitor usage and server performance
- [ ] Send thank-you email to early adopters
- [ ] Plan feature roadmap based on feedback

---

## 💰 Expected Costs (Monthly)

### Minimal Setup (0-100 users)
- **Hosting (Vercel + Railway)**: $0-20
- **Database (Supabase Free or Railway)**: $0-10
- **Redis (Upstash Free)**: $0
- **S3 Storage (AWS Free Tier)**: $0-5
- **Email (Resend Free)**: $0
- **Domain (.co)**: ~$30/year = $2.50/month
- **SSL (Let's Encrypt)**: $0

**Total: ~$5-35/month** (can start almost free)

### Growth Setup (100-1000 users)
- **Hosting**: $20-100
- **Database**: $25-50
- **Redis**: $10-25
- **S3**: $10-50 (depends on output capture usage)
- **Email**: $10-50 (Resend paid tier)

**Total: ~$75-275/month**

### Scale Setup (1000+ users)
- Consider dedicated infrastructure
- Add CDN (Cloudflare, Vercel Edge)
- Multi-region deployment
- Dedicated support

---

## 🎯 Key Metrics to Track

1. **User Acquisition**
   - Signups per day
   - Activation rate (created first monitor)
   - Conversion rate (free → paid)

2. **Product Engagement**
   - Monitors created
   - Pings received per day
   - Incidents created
   - Alerts sent
   - Dashboard DAU/MAU

3. **Technical Health**
   - API uptime (target: 99.9%)
   - Ping API p95 latency (target: <200ms)
   - Alert delivery time (target: <30s)
   - Error rate (target: <0.1%)

4. **Business**
   - Monthly Recurring Revenue (MRR)
   - Churn rate
   - Customer Acquisition Cost (CAC)
   - Lifetime Value (LTV)

---

## 🐛 Known Issues to Fix Before Launch

1. **Playwright browser dependencies** missing on host
   - Run: `sudo npx playwright install-deps` (or use CI/CD with Docker)
   - Or: Use Playwright Docker container for testing

2. **Some e2e tests use old DB schema**
   - Update tests to use `pulseguard_e2e` database
   - Or regenerate Prisma client in test setup

3. **Jest/Bun compatibility issue** (resolved by using Node)
   - Tests pass with `npx jest` instead of `bun run jest`

4. **Monitor edit/delete handlers** not implemented
   - Add API routes and UI handlers before launch

5. **Slack message threading** needs testing with real Slack workspace

---

## 📚 Documentation Needed

### For Users
1. **Quick Start Guide**
   - Sign up → Create monitor → Send ping → View dashboard
2. **Integration Examples**
   - Bash/cron
   - Python scripts
   - Node.js apps
   - Docker containers
   - Kubernetes CronJobs (exists in `integrations/kubernetes/`)
3. **API Reference**
   - Ping API parameters
   - Webhook payload format
4. **Troubleshooting**
   - Common issues: "Monitor not receiving pings", "Alerts not sending"

### For Developers (Self-Hosted)
1. **Installation Guide**
   - Docker Compose setup
   - Kubernetes Helm chart
2. **Configuration Guide**
   - Environment variables
   - OAuth setup
   - Webhook configuration
3. **Upgrade Guide**
   - Database migrations
   - Zero-downtime deploys

---

## 🎁 Competitive Advantages

What makes Tokiflow unique:

1. **Anomaly Detection** - Automatic runtime performance alerts using Welford statistics
2. **Slack-First** - Rich message threading, slash commands, interactive buttons
3. **Output Capture** - View job output directly in dashboard with redaction
4. **Modern Stack** - Next.js 15, Prisma, TypeScript, great DX
5. **Self-Hostable** - Full Docker Compose and Kubernetes support
6. **Open Source Friendly** - Clean codebase, well-documented

---

## 📞 Support Contacts for Launch

If you need help with:
- **Stripe setup**: support@stripe.com
- **Vercel deployment**: vercel.com/support
- **Slack app approval**: api.slack.com/support
- **Google OAuth**: Cloud Console support
- **DNS/Domain**: Your registrar's support

---

## ✅ Final Pre-Launch Command

Run this to verify everything works:

```bash
# 1. Build production bundle
cd apps/web && bun run build

# 2. Run unit tests
bun run test:unit

# 3. Run API e2e tests (without browser)
SKIP_SERVER=1 BASE_URL=http://localhost:3001 npx playwright test e2e/ping-api.spec.ts --project=chromium

# 4. Run Selenium smoke
BASE_URL=http://localhost:3001 bun --bun run scripts/selenium-smoke.ts

# 5. Test ping endpoint
curl http://localhost:3001/api/ping/pg_automation_test

# 6. Check production build starts
bun run start
```

If all pass → **Ready to deploy** 🚀

---

**Questions or need help?** Open an issue or reach out!


