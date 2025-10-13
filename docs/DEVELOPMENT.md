# Development Guide

## Technology Stack

**Latest Versions (October 2025)**

- PostgreSQL 17.6
- Redis 7.4.6
- Prisma 6.17.1
- Next.js 14.2.14
- React 18.3.1
- Stripe 17.2.1
- BullMQ 5.20.3
- Node.js 20+
- Bun (latest)

See `docs/development/VERSION_UPDATES.md` in git history for complete update log.

## Development Setup

```bash
# Clone and install
git clone <repo>
cd tokiflow
make setup

# Development
make dev          # Start web + worker
make migrate      # Run migrations
make seed         # Seed test data
make generate     # Generate Prisma client

# Database
cd packages/db
bun prisma studio # Visual database editor
bun prisma migrate dev --name description
```

## Architecture

### Monorepo Structure
```
apps/
  web/          - Next.js app (frontend + API routes)
  worker/       - BullMQ background jobs
packages/
  db/           - Prisma schema & migrations (shared)
  cli/          - CLI tool
```

### Data Flow
```
Cron Job → Ping API → Database → Worker Queue → Evaluator → Incident → Alert
```

### Key Concepts

**Monitor**: Configuration for a job to monitor  
**Run**: Single execution record (ping received)  
**Incident**: Problem detected (MISSED/LATE/FAIL)  
**Alert**: Notification sent (email/Slack)  
**Rule**: Alert routing logic  
**Channel**: Alert destination (email/Slack)  

## Database Schema

```prisma
// Key models
Monitor      - Job configuration
Run          - Execution history
Incident     - Detected problems
Alert        - Sent notifications
Organization - Multi-tenant
User         - Authentication
Membership   - User-Org relationship
Rule         - Alert routing
Channel      - Alert destinations
```

### Migrations
```bash
cd packages/db
bun prisma migrate dev       # Development
bun prisma migrate deploy    # Production
bun prisma migrate reset     # Reset & reseed
```

## API Routes

### Public (No Auth)
- `GET /api/ping/:token` - Receive job pings
- `POST /api/ping/:token` - Ping with output

### Protected (Auth Required)
- `/api/monitors` - CRUD monitors
- `/api/incidents` - View incidents
- `/api/channels` - Manage alert channels
- `/api/rules` - Configure routing
- `/api/stripe/*` - Billing

### Webhooks
- `/api/stripe/webhook` - Stripe events
- `/api/slack/actions` - Slack button clicks
- `/api/slack/commands` - Slack slash commands

## Worker Jobs

Located in `apps/worker/src/jobs/`:

- **evaluator.ts** - Runs every 60s, checks for MISSED/LATE
- **alerts.ts** - Routes alerts to channels
- **email.ts** - Sends emails via Resend
- **slack.ts** - Posts to Slack
- **webhook.ts** - Sends webhook notifications
- **discord.ts** - Posts to Discord

### Queue System (BullMQ)
```typescript
import { scheduleEvaluationQueue } from './queues';

// Add job
await scheduleEvaluationQueue.add('evaluate', {});

// Process
scheduleEvaluationQueue.process(async (job) => {
  // Handle job
});
```

## Authentication

### Magic Link Setup

**Development**: Links printed to console

