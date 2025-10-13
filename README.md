# Tokiflow

**Cron & Job Monitoring with Smart Alerts**

Tokiflow is a differentiated cron/job monitoring SaaS that goes beyond simple heartbeats, offering runtime analytics, output analysis, Slack-first alerts, and anomaly detection.

🌐 **Website**: [tokiflow.co](https://tokiflow.co)

## Features

- 🚀 **Fast DX**: Create monitors in <60s with copy-paste code snippets
- 📊 **Runtime Analytics**: Track duration distribution, detect anomalies (>3σ), flag degradation
- 🧮 **Statistical Anomaly Detection**: Welford algorithm + z-score analysis - UNIQUE!
- 💬 **Slack-First Alerts**: Rich incident cards with ack/mute buttons, slash commands
- 🎨 **Discord Native Support**: Rich embeds with color coding and emoji indicators
- 🔗 **Advanced Webhooks**: HMAC signatures, retry logic, custom events
- 📈 **Advanced Analytics**: Health scores (0-100), MTBF, MTTR, uptime tracking
- ☸️ **Kubernetes Integration**: Sidecar container + Helm chart for CronJobs
- 🔌 **WordPress Plugin**: Monitor wp-cron with native WordPress plugin
- 🔒 **Privacy Options**: Redacted output capture, self-hosted edition (roadmap)
- ⚡ **Smart Detection**: Beyond up/down - detect LATE, MISSED, FAIL, and ANOMALY conditions

## Quick Start

### Prerequisites

- Bun (latest)
- Docker & Docker Compose
- PostgreSQL, Redis, MinIO (provided via Docker Compose)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/tokiflow.git
cd tokiflow

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup and start services
make setup

# Start development servers
make dev
```

### Accessing the Application

- **Web App**: http://localhost:3000
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **Database**: localhost:5432 (postgres/postgres)
- **Redis**: localhost:6379

### Default Credentials

After running `make seed`:
- **Email**: dev@tokiflow.co
- **Auth**: Magic link (check console for link in dev mode)

## Project Structure

```
tokiflow/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── src/
│   │   │   ├── app/      # Next.js App Router pages
│   │   │   ├── components/ # React components
│   │   │   └── lib/      # Utility libraries
│   │   └── package.json
│   └── worker/           # Background worker (BullMQ)
│       ├── src/
│       │   ├── jobs/     # Job processors
│       │   └── index.ts
│       └── package.json
├── packages/
│   ├── db/               # Prisma database package
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   └── cli/              # CLI tool (pulse)
│       └── src/
├── docker-compose.yml    # Infrastructure services
├── Makefile             # Development commands
└── package.json         # Workspace root
```

## Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (Node.js runtime)
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ + Redis
- **Storage**: MinIO (S3-compatible)
- **Email**: Resend
- **Payments**: Stripe
- **Alerts**: Slack (Bolt), Email

### Data Flow

1. **Ping Ingestion**: Jobs call `/api/ping/:token` with state (start/success/fail)
2. **Run Recording**: Ping handler creates/updates Run records, calculates nextDueAt
3. **Schedule Evaluation**: Worker runs every 60s, marks monitors as MISSED/LATE
4. **Incident Creation**: Incidents created for failures, deduped by hash
5. **Alert Dispatch**: Alerts routed via Rules to Channels (Email/Slack)
6. **User Interaction**: Ack/resolve via dashboard or Slack buttons

## Development Commands

```bash
# Setup everything from scratch
make setup

# Start development servers
make dev

# Run database migrations
make migrate

# Generate Prisma client
make generate

# Seed database with test data
make seed

# Start Docker services only
make docker-up

# Stop Docker services
make docker-down

# Clean everything (including volumes)
make clean

# Reset and setup from scratch
make reset
```

## API Reference

### Public Ping Endpoint

```bash
# Simple heartbeat (success)
curl https://api.tokiflow.co/api/ping/YOUR_TOKEN

# With state
curl "https://api.tokiflow.co/api/ping/YOUR_TOKEN?state=start"
curl "https://api.tokiflow.co/api/ping/YOUR_TOKEN?state=success&durationMs=1234&exitCode=0"

# With output capture (POST)
curl -X POST \
  -H "Content-Type: text/plain" \
  --data-binary @output.log \
  "https://api.tokiflow.co/api/ping/YOUR_TOKEN?state=fail&exitCode=1"
```

### Integration Examples

#### Bash (Start/Finish)

```bash
TOKEN="tf_abc123..."
curl -fsS "https://api.tokiflow.co/api/ping/$TOKEN?state=start" || true

OUTPUT=$(your_job 2>&1); EC=$?
STATE=$([ $EC -eq 0 ] && echo "success" || echo "fail")

echo "$OUTPUT" | tail -c 32768 | \
curl -fsS -X POST -H "Content-Type: text/plain" \
  --data-binary @- \
  "https://api.tokiflow.co/api/ping/$TOKEN?state=$STATE&exitCode=$EC"
```

#### Python

```python
import requests, subprocess, sys

TOKEN = "tf_abc123..."
requests.get(f"https://api.tokiflow.co/api/ping/{TOKEN}?state=start")

p = subprocess.Popen(sys.argv[1:], stdout=subprocess.PIPE, 
                     stderr=subprocess.STDOUT, text=True)
out, _ = p.communicate()
state = "success" if p.returncode == 0 else "fail"

requests.post(
    f"https://api.tokiflow.co/api/ping/{TOKEN}?state={state}&exitCode={p.returncode}",
    data=out[-32768:].encode("utf-8")
)
```

#### Node.js

```javascript
import fetch from 'node-fetch';

const TOKEN = 'tf_abc123...';
await fetch(`https://api.tokiflow.co/api/ping/${TOKEN}?state=success`);
```

## CLI Tool

```bash
# Install CLI globally
bun install -g @tokiflow/cli

# Wrap a command with monitoring
tokiflow run --token tf_abc123... -- bash backup.sh

# View monitor status (requires setup)
tokiflow monitors list
```

## Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```env
# Site
SITE_URL=https://tokiflow.co

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tokiflow

# Redis
REDIS_URL=redis://localhost:6379

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Email (Resend)
RESEND_API_KEY=re_...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...

# Slack
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
SLACK_SIGNING_SECRET=...

# MinIO / S3
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=pulseguard-outputs
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
```

## Deployment

### Production Checklist

- [ ] Set strong `NEXTAUTH_SECRET` and `JWT_SECRET`
- [ ] Configure production database (Neon/Supabase)
- [ ] Set up Redis (Upstash/Redis Cloud)
- [ ] Configure S3 (R2/S3) with KMS encryption
- [ ] Set up email provider (Resend)
- [ ] Configure Stripe products and webhooks
- [ ] Set up Slack app and obtain credentials
- [ ] Configure domain and SSL
- [ ] Set up monitoring/logging (BetterStack/Datadog)

### Recommended Stack

- **Web**: Vercel
- **Worker**: Fly.io / Render / Railway
- **Database**: Neon / Supabase
- **Redis**: Upstash / Redis Cloud
- **Storage**: Cloudflare R2 / AWS S3

## Testing

```bash
# Run tests (coming soon)
bun test

# E2E tests with Playwright (coming soon)
bun test:e2e
```

## Integrations

Tokiflow integrates with your favorite platforms:

### Kubernetes
```bash
# Deploy with Helm
helm install pulseguard/pulseguard-monitor \
  --set pulseguard.token=tf_your_token \
  --set cronjob.schedule="0 3 * * *"
```
[Full Documentation](integrations/kubernetes/README.md)

### WordPress
```bash
# Install plugin
1. Upload to wp-content/plugins/
2. Activate in WordPress admin
3. Configure token in Settings → Tokiflow
```
[Full Documentation](integrations/wordpress/pulseguard-watchdog/readme.txt)

### Discord
Configure Discord webhooks for rich alert embeds with color coding and status emojis.

### Generic Webhooks
Connect to any HTTP endpoint with HMAC signatures, custom headers, and retry logic.

---

## Roadmap

### v1.0 ✅ COMPLETE
- ✅ Monitor CRUD
- ✅ Ping ingestion (start/success/fail)
- ✅ Schedule evaluation (MISSED/LATE detection)
- ✅ Email alerts
- ✅ Slack integration (OAuth + alerts + buttons)
- ✅ Stripe billing
- ✅ Complete dashboard
- ✅ CLI wrapper tool
- ✅ Output capture UI
- ✅ E2E tests
- ✅ Rate limiting

### v1.1 🚀 50% COMPLETE
- ✅ **Runtime anomaly detection** (Welford stats, z-score) **UNIQUE!**
- ✅ **Advanced analytics dashboard** (health scores, MTBF, MTTR)
- ✅ **Discord alerts** (rich embeds)
- ✅ **Advanced webhooks** (HMAC, retries, events)
- ✅ Output capture with redaction
- ⏸️ Slack slash commands enhancements
- ⏸️ Slack message threading

### v1.2 🚀 50% COMPLETE
- ✅ **Kubernetes CronJob sidecar** (Go + Helm) **GAME CHANGER!**
- ✅ **WordPress plugin** (wp-cron monitoring) **HUGE MARKET!**
- ✅ Discord alerts
- ✅ Webhooks
- ⏸️ CLI device authentication
- ⏸️ Monitor dependencies
- ⏸️ Maintenance windows
- ⏸️ Teams integration

### v2.0 (Future)
- Self-hosted edition
- Kubernetes Operator (CRD)
- Terraform provider
- SSO/SCIM
- Public status pages
- Mobile app
- PagerDuty/Opsgenie integration

## Documentation

Complete documentation available in [`docs/`](docs/):

- **[Complete Guide](docs/GUIDE.md)** - Setup, usage, and deployment (start here!)
- **[Stripe Integration](docs/STRIPE.md)** - Payment setup and testing
- **[Testing Guide](docs/TESTING.md)** - Test procedures and coverage
- **[Development Guide](docs/DEVELOPMENT.md)** - Architecture and development
- **[Project Archive](docs/ARCHIVE.md)** - Completion status and history
- **[Documentation Index](docs/README.md)** - Full documentation navigation

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

Copyright © 2025 Tokiflow. All rights reserved.

## Support

- **Website**: https://tokiflow.co
- **Email**: support@tokiflow.co

---

Built with ❤️ using Bun, Next.js, and modern web technologies.

