# Testing Guide

## E2E Tests

```bash
# Run all E2E tests
cd apps/web
npm run test:e2e

# Specific test
npx playwright test monitors.spec.ts

# With UI
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

## Test Coverage

17 E2E test files covering:
- Authentication (magic links, Google OAuth)
- Monitor CRUD operations
- Ping API (all states and scenarios)
- Incident management
- Alert delivery (Email, Slack, Discord, Webhooks)
- Output capture
- Billing (Stripe integration)
- Integrations (Slack, WordPress, Kubernetes)
- Security features

## Manual Testing

### API Endpoint Tests

```bash
# Health check
curl http://localhost:3000/api/health

# Ping endpoint (get token from UI)
TOKEN="your_monitor_token"
curl http://localhost:3000/api/ping/$TOKEN

# With state tracking
curl "http://localhost:3000/api/ping/$TOKEN?state=start"
curl "http://localhost:3000/api/ping/$TOKEN?state=success&exitCode=0"

# With output capture
echo "Job output" | curl -X POST \
  -H "Content-Type: text/plain" \
  --data-binary @- \
  "http://localhost:3000/api/ping/$TOKEN?state=success"
```

### Rate Limiting Test

```bash
# Should succeed (60 requests allowed)
for i in {1..60}; do curl http://localhost:3000/api/ping/$TOKEN; done

# Should fail with 429 (rate limit exceeded)
curl http://localhost:3000/api/ping/$TOKEN
```

### Infrastructure Tests

```bash
# PostgreSQL
docker exec -it saturn-postgres psql -U postgres -c "SELECT version();"

# Redis
docker exec -it saturn-redis redis-cli ping

# MinIO
curl http://localhost:9000/minio/health/live
```

### Worker Tests

```bash
# Start worker with logging
cd apps/worker
npm run dev

# Trigger evaluator (wait 60s or restart worker)
# Check logs for:
# - "Evaluating monitors..."
# - "Found X monitors to check"
# - Incident creation if any monitors missed
```

### Alert Delivery Tests

1. **Email Alerts:**
   - Create monitor
   - Configure email channel
   - Trigger incident (miss a ping)
   - Check Resend dashboard for email

2. **Slack Alerts:**
   - Install Slack app
   - Configure Slack channel
   - Trigger incident
   - Verify message in Slack
   - Test acknowledge button

3. **Discord Alerts:**
   - Create Discord webhook
   - Configure Discord channel
   - Trigger incident
   - Verify rich embed in Discord

4. **Webhooks:**
   - Set up webhook endpoint (e.g., webhook.site)
   - Configure webhook channel
   - Trigger incident
   - Verify payload received

### Output Capture Tests

```bash
# Small output
echo "Success" | curl -X POST \
  -H "Content-Type: text/plain" \
  --data-binary @- \
  "http://localhost:3000/api/ping/$TOKEN?state=success"

# Large output (test size limit)
dd if=/dev/zero bs=1024 count=50 | \
  curl -X POST -H "Content-Type: text/plain" \
  --data-binary @- \
  "http://localhost:3000/api/ping/$TOKEN"

# With secrets (test redaction)
echo "password=secret123 api_key=abc123" | \
  curl -X POST -H "Content-Type: text/plain" \
  --data-binary @- \
  "http://localhost:3000/api/ping/$TOKEN"
# Verify redaction in UI
```

### Anomaly Detection Test

```bash
# Create monitor and send 15 pings with consistent duration
TOKEN="your_monitor_token"
for i in {1..15}; do
  curl "http://localhost:3000/api/ping/$TOKEN?state=success&durationMs=1000"
  sleep 5
done

# Send anomalous ping (10x normal duration)
curl "http://localhost:3000/api/ping/$TOKEN?state=success&durationMs=10000"

# Check for ANOMALY incident in dashboard
```

## Stripe Testing

See [STRIPE.md](STRIPE.md) for billing integration tests.

## Integration Tests

### CLI Tool
```bash
# Install CLI
cd packages/cli
npm link

# Test run wrapper
saturn run --token $TOKEN -- echo "Hello"

# Test monitor management (after device auth)
saturn monitors list
```

### Kubernetes Sidecar
See [integrations/kubernetes/README.md](../integrations/kubernetes/README.md)

### WordPress Plugin
See [integrations/wordpress/README.md](../integrations/wordpress/README.md)

## Debugging Failed Tests

### View Test Report
```bash
cd apps/web
npx playwright show-report
```

### Run Single Test
```bash
npx playwright test monitors.spec.ts --headed
```

### Inspect Test State
```bash
# Enable debug mode
PWDEBUG=1 npx playwright test
```

## CI/CD Testing

Tests run automatically on:
- Pull requests
- Merges to main
- Production deployments

View results in GitHub Actions.

## Test Data

Seed data includes:
- Test organization
- Sample monitors
- Test user (dev@Saturn.co)
- Alert channels

Reset test data:
```bash
make reset
```

## Performance Testing

### Load Test Ping API
```bash
# Install k6
brew install k6

# Run load test (example)
k6 run - <<EOF
import http from 'k6/http';
export default function() {
  http.get('http://localhost:3000/api/ping/YOUR_TOKEN');
}
EOF
```

## Common Issues

**Tests timeout:**
- Increase timeout in playwright.config.ts
- Check if services are running (docker-compose)

**Database errors:**
- Reset database: `make reset`
- Check migrations: `cd packages/db && npx prisma migrate status`

**Worker not processing:**
- Check Redis connection
- Verify REDIS_URL in .env
- View worker logs

## Resources

- Playwright Docs: https://playwright.dev/
- Testing Best Practices: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
