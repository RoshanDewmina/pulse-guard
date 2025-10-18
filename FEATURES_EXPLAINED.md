# Features Explained - Saturn Monitoring

## 🔒 SSL Certificate Monitoring

### What It Does

SSL Certificate Monitoring automatically checks SSL/TLS certificates for your monitored domains and alerts you **before** they expire.

**Key Features:**
- ✅ Automatic certificate expiry checking
- ✅ Configurable alert thresholds (default: 30, 14, 7 days before expiry)
- ✅ Tracks certificate changes (issuer, validity period)
- ✅ Creates incidents when certificates are about to expire
- ✅ Runs every 6 hours automatically

**What It Checks:**
- Certificate expiration date
- Days until expiry
- Certificate issuer (CA)
- Domain validity
- Certificate chain health

**Status:** ✅ **FULLY FUNCTIONAL** - Running in production

### How It Works

1. **Enable SSL checking** for a monitor (set `checkSsl: true`)
2. Worker checks the SSL certificate every 6 hours
3. Calculates days until expiry
4. Compares against thresholds: `[30, 14, 7]` days
5. Creates incident if threshold is crossed
6. Sends alerts through configured channels

### Configuration

**Per Monitor:**
```typescript
monitor.checkSsl = true                      // Enable SSL checking
monitor.sslAlertThresholds = [30, 14, 7]     // Alert at 30, 14, and 7 days
```

**Database Schema:**
```prisma
model SslCertificate {
  id              String    @id
  monitorId       String
  domain          String
  isValid         Boolean
  issuer          String
  validFrom       DateTime
  validTo         DateTime
  daysUntilExpiry Int
  lastCheckedAt   DateTime
}
```

### Example Use Cases

1. **E-commerce site** - Get alerted 30 days before your checkout page SSL expires
2. **API endpoints** - Monitor multiple API domain certificates
3. **Customer-facing apps** - Prevent SSL errors that scare customers
4. **Internal services** - Track expiry of internal SSL certs

---

## 🌐 Domain Expiration Monitoring

### What It Does

Domain Expiration Monitoring tracks your domain registration expiry dates using WHOIS lookups and alerts you before your domains expire.

**Key Features:**
- ✅ WHOIS-based domain expiration checking
- ✅ Configurable alert thresholds (default: 60, 30, 14 days before expiry)
- ✅ Tracks registrar changes
- ✅ Creates incidents when domains are about to expire
- ✅ Runs every 24 hours automatically

**What It Checks:**
- Domain expiration date
- Days until expiry
- Domain registrar
- WHOIS record availability

**Status:** ✅ **FULLY FUNCTIONAL** - Running in production

### How It Works

1. **Enable domain checking** for a monitor (set `checkDomain: true`)
2. Worker performs WHOIS lookup every 24 hours
3. Parses expiration date from WHOIS data
4. Calculates days until expiry
5. Compares against thresholds: `[60, 30, 14]` days
6. Creates incident if threshold is crossed
7. Sends alerts through configured channels

### Configuration

**Per Monitor:**
```typescript
monitor.checkDomain = true                      // Enable domain checking
monitor.domainAlertThresholds = [60, 30, 14]    // Alert at 60, 30, and 14 days
```

**Database Schema:**
```prisma
model DomainExpiration {
  id              String    @id
  monitorId       String
  domain          String
  expiresAt       DateTime
  daysUntilExpiry Int
  registrar       String?
  lastCheckedAt   DateTime
}
```

### Example Use Cases

1. **Company domain** - Never let your main domain expire
2. **Multiple TLDs** - Track .com, .net, .io, etc.
3. **Client domains** - Monitor domains you manage for clients
4. **Temporary campaigns** - Track promo domain expiries

---

## 📧 Environment Variables You Need

### 🔴 **REQUIRED** (Must Have)

These are **essential** for the app to work:

```bash
# Database (PostgreSQL)
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"
DIRECT_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

# Redis (For queues and caching)
REDIS_URL="redis://default:password@host:port"

# NextAuth (Authentication)
NEXTAUTH_SECRET="your-random-32-char-secret"
NEXTAUTH_URL="https://your-domain.com"

# MFA Encryption (REQUIRED after migration)
MFA_ENC_KEY="base64-encoded-32-byte-key"
```

### 🟡 **RECOMMENDED** (For Full Features)

These enable important features:

```bash
# Email Provider (Resend) - For magic links, alerts
RESEND_API_KEY="re_xxxxx"
RESEND_FROM_EMAIL="hello@yourdomain.com"
RESEND_FROM_NAME="Your App Name"

# Twilio (SMS Alerts) - For SMS notifications
TWILIO_ACCOUNT_SID="ACxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_FROM_NUMBER="+15551234567"

# PostHog (Analytics) - For user analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_xxxxx"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
NEXT_PUBLIC_POSTHOG_ENABLED="true"

# Staff Access - For internal health endpoint
IS_STAFF_EMAILS="admin@yourdomain.com,staff@yourdomain.com"
```

### 🟢 **OPTIONAL** (Nice to Have)

These are for additional integrations:

