# Tokiflow - Complete Guide

**Cron & Job Monitoring with Smart Alerts**

## Quick Start

### Prerequisites
- Bun (latest)
- Docker & Docker Compose

### Setup (< 5 minutes)

```bash
# Clone and setup
git clone <repo-url>
cd tokiflow

# One-command setup
make setup

# Start development
make dev
```

Access at http://localhost:3000

### Default Login
- Email: `dev@tokiflow.co`
- Auth: Magic link (check terminal for dev link)

## Testing Your First Monitor

```bash
# Get token from seeded monitor or create one in UI
TOKEN="your_token_here"

# Send a ping
curl http://localhost:3000/api/ping/$TOKEN

# With start/finish flow
curl "http://localhost:3000/api/ping/$TOKEN?state=start"
# ... run your job ...
curl "http://localhost:3000/api/ping/$TOKEN?state=success&exitCode=0"

# Using CLI wrapper
tokiflow run --token $TOKEN -- bash your-script.sh
```

## Project Structure

```
tokiflow/
├── apps/
│   ├── web/              # Next.js app (frontend + API)
│   └── worker/           # BullMQ background jobs
├── packages/
│   ├── db/               # Prisma database
│   └── cli/              # CLI tool
└── integrations/         # Kubernetes & WordPress
```

## Architecture

**Stack**: Next.js 14, PostgreSQL 17, Redis 7, BullMQ, Prisma, Stripe, Resend

**Flow**:
1. Job pings `/api/ping/:token`
2. Run recorded in database
3. Worker evaluates every 60s for MISSED/LATE
4. Incidents created on failures
5. Alerts sent via email/Slack

## Development Commands

```bash
make setup      # Initial setup
make dev        # Start dev servers
make migrate    # Run DB migrations
make seed       # Seed test data
make reset      # Clean & reset everything
```

## Key Features Implemented

✅ Monitor CRUD (cron & interval schedules)  
✅ Ping API (start/success/fail states)  
✅ Schedule evaluation (MISSED/LATE/FAIL detection)  
✅ Email alerts (Resend)  
✅ Slack integration (OAuth + buttons)  
✅ Stripe billing (3 tiers)  
✅ CLI wrapper tool  
✅ Output capture  
✅ Rate limiting (60 req/min)  
✅ 13 web pages with charts  

## Environment Variables

Key variables (see `.env.example` for full list):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pulseguard
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Email
RESEND_API_KEY=re_...

# Stripe (optional for dev)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_BUSINESS=price_...

# Slack (optional)
SLACK_CLIENT_ID=...
SLACK_CLIENT_SECRET=...
SLACK_SIGNING_SECRET=...

# S3/MinIO
S3_ENDPOINT=http://localhost:9000
S3_BUCKET=pulseguard-outputs
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
```

## Deployment

### Production Stack (Recommended)
- **Web**: Vercel
- **Worker**: Fly.io / Render
- **Database**: Neon / Supabase
- **Redis**: Upstash
- **Storage**: Cloudflare R2 / AWS S3

### Checklist
- [ ] Strong `NEXTAUTH_SECRET` and `JWT_SECRET`
- [ ] Production database configured
- [ ] Redis configured
- [ ] S3 storage configured
- [ ] Resend verified domain
- [ ] Stripe live keys & webhooks
- [ ] Slack app credentials
- [ ] Domain & SSL configured

## Integration Examples

### Bash
```bash
TOKEN="tf_abc123..."
curl -fsS "https://api.tokiflow.co/api/ping/$TOKEN?state=start"
OUTPUT=$(your_job 2>&1); EC=$?
STATE=$([ $EC -eq 0 ] && echo "success" || echo "fail")
echo "$OUTPUT" | curl -fsS -X POST -H "Content-Type: text/plain" \
  --data-binary @- "https://api.tokiflow.co/api/ping/$TOKEN?state=$STATE&exitCode=$EC"
```

### Python
```python
import requests, subprocess
TOKEN = "tf_abc123..."
requests.get(f"https://api.tokiflow.co/api/ping/{TOKEN}?state=start")
p = subprocess.Popen(["your-command"], capture_output=True, text=True)
out, _ = p.communicate()
state = "success" if p.returncode == 0 else "fail"
requests.post(f"https://api.tokiflow.co/api/ping/{TOKEN}?state={state}", data=out)
```

### Cron
```cron
*/15 * * * * curl -fsS https://api.tokiflow.co/api/ping/tf_token_here || true
0 3 * * * /scripts/backup.sh && curl -fsS https://api.tokiflow.co/api/ping/tf_token2
```

## Troubleshooting

### Port conflicts
```bash
# Check ports: 3000, 5432, 6379, 9000, 9001
sudo lsof -ti:3000 | xargs kill -9
```

### Database issues
```bash
docker ps | grep postgres
docker logs pulseguard-postgres
make docker-down && make docker-up
```

### Worker not running
```bash
# Check Redis
docker exec -it pulseguard-redis redis-cli ping
# Should return PONG
```

### Reset everything
```bash
make reset  # Clean and setup from scratch
```

## Next Steps

See [ROADMAP.md](../ROADMAP.md) for future features:
- **v1.1**: Runtime anomaly detection, advanced analytics
- **v1.2**: Monitor groups, dependencies, maintenance windows
- **v2.0**: Mobile app, status pages, self-hosted edition

## Support

- Main README: [../README.md](../README.md)
- Contributing: [../CONTRIBUTING.md](../CONTRIBUTING.md)
- Stripe Setup: [STRIPE.md](STRIPE.md)
- Testing: [TESTING.md](TESTING.md)

