# PulseGuard Feature Inventory

## Web App (apps/web)

### Authentication & User Management
- Magic link authentication (email)
- Google OAuth
- Device authentication flow (CLI)
- Password-based authentication
- User signup, signin, signout
- Account deletion & data export (GDPR)

### Monitor Management
- Create/Read/Update/Delete monitors
- Schedule types: CRON, INTERVAL
- Grace period configuration
- Monitor tokens for ping API
- Tags for organization
- Monitor runs history
- Advanced settings: custom headers, assertions, retries

### Ping API
- Public ping endpoint: `/api/ping/[token]`
- State tracking: start, success, fail
- Exit code capture
- Duration tracking (durationMs)
- Rate limiting (60 requests/min)
- Output capture (with S3 storage)
- Secret redaction in outputs

### Incident Management
- Incident types: MISSED, LATE, FAIL, ANOMALY
- Auto-creation by evaluator
- Manual acknowledge
- Manual resolve
- Incident history & timeline

### Alert Channels
- Email (via Resend)
- Slack (OAuth + webhooks)
- Discord (webhook)
- Generic webhooks
- PagerDuty (planned)

### Alert Rules
- Monitor-based routing
- Channel assignment
- Suppress duplicate alerts
- "Only when all fail" logic

### Analytics & Insights
- Uptime percentage
- Response time tracking
- Anomaly detection (Welford's algorithm)
- Health score calculation
- Duration charts & sparklines
- Incident trends

### Status Pages
- Public/private status pages
- Custom domains
- Component grouping
- Theme customization (colors, logo)
- Embed support
- Real-time status updates

### Organizations & Teams
- Multi-tenant organizations
- Team member invitations
- Role-based access (Owner, Admin, Member)
- Organization settings

### Billing (Stripe)
- Subscription plans: Free, Pro, Business
- Checkout flow
- Customer portal
- Webhook handling (subscription events)
- Usage limits enforcement

### Maintenance Windows
- Schedule maintenance periods
- Suppress alerts during maintenance
- Active/inactive states

### Integrations
- Slack app installation
- Slack commands & interactive buttons
- Slack thread management
- WordPress plugin support
- Kubernetes sidecar support

### API Keys
- API key generation
- Key rotation
- Key revocation
- Scoped permissions

### Security
- Rate limiting on all public APIs
- CSRF protection (NextAuth)
- XSS protection
- Secure password hashing (bcryptjs)
- Environment variable management
- Secret redaction in logs/outputs

### Settings
- Profile management
- Organization settings
- Billing settings
- Team management
- API keys management
- Integration settings

## Worker (apps/worker)

### Background Jobs
- **Evaluator** (every 60s): Check for missed/late monitors
- **Alerts**: Dispatch alerts to channels
- **Email**: Send email notifications
- **Slack**: Send Slack messages
- **Discord**: Send Discord messages
- **Webhook**: Send HTTP webhooks

### Queue Management
- BullMQ job processing
- Redis-backed queues
- Job retry logic
- Failed job handling

### Monitoring
- Health checks
- Sentry error tracking
- Structured logging (Pino)

## CLI (packages/cli)

### Commands
- `saturn login` - Device authentication
- `saturn logout` - Clear credentials
- `saturn monitors list` - List monitors
- `saturn monitors create` - Create monitor
- `saturn monitors delete` - Delete monitor
- `saturn run --token <TOKEN> -- <command>` - Wrap command execution

### Configuration
- Token storage (secure config)
- API endpoint configuration

## Database (packages/db)

### Models
- User
- Account (OAuth)
- Session
- VerificationToken
- Organization
- Membership
- Monitor
- Run
- Incident
- Alert
- Channel
- Rule
- StatusPage
- MaintenanceWindow
- ApiKey
- Subscription

### Migrations
- Prisma schema
- Migration files
- Seed data

## Integrations

### Kubernetes (integrations/kubernetes)
- **Agent**: Auto-discovery of CronJobs via annotations
- **Sidecar**: Manual sidecar pattern for advanced use cases
- **Helm Chart**: Easy installation
- RBAC configuration
- Multi-cluster support
- Namespace isolation

### Terraform Provider (integrations/terraform-provider)
- Monitor management
- Integration configuration
- Alert rule management
- Status page management
- Import existing resources
- Data sources

### WordPress Plugin (integrations/wordpress)
- WP-Cron monitoring
- Settings page
- API integration
- Automatic ping on cron execution

## API Routes

### Public (No Auth)
- `GET/POST /api/ping/:token` - Receive pings
- `GET /api/health` - Health check
- `GET /status/:slug` - Public status page

### Protected (Auth Required)
- `/api/monitors` - Monitor CRUD
- `/api/monitors/:id/runs` - Run history
- `/api/incidents` - Incident management
- `/api/incidents/:id/ack` - Acknowledge incident
- `/api/incidents/:id/resolve` - Resolve incident
- `/api/channels` - Channel CRUD
- `/api/rules` - Rule CRUD
- `/api/status-pages` - Status page CRUD
- `/api/status-pages/:id/verify-domain` - Domain verification
- `/api/api-keys` - API key management
- `/api/org` - Organization management
- `/api/team/invite` - Team invitations
- `/api/user/export` - GDPR export
- `/api/outputs/:key` - Output retrieval (S3 presigned URL)

### Integrations
- `/api/slack/install` - Slack OAuth
- `/api/slack/callback` - Slack OAuth callback
- `/api/slack/actions` - Slack interactive actions
- `/api/slack/commands` - Slack slash commands
- `/api/stripe/checkout` - Checkout session
- `/api/stripe/portal` - Customer portal
- `/api/stripe/webhook` - Stripe webhooks

### Cron
- `/api/cron/check-missed` - Manual evaluator trigger

## Tech Stack
- Frontend: Next.js 15, React 19, TypeScript 5
- Backend: Next.js API Routes, NextAuth.js
- Database: PostgreSQL (Prisma ORM)
- Cache/Queue: Redis (BullMQ, ioredis)
- Storage: S3-compatible (AWS S3, MinIO)
- Email: Resend
- Payments: Stripe
- Error Tracking: Sentry
- Deployment: Vercel (web) + Fly.io (worker)
- UI: TailwindCSS, shadcn/ui, Radix UI

## Test Coverage (Current)
- E2E Tests: 16 Playwright tests
- Unit Tests: 10 utility tests, 13 component tests
- Coverage: ~40% (estimated)