**Production**: 
1. Get Resend API key from [resend.com](https://resend.com)
2. Add verified domain
3. Set `RESEND_API_KEY` in `.env`

**Troubleshooting**:
- Check `RESEND_API_KEY` is set
- Verify domain in Resend dashboard
- Check email logs in Resend UI
- Ensure `NEXTAUTH_URL` matches your domain

### OAuth Providers

**Google OAuth**:
1. Create project at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable Google+ API
3. Create OAuth credentials
4. Add to `.env`:
   ```env
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

## Rate Limiting

Implemented using Redis:
- 60 requests per minute per token
- Applied to `/api/ping/:token`
- Returns 429 with `Retry-After` header

```typescript
import { checkRateLimit } from '@/lib/rate-limit';

const limited = await checkRateLimit(token);
if (limited) {
  return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
}
```

## Environment Variables

**Required**:
```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
NEXTAUTH_SECRET=generate-with-openssl
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=another-secret
```

**Optional**:
```env
RESEND_API_KEY=re_...              # For emails
STRIPE_SECRET_KEY=sk_test_...      # For billing
SLACK_CLIENT_ID=...                # For Slack
S3_ENDPOINT=http://localhost:9000  # MinIO/S3
GOOGLE_CLIENT_ID=...               # Google OAuth
DISCORD_WEBHOOK_URL=...            # Discord alerts
SENTRY_DSN=...                     # Error tracking
```

## Code Style

- TypeScript strict mode
- Prettier for formatting
- ESLint for linting
- Prisma for database queries
- React Server Components by default
- `'use client'` only when needed

## Testing

```bash
# Unit tests
npm test

# E2E tests
cd apps/web
npm run test:e2e

# Manual API testing
curl http://localhost:3000/api/ping/$TOKEN
```

## Debugging

### Database
```bash
# View data
cd packages/db && bun prisma studio

# Query directly
docker exec -it pulseguard-postgres psql -U postgres -d pulseguard
SELECT * FROM "Monitor";
```

### Worker Logs
```bash
# Check worker logs
docker logs pulseguard-worker -f

# Or if running locally
# Logs printed to console
```

### Redis Queue
```bash
docker exec -it pulseguard-redis redis-cli
KEYS *
GET key_name
```

## Common Tasks

### Add New API Route
```typescript
// apps/web/src/app/api/your-route/route.ts
export const runtime = 'nodejs';  // If using Node features

export async function GET(request: Request) {
  // Your logic
  return NextResponse.json({ data: '...' });
}
```

### Add New Worker Job
```typescript
// apps/worker/src/jobs/your-job.ts
export async function processYourJob(data: any) {
  // Job logic
}

// apps/worker/src/index.ts
import { yourQueue } from './queues';
yourQueue.process(processYourJob);
```

### Add Database Field
```prisma
// packages/db/prisma/schema.prisma
model Monitor {
  // ... existing fields
  newField String?
}
```
```bash
cd packages/db
bun prisma migrate dev --name add_new_field
```

### Add Component
```typescript
// apps/web/src/components/your-component.tsx
'use client';  // Only if needed

export function YourComponent() {
  return <div>...</div>;
}
```

## Performance

### Database Indexes
Key indexes already added:
- Monitor.token (unique)
- Run.monitorId, Run.createdAt
- Incident.monitorId, Incident.resolvedAt
- Alert.incidentId

### Caching Strategy
- Redis for rate limiting
- Future: Cache monitor lookups
- Future: Cache nextDueAt calculations

### Query Optimization
- Use Prisma select to limit fields
- Paginate large result sets
- Use indexes for filtering

## Security

### Token Security
- Monitor tokens: cryptographically random
- API keys: stored hashed
- Webhook signatures: HMAC validation

### Input Validation
- All API inputs validated
- SQL injection: Prevented by Prisma
- XSS: React auto-escapes
- CSRF: Protected by SameSite cookies

## Deployment

See main [GUIDE.md](GUIDE.md#deployment) for deployment guide.

### Database Migrations
```bash
# Production
cd packages/db
bun prisma migrate deploy
```

### Worker Deployment
Ensure only one evaluator instance runs or use leader election.

## Troubleshooting

**Build Errors**:
```bash
rm -rf node_modules bun.lock
bun install
make generate
```

**Database Connection**:
```bash
# Test connection
docker exec -it pulseguard-postgres psql -U postgres -c "SELECT 1;"
```

**Worker Not Processing**:
```bash
# Check Redis
docker exec -it pulseguard-redis redis-cli ping

# Check queues
docker exec -it pulseguard-redis redis-cli KEYS bull:*
```

**Rate Limit Issues**:
```bash
# Clear rate limits
docker exec -it pulseguard-redis redis-cli FLUSHDB
```

## Contributing

1. Fork repository
2. Create feature branch
3. Make changes with tests
4. Submit PR with description

See [CONTRIBUTING.md](../CONTRIBUTING.md) for details.

