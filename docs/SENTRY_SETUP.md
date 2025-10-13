# Sentry Setup Guide

Complete error tracking and performance monitoring for Tokiflow.

## Why Sentry?

- ✅ Real-time error tracking
- ✅ Performance monitoring
- ✅ Release tracking
- ✅ User feedback integration
- ✅ Source maps support
- ✅ FREE tier: 5,000 errors/month

## Quick Setup

### 1. Create Sentry Account

```bash
# Go to https://sentry.io/signup/
# Sign up (free, no credit card required for developer plan)
```

### 2. Create Project

1. Click "Create Project"
2. Platform: **Next.js** (for web app)
3. Project name: `tokiflow-web`
4. Click "Create Project"

5. Repeat for worker:
   - Platform: **Node.js**
   - Project name: `tokiflow-worker`

### 3. Get DSN

After creating project, copy the DSN:

```
https://[key]@[organization].ingest.sentry.io/[project-id]
```

You'll have two DSNs:
- `tokiflow-web` DSN
- `tokiflow-worker` DSN

### 4. Add Environment Variables

#### Vercel (Web App)

Go to Vercel Dashboard → Settings → Environment Variables:

```env
# Sentry Web App
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[web-project-id]
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[web-project-id]
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=tokiflow-web
SENTRY_AUTH_TOKEN=your-auth-token  # Get from Sentry Settings → Auth Tokens
```

#### Worker Platform (Railway/Render/Fly.io)

```env
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[worker-project-id]
```

### 5. Generate Auth Token

For source maps upload (optional but recommended):

1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Scopes: `project:releases`, `project:write`
4. Copy token and add to Vercel

## Testing Sentry Integration

### Test Web App

```bash
cd apps/web
bun install  # Install @sentry/nextjs
bun run build  # Should show Sentry plugin output
bun run dev
```

Visit any page and trigger an error:

```typescript
// In browser console
throw new Error('Test Sentry integration');
```

Check Sentry dashboard for the error.

### Test Worker

```bash
cd apps/worker
bun install  # Install @sentry/node
bun run dev
```

Worker logs should show:
```
Sentry initialized for worker
```

Trigger a test error by stopping Redis:
```bash
docker compose stop redis
# Worker will log errors to Sentry
```

## Configuration Details

### Web App (`apps/web/`)

Files created:
- `sentry.client.config.ts` - Client-side tracking
- `sentry.server.config.ts` - Server-side tracking
- `sentry.edge.config.ts` - Edge runtime tracking
- `instrumentation.ts` - Next.js instrumentation
- `src/components/error-boundary.tsx` - React error boundary

### Worker (`apps/worker/`)

Files created:
- `src/sentry.ts` - Worker Sentry configuration
- Updated `src/index.ts` - Initialize on startup

## Features Enabled

### Error Tracking ✅

Automatic capture of:
- Unhandled exceptions
- Promise rejections
- API route errors
- Worker job failures
- Database errors (Prisma integration)

### Performance Monitoring ✅

Tracks:
- API route response times
- Database query performance
- External API calls (Stripe, Slack, etc.)
- Worker job processing time

### Session Replay ✅

Records user sessions when errors occur:
- Video-like replay
- Console logs
- Network requests
- DOM mutations

**Privacy:** All text is masked, media blocked by default.

### User Feedback ✅

Users can report issues directly:
```typescript
// Shown automatically on errors
Sentry.showReportDialog({ eventId });
```

### Release Tracking ✅

Automatic release creation on deployment:
- Git commit SHA
- Deploy time
- Environment (production/preview)

## Error Boundary Usage

Wrap critical components:

```tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function Page() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

Or use custom fallback:

```tsx
<ErrorBoundary fallback={<CustomErrorUI />}>
  <YourComponent />
</ErrorBoundary>
```

## Worker Error Capture

```typescript
import { captureJobError, captureJobWarning } from './sentry';

// In your job handler
try {
  await processJob(data);
} catch (error) {
  captureJobError(error, 'job-name', { jobData: data });
  throw error;
}

