# 🚀 PulseGuard Deployment Guide

Complete deployment guide for PulseGuard, covering all deployment methods, environment setup, and feature configuration.

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Environment Setup](#-environment-setup)
- [Database Setup](#-database-setup)
- [Application Deployment](#-application-deployment)
- [Feature Configuration](#-feature-configuration)
- [Monitoring & Maintenance](#-monitoring--maintenance)
- [Troubleshooting](#-troubleshooting)

---

## ⚡ Quick Start

### Automated Deployment (Recommended)

For first-time deployments, use the automated setup script:

```bash
# Clone the repository
git clone https://github.com/your-username/pulse-guard.git
cd pulse-guard

# Run the setup script
./setup-env.sh

# Deploy everything
./deploy-all.sh production
```

This will:
1. Set up all environment variables
2. Deploy the database
3. Deploy the web application
4. Deploy the worker
5. Run health checks

### Manual Deployment

For experienced users who want full control:

```bash
# 1. Set up environment
cp env.txt .env
# Edit .env with your values

# 2. Deploy database
cd packages/db
npx prisma migrate deploy

# 3. Deploy web app
./deploy-vercel-cli.sh production

# 4. Deploy worker
./deploy-flyio.sh
```

---

## 🔧 Prerequisites

### Required Services

| Service | Purpose | Free Tier Available |
|---------|---------|-------------------|
| **Vercel** | Web application hosting | ✅ |
| **Fly.io** | Worker hosting | ✅ |
| **Neon/PostgreSQL** | Database | ✅ |
| **Upstash/Redis** | Cache and queues | ✅ |
| **Resend** | Email delivery | ✅ |

### Optional Services

| Service | Purpose | When to Use |
|---------|---------|-------------|
| **Stripe** | Payment processing | For SaaS monetization |
| **Sentry** | Error tracking | For production monitoring |
| **S3** | File storage | For synthetic monitoring screenshots |
| **Twilio** | SMS notifications | For critical alerts |
| **Slack/Discord** | Team notifications | For team collaboration |

### System Requirements

- **Node.js**: 18.x or later
- **Bun**: 1.0 or later (recommended)
- **Git**: For version control
- **Domain**: For custom domains and SSL

---

## 🌍 Environment Setup

### Core Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=require"
DATABASE_URL_UNPOOLED="postgresql://user:password@host:port/database?sslmode=require"

# Redis
REDIS_URL="redis://user:password@host:port"

# Authentication
NEXTAUTH_SECRET="your-32-character-secret-key"
NEXTAUTH_URL="https://your-domain.com"
JWT_SECRET="your-jwt-secret-key"

# Email
RESEND_API_KEY="re_xxxxxxxxxx"
FROM_EMAIL="noreply@your-domain.com"

# Application
NODE_ENV="production"
```

### Feature-Specific Environment Variables

#### Stripe (Payment Processing)
```bash
STRIPE_SECRET_KEY="sk_live_xxxxxxxxxx"
STRIPE_PUBLISHABLE_KEY="pk_live_xxxxxxxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxxxxxxx"
```

#### Sentry (Error Tracking)
```bash
SENTRY_DSN="https://xxxxxxxxxx@sentry.io/xxxxxxxxxx"
SENTRY_ORG="your-org"
SENTRY_PROJECT="pulseguard"
SENTRY_AUTH_TOKEN="your-sentry-auth-token"
```

#### S3 (File Storage)
```bash
AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="pulseguard-files"
```

#### Twilio (SMS)
```bash
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"
```

#### Slack Integration
```bash
SLACK_BOT_TOKEN="xoxb-xxxxxxxxxx-xxxxxxxxxx-xxxxxxxxxx"
SLACK_SIGNING_SECRET="your-slack-signing-secret"
```

#### Discord Integration
```bash
DISCORD_BOT_TOKEN="your-discord-bot-token"
DISCORD_CLIENT_ID="your-discord-client-id"
DISCORD_CLIENT_SECRET="your-discord-client-secret"
```

### Environment Variable Validation

Use the setup script to validate your environment:

```bash
./setup-env.sh --validate
```

This will check:
- Required variables are set
- Database connectivity
- Redis connectivity
- Email service connectivity
- Optional service connectivity

---

## 🗄️ Database Setup

### Database Provider Setup

#### Neon (Recommended)

1. **Create Database**:
   ```bash
   # Install Neon CLI
   npm install -g @neondatabase/cli
   
   # Login to Neon
   neon auth
   
   # Create database
   neon databases create pulseguard
   ```

2. **Get Connection String**:
   ```bash
   # Get connection details
   neon connection-string pulseguard
   ```

#### Supabase

1. **Create Project**: Go to [supabase.com](https://supabase.com)
2. **Get Connection String**: From project settings
3. **Enable Extensions**: Enable required PostgreSQL extensions

#### Self-Hosted PostgreSQL

1. **Install PostgreSQL**: Version 15 or later
2. **Create Database**: `CREATE DATABASE pulseguard;`
3. **Create User**: `CREATE USER pulseguard WITH PASSWORD 'secure_password';`
4. **Grant Permissions**: `GRANT ALL PRIVILEGES ON DATABASE pulseguard TO pulseguard;`

### Database Migration

Run database migrations to set up the schema:

```bash
cd packages/db

# Generate migration (if needed)
npx prisma migrate dev --name init

# Deploy migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### Database Seeding (Optional)

Seed the database with initial data:

```bash
# Run seed script
npx prisma db seed

# Or manually seed
bun run seed
```

---

## 🚀 Application Deployment

### Web Application (Vercel)

#### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add DATABASE_URL
vercel env add REDIS_URL
# ... add all required variables
```

#### Method 2: GitHub Integration

1. **Connect Repository**: Link your GitHub repo to Vercel
2. **Configure Build Settings**:
   - Framework: Next.js
   - Build Command: `cd apps/web && bun run build`
   - Output Directory: `apps/web/.next`
3. **Set Environment Variables**: Add all required variables
4. **Deploy**: Automatic deployment on push to main

#### Method 3: Manual Upload

```bash
# Build the application
cd apps/web
bun run build

# Upload to Vercel
vercel --prod --cwd apps/web
```

### Worker Application (Fly.io)

#### Method 1: Fly.io CLI (Recommended)

```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh

# Login to Fly.io
fly auth login

# Deploy worker
cd apps/worker
fly deploy

# Set secrets
fly secrets set DATABASE_URL="your-database-url"
fly secrets set REDIS_URL="your-redis-url"
# ... set all required secrets
```

#### Method 2: GitHub Actions

```yaml
# .github/workflows/deploy-worker.yml
name: Deploy Worker
on:
  push:
    branches: [main]
    paths: ['apps/worker/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### Custom Domain Setup

#### Vercel Custom Domain

1. **Add Domain**: In Vercel dashboard, go to project settings
2. **Configure DNS**: Add CNAME record pointing to Vercel
3. **SSL Certificate**: Automatic SSL certificate generation
4. **Update Environment**: Update `NEXTAUTH_URL` with custom domain

#### Fly.io Custom Domain

1. **Add Domain**: `fly domains add your-domain.com`
2. **Configure DNS**: Add A record pointing to Fly.io IP
3. **SSL Certificate**: Automatic SSL certificate generation

---

## ⚙️ Feature Configuration

### Multi-Factor Authentication (MFA)

MFA is enabled by default. Configure additional settings:

```bash
# MFA settings (optional)
MFA_ISSUER="PulseGuard"
MFA_WINDOW=1
MFA_DIGITS=6
MFA_ALGORITHM="sha1"
```

### SAML 2.0 SSO

Configure SAML for enterprise SSO:

1. **Get SAML Metadata**: From your Identity Provider
2. **Configure SAML**: In organization settings
3. **Test Configuration**: Use the built-in test tool
4. **Enable SAML**: Toggle SAML authentication

### Audit Logging

Audit logging is enabled by default. Configure retention:

```bash
# Audit log settings
AUDIT_LOG_RETENTION_DAYS=365
AUDIT_LOG_LEVEL=info
AUDIT_LOG_FORMAT=json
```

### Maintenance Windows

Configure maintenance window settings:

```bash
# Maintenance window settings
MAINTENANCE_WINDOW_MAX_DURATION_HOURS=24
MAINTENANCE_WINDOW_ADVANCE_NOTICE_HOURS=24
```

### Synthetic Monitoring

Configure synthetic monitoring (requires S3):

```bash
# Synthetic monitoring settings
SYNTHETIC_SCREENSHOT_BUCKET="pulseguard-screenshots"
SYNTHETIC_SCREENSHOT_RETENTION_DAYS=30
SYNTHETIC_MAX_STEPS=10
```

---

## 📊 Monitoring & Maintenance

### Health Checks

Set up health checks for your deployment:

#### Vercel Health Check

```bash
# Check web application health
curl https://your-domain.com/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "email": "healthy"
  }
}
```

#### Fly.io Health Check

```bash
# Check worker health
fly status

# Check worker logs
fly logs
```

### Monitoring Setup

#### Application Monitoring

1. **Sentry Integration**: Automatic error tracking
2. **Performance Monitoring**: Built-in performance metrics
3. **Uptime Monitoring**: Monitor your own deployment

#### Infrastructure Monitoring

1. **Database Monitoring**: Monitor database performance
2. **Redis Monitoring**: Monitor cache and queue performance
3. **CDN Monitoring**: Monitor Vercel edge performance

### Backup Strategy

#### Database Backups

```bash
# Automated backups (recommended)
# Set up automated backups in your database provider

# Manual backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql $DATABASE_URL < backup_20240115_103000.sql
```

#### File Backups

```bash
# S3 backup (if using S3)
aws s3 sync s3://your-bucket s3://your-backup-bucket/$(date +%Y%m%d)
```

### Updates and Maintenance

#### Application Updates

```bash
# Update application
git pull origin main
bun install
bun run build

# Deploy updates
./deploy-all.sh production
```

#### Database Updates

```bash
# Run database migrations
cd packages/db
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

#### Security Updates

```bash
# Update dependencies
bun update

# Check for vulnerabilities
bun audit

# Update security patches
bun audit --fix
```

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
psql $DATABASE_URL_UNPOOLED -c "SELECT 1;"
```

**Solutions:**
- Verify connection string format
- Check database server status
- Verify network connectivity
- Check firewall settings

#### Redis Connection Issues

```bash
# Check Redis connectivity
redis-cli -u $REDIS_URL ping

# Check Redis memory usage
redis-cli -u $REDIS_URL info memory
```

**Solutions:**
- Verify Redis URL format
- Check Redis server status
- Verify network connectivity
- Check Redis memory limits

#### Email Delivery Issues

```bash
# Test email delivery
curl -X POST https://your-domain.com/api/test-email \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to": "test@example.com", "subject": "Test", "body": "Test email"}'
```

**Solutions:**
- Verify Resend API key
- Check email domain configuration
- Verify sender email address
- Check spam folder

#### Worker Issues

```bash
# Check worker status
fly status

# Check worker logs
fly logs --tail

# Restart worker
fly restart
```

**Solutions:**
- Check worker logs for errors
- Verify environment variables
- Check Redis connectivity
- Restart worker if needed

### Performance Issues

#### Slow Database Queries

```bash
# Check slow queries
psql $DATABASE_URL -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"
```

**Solutions:**
- Add database indexes
- Optimize queries
- Increase database resources
- Use connection pooling

#### High Memory Usage

```bash
# Check memory usage
fly status
fly logs --tail
```

**Solutions:**
- Increase worker memory
- Optimize code
- Check for memory leaks
- Restart worker

#### Slow API Responses

```bash
# Check API response times
curl -w "@curl-format.txt" -o /dev/null -s https://your-domain.com/api/monitors
```

**Solutions:**
- Enable CDN caching
- Optimize database queries
- Use Redis caching
- Optimize code

### Security Issues

#### Authentication Issues

```bash
# Check authentication logs
curl -H "Authorization: Bearer YOUR_API_KEY" https://your-domain.com/api/audit-logs?action=LOGIN_FAILED
```

**Solutions:**
- Verify JWT secret
- Check session configuration
- Verify MFA setup
- Check SAML configuration

#### API Security Issues

```bash
# Test API security
curl -H "Authorization: Bearer invalid-key" https://your-domain.com/api/monitors
```

**Solutions:**
- Verify API key format
- Check rate limiting
- Verify CORS settings
- Check input validation

---

## 📚 Additional Resources

- [Features Guide](./docs/FEATURES.md)
- [API Documentation](./docs/API.md)
- [Security Guide](./docs/SECURITY.md)
- [Testing Guide](./docs/TESTING.md)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

---

## 🆘 Support

- **Documentation**: [docs.pulseguard.com](https://docs.pulseguard.com)
- **Community**: [Discord](https://discord.gg/pulseguard)
- **Issues**: [GitHub Issues](https://github.com/pulseguard/pulseguard/issues)
- **Email**: support@pulseguard.com

---

**Last Updated**: January 2024  
**Deployment Version**: v2.0