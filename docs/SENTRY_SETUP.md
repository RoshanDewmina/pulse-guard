# Sentry Setup

Error tracking and performance monitoring integration.

## Quick Setup

### 1. Create Sentry Projects

1. Sign up at https://sentry.io
2. Create two projects:
   - **saturn-web** (Platform: Next.js)
   - **saturn-worker** (Platform: Node.js)
3. Copy DSNs from each project

### 2. Environment Variables

**Web App (Vercel):**
```env
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[web-project-id]
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[web-project-id]
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=saturn-web
SENTRY_AUTH_TOKEN=your-auth-token
```

**Worker (Fly.io/Render):**
```env
SENTRY_DSN=https://[key]@[org].ingest.sentry.io/[worker-project-id]
```

### 3. Auth Token (Optional)

For source maps upload:
1. Go to Settings → Auth Tokens
2. Create token with `project:releases` and `project:write` scopes
3. Add as `SENTRY_AUTH_TOKEN`

## Testing

**Test error in web app:**
```bash
# Visit /api/test-sentry in browser
curl https://your-app.vercel.app/api/test-sentry
```

**Test error in worker:**
```javascript
// Add to worker code temporarily
import * as Sentry from '@sentry/node';
Sentry.captureException(new Error('Test error'));
```

Check Sentry dashboard for errors.

## Configuration

Sentry is configured in:
- `apps/web/sentry.client.config.ts` - Client-side errors
- `apps/web/sentry.server.config.ts` - Server-side errors
- `apps/web/sentry.edge.config.ts` - Edge runtime errors
- `apps/worker/src/sentry.ts` - Worker errors

## Features Enabled

- ✅ Error tracking
- ✅ Performance monitoring
- ✅ Release tracking
- ✅ Source maps (if auth token configured)
- ✅ Session replay (client-side)
- ✅ User context

## Production Best Practices

1. Set `environment` to `production` in env vars
2. Use release tracking with git commits
3. Configure alerts for critical errors
4. Set up performance budgets
5. Enable source maps for better stack traces

## Free Tier Limits

- 5,000 errors/month
- 10,000 performance units/month
- 1 user
- 30 days retention

Upgrade for higher limits and more features.

## Troubleshooting

**No errors showing?**
- Verify DSN is correct
- Check NEXT_PUBLIC_SENTRY_DSN is set for client-side errors
- Ensure Sentry is initialized (check config files)
- Test with manual error: `throw new Error('test')`

**Source maps not working?**
- Verify SENTRY_AUTH_TOKEN is set
- Check auth token has correct scopes
- Ensure project/org names match

**Performance data missing?**
- Enable in Sentry project settings
- Check `tracesSampleRate` in config (default: 0.1 = 10%)
- Increase sample rate for more data

## Resources

- Sentry Docs: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Dashboard: https://sentry.io/organizations/[your-org]/issues/