// For warnings
if (retriesExceeded) {
  captureJobWarning('Job retries exceeded', 'job-name', { attempts: 5 });
}
```

## Sensitive Data Filtering

### Automatically Filtered

- Authorization headers
- Cookies
- Query params: `token`, `key`
- Job data: `apiKey`, `accessToken`, `password`

### Custom Filtering

```typescript
// In sentry config
beforeSend(event) {
  // Remove custom sensitive fields
  if (event.extra?.customData?.secret) {
    delete event.extra.customData.secret;
  }
  return event;
}
```

## Ignored Errors

Common non-actionable errors are filtered:

- Browser extension errors
- Network errors (transient)
- User navigation cancellations
- Ad blocker interference

## Alerts

Set up alerts in Sentry dashboard:

1. Go to Project Settings → Alerts
2. Create alert rule:
   - Trigger: `Error count > 10 in 5 minutes`
   - Action: Email/Slack notification
3. Save

Example rules:
- High error rate (> 10 errors/min)
- New issue appears
- Regression (fixed issue returns)
- Performance degradation (> 2s response time)

## Monitoring Dashboard

### Key Metrics

1. **Error Rate**
   - Errors per minute/hour
   - Trending up/down

2. **User Impact**
   - Affected users count
   - Sessions with errors

3. **Performance**
   - Average response time
   - Slowest transactions
   - Database query time

4. **Release Health**
   - Crash-free sessions
   - Adoption rate

### Access Dashboard

Web: https://sentry.io/organizations/[your-org]/projects/tokiflow-web/
Worker: https://sentry.io/organizations/[your-org]/projects/tokiflow-worker/

## Cost Breakdown

### Developer Plan (FREE)
- 5,000 errors/month
- 10,000 performance units/month
- 30-day retention
- 1 project
- **Cost: $0/month**

### Team Plan
- 50,000 errors/month
- 100,000 performance units/month
- 90-day retention
- Unlimited projects
- **Cost: $26/month**

### Estimate for Tokiflow

With 1,000 users:
- ~500 errors/month (well-tested app)
- ~20,000 performance units/month
- **Fits in FREE tier!**

With 10,000 users:
- ~2,000 errors/month
- ~50,000 performance units/month
- **Team plan ($26/month)**

## Troubleshooting

### Source Maps Not Uploading

```bash
# Check auth token
echo $SENTRY_AUTH_TOKEN

# Verify project slug
# Should match exactly: tokiflow-web (not Tokiflow Web)

# Manual upload
sentry-cli sourcemaps upload \
  --org your-org \
  --project tokiflow-web \
  ./apps/web/.next
```

### Errors Not Appearing

1. Check DSN is set correctly
2. Verify environment (dev errors might not send)
3. Check browser console for Sentry init logs
4. Test with manual error:
   ```typescript
   Sentry.captureException(new Error('test'));
   ```

### Too Many Events (Quota Exceeded)

1. Increase ignored errors filter
2. Sample non-critical errors:
   ```typescript
   beforeSend(event, hint) {
     // Sample 10% of non-critical errors
     if (hint.originalException?.message?.includes('non-critical')) {
       return Math.random() < 0.1 ? event : null;
     }
     return event;
   }
   ```
3. Upgrade to Team plan

### Worker Errors Not Captured

```bash
# Check worker logs
# Should see: "Sentry initialized for worker"

# Verify DSN
echo $SENTRY_DSN

# Test capture
curl -X POST localhost:3001/test-error  # If you add a test endpoint
```

## Best Practices

### 1. Add Context

```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.name,
});

Sentry.setTag('feature', 'monitors');
Sentry.setExtra('monitorId', monitor.id);
```

### 2. Breadcrumbs

```typescript
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
});
```

### 3. Performance Transactions

```typescript
const transaction = Sentry.startTransaction({
  name: 'Process Monitor Run',
  op: 'task',
});

try {
  await processRun();
} finally {
  transaction.finish();
}
```

### 4. Release Tagging

```bash
# Automatically set by Vercel
# Or manually:
SENTRY_RELEASE=$(git rev-parse HEAD)
```

## Integration with Other Tools

### Slack Notifications

1. Sentry Dashboard → Settings → Integrations
2. Add Slack
3. Configure alert routing

### GitHub Issues

1. Sentry Dashboard → Settings → Integrations
2. Add GitHub
3. Auto-create issues for new errors

### PagerDuty (For on-call)

1. Sentry Dashboard → Settings → Integrations
2. Add PagerDuty
3. Route critical alerts

## Next Steps

After setting up Sentry:

1. ✅ Deploy with Sentry enabled
2. ✅ Trigger test error
3. ✅ Verify error appears in dashboard
4. ✅ Set up alerts
5. ✅ Add team members
6. ✅ Configure integrations (Slack/GitHub)
7. ✅ Review weekly digest emails

## Resources

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Best Practices: https://docs.sentry.io/product/best-practices/
- Performance Monitoring: https://docs.sentry.io/product/performance/

Need help? Check [troubleshooting](#troubleshooting) or contact Sentry support (excellent support even on free tier!).

