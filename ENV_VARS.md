# Environment Variables Reference

This document lists all environment variables required for the Saturn monitoring platform, including the new launch readiness features.

## Quick Start

```bash
# Copy the template (if you have access to one)
cp .env.template .env

# Generate required secrets
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # For MFA_ENC_KEY
openssl rand -base64 32  # For NEXTAUTH_SECRET
```

## Core Configuration

### Application

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | `development` | Environment mode |
| `NEXT_PUBLIC_APP_URL` | Yes | - | Public URL of the application |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `DIRECT_URL` | No | - | Direct PostgreSQL connection (for migrations) |

### Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | Yes | - | Redis connection string |

## Authentication

### NextAuth

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXTAUTH_SECRET` | Yes | - | Secret for signing tokens (min 32 chars) |
| `NEXTAUTH_URL` | Yes | - | Base URL for callbacks |

### MFA/2FA (New)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MFA_ENC_KEY` | **Yes** | - | 32-byte base64 key for encrypting TOTP secrets |

**How to generate:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Security note:** Keep this key secure! If compromised, all MFA secrets must be re-enrolled.

## Email Provider

### Resend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | Yes | - | Resend API key |
| `RESEND_FROM_EMAIL` | Yes | - | Sender email address |
| `RESEND_FROM_NAME` | No | `Saturn Monitoring` | Sender display name |

## Alert Channels

### PagerDuty (New)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PAGERDUTY_ENABLED` | No | `true` | Enable PagerDuty integration |

**Note:** Routing keys are stored per-channel in the database.

### Microsoft Teams (New)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TEAMS_ENABLED` | No | `true` | Enable Teams integration |

**Note:** Webhook URLs are stored per-channel in the database.

### Twilio SMS (New)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TWILIO_ENABLED` | No | `true` | Enable SMS alerts |
| `TWILIO_ACCOUNT_SID` | Conditional* | - | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Conditional* | - | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Conditional* | - | Twilio phone number (E.164 format) |

\* Required if `TWILIO_ENABLED=true`

**Rate limits:** 10 SMS per hour per organization (hardcoded for cost control)

## Analytics

### PostHog (New)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_POSTHOG_KEY` | Conditional* | - | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | `https://us.i.posthog.com` | PostHog instance URL |
| `NEXT_PUBLIC_POSTHOG_ENABLED` | No | `true` | Enable analytics tracking |

\* Required if analytics are enabled

**Privacy:** Respects DNT header and cookie consent. Users can opt-out in settings.

## Feature Flags

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_MFA_ENABLED` | No | `true` | Show MFA settings in UI |
| `NEXT_PUBLIC_TAGS_ENABLED` | No | `true` | Show tag management in UI |
| `NEXT_PUBLIC_PAGERDUTY_ENABLED` | No | `true` | Show PagerDuty in channel options |
| `NEXT_PUBLIC_TEAMS_ENABLED` | No | `true` | Show Teams in channel options |
| `NEXT_PUBLIC_SMS_ENABLED` | No | `true` | Show SMS in channel options |
| `NEXT_PUBLIC_ONBOARDING_ENABLED` | No | `true` | Enable onboarding checklist |

## Internal Monitoring

### Self-Monitoring (New)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ENABLE_INTERNAL_MONITORING` | No | `false` | Create internal monitoring org on seed |
| `IS_STAFF_EMAILS` | No | - | Comma-separated list of staff emails |

**Staff access:** Users with staff emails can access `/api/_internal/health` and see system metrics.

## Worker Configuration

### Heartbeats (New)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `WORKER_ID` | No | auto-generated | Unique worker identifier |
| `WORKER_REGION` | No | `local` | Worker region/datacenter |
| `FLY_REGION` | No | - | Auto-detected on Fly.io |

**Heartbeat interval:** 60 seconds (hardcoded)  
**Heartbeat TTL:** 180 seconds (3 minutes)

## Error Tracking

### Sentry

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SENTRY_DSN` | No | - | Sentry DSN for server-side errors |
| `NEXT_PUBLIC_SENTRY_DSN` | No | - | Sentry DSN for client-side errors |

## Billing

### Stripe

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | Conditional* | - | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Conditional* | - | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Conditional* | - | Stripe webhook signing secret |

\* Required if billing is enabled

## OAuth Providers (Optional)

### GitHub

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GITHUB_CLIENT_ID` | No | - | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | No | - | GitHub OAuth app secret |