```bash
# Sentry (Error Tracking)
SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"
NEXT_PUBLIC_SENTRY_DSN="https://xxxxx@sentry.io/xxxxx"

# Stripe (Billing)
STRIPE_SECRET_KEY="sk_test_xxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"

# OAuth Providers
GITHUB_CLIENT_ID="your-github-oauth-id"
GITHUB_CLIENT_SECRET="your-github-oauth-secret"
GOOGLE_CLIENT_ID="your-google-oauth-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-secret"
```

---

## 🎯 Where to Get These Variables

### 1. **Database (Neon, Supabase, Railway, etc.)**

**Recommended:** [Neon.tech](https://neon.tech) (Free PostgreSQL with generous limits)

**Steps:**
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string
4. Use it for both `DATABASE_URL` and `DIRECT_URL`

**Example:**
```bash
DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/dbname?sslmode=require"
```

### 2. **Redis (Upstash, Railway, Redis Cloud)**

**Recommended:** [Upstash](https://upstash.com) (Serverless Redis, free tier)

**Steps:**
1. Sign up at https://upstash.com
2. Create a Redis database
3. Copy the Redis URL (with password)
4. Use it for `REDIS_URL`

**Example:**
```bash
REDIS_URL="redis://default:password@abc-xyz.upstash.io:6379"
```

### 3. **NextAuth Secret**

**Generate yourself:**
```bash
# Option 1: Using openssl
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and use it for `NEXTAUTH_SECRET`.

### 4. **MFA Encryption Key**

**Generate yourself:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

⚠️ **IMPORTANT:** Keep this secret safe! If compromised, all MFA secrets must be re-enrolled.

### 5. **Email (Resend)**

**Sign up:** [Resend.com](https://resend.com) (100 emails/day free)

**Steps:**
1. Sign up at https://resend.com
2. Add your domain
3. Verify DNS records
4. Create an API key
5. Copy the API key

**Example:**
```bash
RESEND_API_KEY="re_123abc456def"
RESEND_FROM_EMAIL="hello@yourdomain.com"
```

### 6. **SMS (Twilio)**

**Sign up:** [Twilio.com](https://twilio.com/try-twilio) (Free trial with $15 credit)

**Steps:**
1. Sign up at https://twilio.com/try-twilio
2. Get a phone number
3. Copy Account SID and Auth Token from dashboard
4. Use your Twilio number as FROM number

**Example:**
```bash
TWILIO_ACCOUNT_SID="ACa1b2c3d4e5f6..."
TWILIO_AUTH_TOKEN="your-auth-token-here"
TWILIO_FROM_NUMBER="+15551234567"
```

### 7. **Analytics (PostHog)**

**Sign up:** [PostHog.com](https://posthog.com) (1M events/month free)

**Steps:**
1. Sign up at https://posthog.com
2. Create a project
3. Copy the Project API Key
4. Use `https://us.i.posthog.com` or your region's host

**Example:**
```bash
NEXT_PUBLIC_POSTHOG_KEY="phc_abc123xyz"
NEXT_PUBLIC_POSTHOG_HOST="https://us.i.posthog.com"
```

### 8. **Error Tracking (Sentry)**

**Sign up:** [Sentry.io](https://sentry.io) (5K errors/month free)

**Steps:**
1. Sign up at https://sentry.io
2. Create a Next.js project
3. Copy the DSN from project settings
4. Use it for both web and worker

**Example:**
```bash
SENTRY_DSN="https://abc123@o123456.ingest.sentry.io/123456"
```

---

## 📝 Quick Setup Checklist

### Essential (Required)
- [ ] Sign up for Neon (database)
- [ ] Sign up for Upstash (Redis)
- [ ] Generate NextAuth secret
- [ ] Generate MFA encryption key
- [ ] Set all 6 required env vars in Vercel
- [ ] Set all 6 required secrets in Fly.io

### Recommended (For Full Features)
- [ ] Sign up for Resend (email)
- [ ] Sign up for Twilio (SMS) - optional
- [ ] Sign up for PostHog (analytics) - optional
- [ ] Add staff emails for health endpoint

### Optional (Advanced)
- [ ] Set up Sentry for error tracking
- [ ] Set up Stripe for billing
- [ ] Configure OAuth providers

---

## 🔗 Quick Links

### Service Signups
- 🐘 **Database:** https://neon.tech
- 🔴 **Redis:** https://upstash.com
- 📧 **Email:** https://resend.com
- 📱 **SMS:** https://twilio.com/try-twilio
- 📊 **Analytics:** https://posthog.com
- 🐛 **Errors:** https://sentry.io

### Deployment Platforms
- ▲ **Web App:** https://vercel.com
- 🪂 **Worker:** https://fly.io

### Documentation
- 📚 **Full Deployment Guide:** `/DEPLOYMENT.md`
- 📝 **Environment Variables:** `/ENV_VARS.md`
- ✅ **Feature Summary:** `/LAUNCH_READINESS_COMPLETE.md`

---

## 🎉 You're Ready!

1. ✅ SSL & Domain monitoring are **fully functional**
2. ✅ Sign up for required services (Neon, Upstash)
3. ✅ Generate required secrets (NextAuth, MFA)
4. ✅ Set environment variables in Vercel
5. ✅ Set secrets in Fly.io
6. ✅ Deploy and test!

**Need help?** Check the troubleshooting section in `DEPLOYMENT.md` or the detailed guides in `ENV_VARS.md`.

