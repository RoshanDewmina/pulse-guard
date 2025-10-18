# CI/CD Documentation

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for PulseGuard.

## Overview

PulseGuard uses GitHub Actions for automated testing, building, and deployment. The pipeline consists of:

1. **CI Pipeline** - Automated testing and quality checks
2. **Web Deployment** - Deploy Next.js app to Vercel
3. **Worker Deployment** - Deploy background worker to Fly.io
4. **Database Migrations** - Safely apply database changes

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

**Jobs:**

#### Lint & Type Check
- Runs ESLint on web app
- Runs TypeScript compiler to check for type errors

#### Unit Tests
- Tests web app (`apps/web`)
- Tests worker (`apps/worker`)
- Runs on Node.js 20.x and 22.x
- Generates code coverage reports
- Uploads coverage to Codecov (on Node 22.x only)

#### Integration Tests
- Runs integration tests against test database and Redis
- Uses service containers (PostgreSQL, Redis)
- Tests API endpoints, authentication, and core workflows

#### Build Check
- Ensures web app and worker can be built successfully
- Catches build-time errors before deployment

#### Security Audit
- Runs dependency security audit
- Checks for vulnerable packages

**Service Containers:**
- PostgreSQL 16 (test database)
- Redis 7 (test queue/cache)

---

### 2. Web App Deployment (`.github/workflows/deploy-web.yml`)

**Triggers:**
- Push to `main` branch (when `apps/web/**` or `packages/db/**` changes)
- Manual workflow dispatch

**Steps:**
1. Checkout code
2. Install Vercel CLI
3. Pull Vercel environment configuration
4. Build Next.js application
5. Deploy to Vercel (production or preview)
6. Run smoke tests (health check endpoint)
7. Tag successful deployments
8. Create deployment summary

**Required Secrets:**
- `VERCEL_TOKEN` - Vercel API token
- `VERCEL_ORG_ID` - Vercel organization ID
- `VERCEL_PROJECT_ID` - Vercel project ID

**Outputs:**
- Deployment URL
- Health check status
- Git tag for deployment tracking

---

### 3. Worker Deployment (`.github/workflows/deploy-worker.yml`)

**Triggers:**
- Push to `main` branch (when `apps/worker/**` or `packages/db/**` changes)
- Manual workflow dispatch

**Steps:**
1. Checkout code
2. Install Flyctl
3. Deploy to Fly.io
4. Wait for deployment
5. Verify deployment health
6. Tag successful deployments

**Required Secrets:**
- `FLY_API_TOKEN` - Fly.io API token

**Configuration:**
- Uses `apps/worker/fly.toml` for deployment configuration
- Remote build on Fly.io infrastructure

---

### 4. Database Migrations (`.github/workflows/migrate.yml`)

**Triggers:**
- Manual workflow dispatch only (for safety)

**Inputs:**
- `environment` - Target environment (development, staging, production)
- `migration_action` - Action to perform:
  - `deploy` - Apply pending migrations
  - `status` - Check migration status
  - `reset (dangerous)` - Reset database (blocked for production)

**Steps:**
1. Checkout code
2. Install dependencies
3. Select appropriate DATABASE_URL based on environment
4. Check migration status (before)
5. Run migration action
6. Verify database connection
7. Check migration status (after)
8. Rollback on failure (manual intervention required)

**Required Secrets:**
- `DATABASE_URL_DEV` - Development database URL
- `DATABASE_URL_STAGING` - Staging database URL
- `DATABASE_URL_PRODUCTION` - Production database URL

**Safety Features:**
- Production environment requires approval
- Cannot reset production database
- Shows migration status before and after
- Logs all migration actions

---

## Setup Guide

### Required GitHub Secrets

Navigate to your repository → Settings → Secrets and variables → Actions

#### For CI Pipeline:
- `CODECOV_TOKEN` (optional) - For coverage reports

#### For Web Deployment:
```bash
# Get Vercel token from https://vercel.com/account/tokens
VERCEL_TOKEN=...

# Get org and project IDs
cd apps/web
vercel link
cat .vercel/project.json
```

Add these secrets:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

#### For Worker Deployment:
```bash
# Get Fly.io token
flyctl auth token
```

Add secret:
- `FLY_API_TOKEN`

#### For Database Migrations:
Add secrets for each environment:
- `DATABASE_URL_DEV`
- `DATABASE_URL_STAGING`
- `DATABASE_URL_PRODUCTION`

### Initial Setup

1. **Fork/Clone Repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pulse-guard.git
   cd pulse-guard
   ```

2. **Add GitHub Secrets**
   - Follow the "Required GitHub Secrets" section above

3. **Enable GitHub Actions**
   - Go to repository → Actions → Enable workflows

4. **Update Badge URLs**
   - Edit `README.md`
   - Replace `YOUR_USERNAME` in badge URLs with your GitHub username

5. **Test CI Pipeline**
   ```bash
   git checkout -b test-ci
   git commit --allow-empty -m "Test CI pipeline"
   git push origin test-ci
   ```
   - Create a pull request
   - Verify all CI checks pass

---

## Manual Deployment

### Deploy Web App Manually

```bash
# Using GitHub CLI
gh workflow run deploy-web.yml -f environment=production

# Or via GitHub UI
# Go to Actions → Deploy Web App → Run workflow
```

### Deploy Worker Manually

```bash
# Using GitHub CLI
gh workflow run deploy-worker.yml