### Google

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` | No | - | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | - | Google OAuth client secret |

## Integrations (Optional)

### Slack

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SLACK_CLIENT_ID` | No | - | Slack app client ID |
| `SLACK_CLIENT_SECRET` | No | - | Slack app secret |
| `SLACK_SIGNING_SECRET` | No | - | Slack request signing secret |

### Discord

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DISCORD_WEBHOOK_URL` | No | - | Discord webhook URL |

## Development & Testing

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SEED_DEMO` | No | `false` | Seed database with demo data |
| `SKIP_ENV_VALIDATION` | No | `false` | Skip environment variable validation |
| `ANALYZE` | No | `false` | Enable Next.js bundle analyzer |
| `LOG_LEVEL` | No | `info` | Logging level (debug, info, warn, error) |
| `PRETTY_LOGS` | No | `true` | Pretty-print logs in development |

## Security & CORS

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ALLOWED_ORIGINS` | No | - | Comma-separated list of allowed CORS origins |

## Rate Limiting

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate limit window in milliseconds |

---

## Migration Checklist

If you're upgrading to the launch readiness features:

### 1. Required New Variables

```bash
# Generate and add to .env
MFA_ENC_KEY=<generated-key>
```

### 2. Optional Alert Channels

```bash
# For PagerDuty
PAGERDUTY_ENABLED=true

# For Microsoft Teams
TEAMS_ENABLED=true

# For Twilio SMS
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+15551234567
```

### 3. Optional Analytics

```bash
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_POSTHOG_ENABLED=true
```

### 4. Optional Staff Access

```bash
IS_STAFF_EMAILS=admin@yourdomain.com,staff@yourdomain.com
```

### 5. Database Migration

```bash
cd packages/db
bunx prisma migrate dev --name launch_readiness
```

---

## Production Deployment

### Required Secrets

At minimum, these must be set in production:

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourapp.com
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
NEXTAUTH_SECRET=<strong-secret>
NEXTAUTH_URL=https://yourapp.com
MFA_ENC_KEY=<strong-key>
RESEND_API_KEY=re_xxxxx
```

### Recommended Secrets

For full feature set:

```bash
# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxx

# Error tracking
SENTRY_DSN=https://...
NEXT_PUBLIC_SENTRY_DSN=https://...

# Alert channels (as needed)
TWILIO_ENABLED=true
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_FROM_NUMBER=+1555...

# Staff access
IS_STAFF_EMAILS=admin@yourapp.com
```

### Worker Deployment

When deploying workers, ensure:

```bash
# Auto-detected on Fly.io, manual on other platforms
WORKER_ID=worker-${HOSTNAME}-${RANDOM}
WORKER_REGION=${REGION}
FLY_REGION=${FLY_REGION}  # Auto-set on Fly.io
```

---

## Security Best Practices

1. **Never commit .env files** – Already gitignored
2. **Rotate secrets regularly** – Especially `MFA_ENC_KEY` and `NEXTAUTH_SECRET`
3. **Use secret managers in production** – AWS Secrets Manager, Vault, etc.
4. **Limit staff access** – Only add trusted emails to `IS_STAFF_EMAILS`
5. **Monitor secret usage** – Use Sentry to detect unauthorized access
6. **Encrypt at rest** – Use encrypted databases for sensitive data

---

## Troubleshooting

### MFA not working

- Verify `MFA_ENC_KEY` is set and exactly 32 bytes (44 base64 chars)
- Check the key wasn't changed (would invalidate all existing secrets)

### SMS not sending

- Verify Twilio credentials are correct
- Check phone numbers are in E.164 format (+1XXXXXXXXXX)
- Ensure you're not hitting rate limits (10/hour per org)

### PostHog not tracking

- Check `NEXT_PUBLIC_POSTHOG_KEY` is set (must be `NEXT_PUBLIC_` prefix)
- Verify user hasn't opted out in privacy settings
- Check browser's DNT header isn't set

### Worker heartbeats missing

- Ensure Redis is accessible from workers
- Check `WORKER_ID` is unique per worker instance
- Verify workers are running and not crashing

---

## Need Help?

- Documentation: `/website/docs/`
- Support: support@saturnmonitor.com
- Discord: https://discord.gg/saturn

