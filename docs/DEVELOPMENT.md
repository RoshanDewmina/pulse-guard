# Development Guide

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript 5
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 17
- **Queue**: BullMQ + Redis 7
- **Storage**: MinIO (S3-compatible)
- **UI**: Tailwind CSS, shadcn/ui

## Quick Start

```bash
# Clone and setup
git clone <repo>
cd saturn
make setup

# Start development
make dev

# Access
open http://localhost:3000
```

## Project Structure

```
saturn/
├── apps/
│   ├── web/          # Next.js app (frontend + API)
│   └── worker/       # Background jobs (BullMQ)
├── packages/
│   ├── db/           # Prisma schema & migrations
│   └── cli/          # CLI tool
└── integrations/
    ├── kubernetes/   # Go sidecar + Helm
    └── wordpress/    # PHP plugin
```

## Architecture

### Data Flow
```
Cron Job → Ping API → Database → Queue → Evaluator
                                          ↓
                                      Incident → Alert → Channel
```

### Key Concepts

**Monitor**: Job configuration (schedule, grace period, etc.)
**Run**: Single execution record (when ping received)
**Incident**: Problem detected (MISSED/LATE/FAIL/ANOMALY)
**Alert**: Notification sent via channel
**Channel**: Alert destination (Email/Slack/Discord/Webhook)
**Rule**: Alert routing logic

## Database Schema

Main models:
- `Monitor` - Job configurations
- `Run` - Execution history
- `Incident` - Detected problems
- `Alert` - Sent notifications
- `Organization` - Multi-tenant orgs
- `User` - Authentication
- `Membership` - User-org relationships
- `Channel` - Alert destinations
- `Rule` - Alert routing rules

## API Routes

### Public (No Auth)
- `GET/POST /api/ping/:token` - Receive pings

### Protected (Auth Required)
- `/api/monitors` - Monitor CRUD
- `/api/incidents` - Incident management
- `/api/channels` - Alert channels
- `/api/rules` - Alert routing
- `/api/analytics` - Statistics

### Integrations
- `/api/slack/*` - Slack OAuth & webhooks
- `/api/stripe/*` - Billing webhooks
- `/api/webhooks/*` - External webhooks

## Development Commands

```bash
# Setup
make setup          # Full setup (install, docker, migrate, seed)
make docker-up      # Start Postgres, Redis, MinIO

# Development
make dev            # Start web + worker
make web            # Web only
make worker         # Worker only

# Database
make migrate        # Run migrations
make generate       # Generate Prisma client
make seed           # Seed test data
make reset          # Reset database

# Database tools
cd packages/db
npx prisma studio   # Visual editor
npx prisma migrate dev --name <name>
```

## Background Jobs

BullMQ workers in `apps/worker/src/jobs/`:
- **evaluator** - Check for missed/late monitors (runs every 60s)
- **alerts** - Dispatch alert to appropriate channel
- **email** - Send email via Resend
- **slack** - Send Slack message
- **discord** - Send Discord message
- **webhook** - Send HTTP webhook

## Environment Variables

Key variables for development:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/saturn

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

# Email (optional for dev)
RESEND_API_KEY=re_...

# Storage
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=saturn-outputs
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
```

See `.env.example` for complete list.

## Common Tasks

### Adding a New API Route
```bash
# Create route file
touch apps/web/src/app/api/your-route/route.ts

# Add handler
export async function GET(req: Request) {
  // Your code
}
```

### Creating a Database Migration
```bash
cd packages/db

# Edit schema
vi prisma/schema.prisma

# Create migration
npx prisma migrate dev --name add_new_field

# Apply to production
npx prisma migrate deploy
```

### Adding a Background Job
```typescript
// apps/worker/src/jobs/my-job.ts
import { Job, Queue } from 'bullmq';

export async function processMyJob(job: Job) {
  // Your logic
}

// Register in apps/worker/src/index.ts
```

### Testing Locally

```bash
# Create a monitor in UI
# Get token from monitor details

# Test ping
curl http://localhost:3000/api/ping/YOUR_TOKEN

# Test with state
curl "http://localhost:3000/api/ping/YOUR_TOKEN?state=success"
```

## Debugging

### Database Issues
```bash
# Check connection
cd packages/db
npx prisma db pull

# View data
npx prisma studio

# Reset if corrupted
make reset
```

### Queue Issues
```bash
# Check Redis connection
redis-cli -h localhost ping

# View queue status
redis-cli
> KEYS bull:*
> LLEN bull:alerts:wait
```

### Worker Issues
```bash
# View logs
cd apps/worker
npm run dev

# Check for errors in output
```

## Testing

### E2E Tests
```bash
cd apps/web
npm run test:e2e

# Specific test
npx playwright test monitors.spec.ts

# With UI
npx playwright test --ui
```

### Manual Testing
```bash
# Seed test data
make seed

# Login with
# Email: dev@Saturn.co
# Check terminal for magic link
```

## Code Style

- TypeScript strict mode enabled
- ESLint for linting
- Prettier for formatting (via Next.js)
- Use Zod for validation
- Prisma for all database queries

## Troubleshooting

**Port already in use:**
```bash
# Kill processes
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Database connection errors:**
```bash
# Restart Postgres
make docker-down
make docker-up
```

**Prisma client out of sync:**
```bash
cd packages/db
npx prisma generate
```

**Redis connection errors:**
```bash
# Check Redis is running
redis-cli ping

# Restart
docker restart pulse-guard-redis
```

## Resources

- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs
- BullMQ Docs: https://docs.bullmq.io/
- Tailwind Docs: https://tailwindcss.com/docs