# Or via GitHub UI
# Go to Actions → Deploy Worker → Run workflow
```

### Run Database Migrations

```bash
# Check migration status
gh workflow run migrate.yml -f environment=production -f migration_action=status

# Apply migrations
gh workflow run migrate.yml -f environment=production -f migration_action=deploy

# Or via GitHub UI
# Go to Actions → Database Migration → Run workflow
```

---

## Debugging Failed Deployments

### CI Pipeline Failures

1. **Lint Errors**
   ```bash
   cd apps/web
   bun run lint --fix
   ```

2. **Type Errors**
   ```bash
   bunx tsc --noEmit
   ```

3. **Test Failures**
   ```bash
   cd apps/web
   npm test -- --verbose
   ```

4. **Integration Test Failures**
   - Check service container logs in GitHub Actions
   - Verify DATABASE_URL and REDIS_URL in CI environment
   - Run integration tests locally:
     ```bash
     docker-compose up -d postgres redis
     cd apps/web
     npm test -- --testPathPattern=integration
     ```

### Web Deployment Failures

1. **Build Failures**
   - Check build logs in GitHub Actions
   - Verify environment variables are set in Vercel
   - Test build locally:
     ```bash
     cd apps/web
     bun run build
     ```

2. **Deployment Failures**
   - Verify Vercel token is valid
   - Check Vercel deployment logs: `vercel logs`
   - Ensure project is linked: `vercel link`

3. **Health Check Failures**
   - Check if database is accessible
   - Verify NEXTAUTH_URL and other env vars
   - Check Vercel logs for errors

### Worker Deployment Failures

1. **Build Failures**
   - Check Fly.io build logs
   - Verify Dockerfile is correct
   - Test build locally:
     ```bash
     cd apps/worker
     bun run build
     ```

2. **Deployment Failures**
   - Verify FLY_API_TOKEN is valid
   - Check fly.toml configuration
   - View Fly.io logs: `flyctl logs`

3. **Health Check Failures**
   - Verify REDIS_URL and DATABASE_URL are set in Fly.io secrets
   - Check if worker is running: `flyctl status`
   - View logs: `flyctl logs --app your-worker-app`

### Migration Failures

1. **Migration Apply Failures**
   - Check migration SQL syntax
   - Verify database permissions
   - Check for conflicting migrations
   - Review Prisma migration logs

2. **Connection Failures**
   - Verify DATABASE_URL is correct
   - Check network connectivity
   - Ensure database is accessible from GitHub Actions

3. **Rollback**
   - Migrations cannot be auto-rolled back
   - Manual intervention required:
     ```bash
     cd packages/db
     npx prisma migrate resolve --rolled-back MIGRATION_NAME
     ```

---

## Best Practices

### Branch Strategy

- `main` - Production branch (protected)
- `develop` - Development branch
- `feature/*` - Feature branches
- `fix/*` - Bug fix branches

### Pull Request Workflow

1. Create feature branch from `develop`
2. Make changes and commit
3. Push branch and create PR to `develop`
4. Wait for CI checks to pass
5. Request code review
6. Merge when approved
7. Delete feature branch

### Deployment Strategy

**Development/Staging:**
- Deploy automatically on merge to `develop`
- Run integration tests
- Manual verification

**Production:**
- Deploy automatically on merge to `main`
- Run smoke tests
- Monitor for errors
- Rollback if needed

### Environment Variables

**Never commit:**
- API keys
- Database passwords
- Authentication secrets
- Third-party tokens

**Always use:**
- GitHub Secrets for CI/CD
- Vercel environment variables
- Fly.io secrets

### Database Migrations

**Before running:**
- Review migration SQL
- Test on staging environment
- Have rollback plan ready
- Notify team of maintenance window

**After running:**
- Verify migration status
- Check application functionality
- Monitor for errors
- Document any issues

---

## Monitoring & Notifications

### GitHub Actions Status

View workflow status:
- Repository → Actions tab
- Check status badges in README

### Deployment Notifications

**Vercel:**
- Email notifications for deployments
- Slack/Discord integration available

**Fly.io:**
- Email notifications for deployments
- Status API available

### Custom Notifications

Add to workflow files:
```yaml
- name: Send notification
  if: failure()
  run: |
    # Send to Slack, Discord, etc.
    curl -X POST $WEBHOOK_URL -d '{"text":"Deployment failed"}'
```

---

## Troubleshooting

### Common Issues

**Issue:** CI tests pass locally but fail in GitHub Actions
- **Solution:** Check Node.js version, environment variables, service container configuration

**Issue:** Vercel deployment succeeds but site is broken
- **Solution:** Check environment variables in Vercel dashboard, verify build output

**Issue:** Worker deployment succeeds but jobs aren't processing
- **Solution:** Check Fly.io secrets, verify Redis connection, check worker logs

**Issue:** Migration hangs or times out
- **Solution:** Check database locks, verify migration SQL, increase timeout

### Getting Help

1. Check workflow logs in GitHub Actions
2. Review this documentation
3. Search GitHub issues
4. Contact team in Slack/Discord
5. Create GitHub issue with:
   - Workflow name
   - Error message
   - Steps to reproduce
   - Environment details

---

## References

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Fly.io Documentation](https://fly.io/docs/)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [BullMQ Documentation](https://docs.bullmq.io/)

---

**Last Updated:** October 2025  
**Maintained By:** PulseGuard Team

