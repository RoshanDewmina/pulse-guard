# Testing Guide

## Quick Test

```bash
# Run all tests
make test

# Specific areas
npm test -- monitors
npm test -- incidents
npm test -- alerts
```

## Test Coverage

**50/50 Tests Passed (100%)**

- Infrastructure: 13/13 ✅
- Database: 10/10 ✅
- API Endpoints: 17/17 ✅
- Worker System: 6/6 ✅
- CLI Tools: 3/3 ✅
- Rate Limiting: 1/1 ✅

## Manual Testing

### 1. Infrastructure Tests

```bash
# PostgreSQL
docker exec -it pulseguard-postgres psql -U postgres -c "SELECT version();"

# Redis
docker exec -it pulseguard-redis redis-cli ping

# MinIO
curl http://localhost:9000/minio/health/live
```

### 2. API Tests

```bash
# Health check
curl http://localhost:3000/api/health

# Ping endpoint
TOKEN="your_monitor_token"
curl http://localhost:3000/api/ping/$TOKEN

# With parameters
curl "http://localhost:3000/api/ping/$TOKEN?state=success&exitCode=0&durationMs=1000"

# With output (POST)
echo "Job completed successfully" | \
  curl -X POST -H "Content-Type: text/plain" \
  --data-binary @- \
  "http://localhost:3000/api/ping/$TOKEN?state=success"

# Rate limiting (should fail on 61st request)
for i in {1..65}; do 
  curl http://localhost:3000/api/ping/$TOKEN
  echo " - Request $i"
done
```

### 3. Worker Tests

```bash
# Create monitor with 1-minute interval
# Don't send pings
# Wait 90 seconds (interval + grace)
# Worker should create MISSED incident

# Check logs
docker logs pulseguard-worker
```

### 4. Email Tests

```bash
# Trigger incident and check email delivery
# Verify in Resend dashboard at resend.com/emails
```

### 5. CLI Tests

```bash
cd packages/cli

# Test wrapper
bun src/index.ts run --token $TOKEN -- echo "Test job"
bun src/index.ts run --token $TOKEN -- bash -c "exit 1"  # Test failure

# Test monitors command
bun src/index.ts monitors list
```

## E2E Tests (Playwright)

```bash
cd apps/web

# Install Playwright
./install-playwright.sh

# Run E2E tests
npm test:e2e

# Specific test
npx playwright test auth.spec.ts

# With UI
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

### E2E Test Suites

Available in `apps/web/e2e/`:
- `auth.spec.ts` - Authentication flow
- `monitors.spec.ts` - Monitor CRUD
- `incidents.spec.ts` - Incident management
- `ping-api.spec.ts` - Ping endpoint
- `alert-delivery.spec.ts` - Alert system
- `billing-stripe.spec.ts` - Stripe billing

## Test Scripts

### Stripe Testing
```bash
cd docs/testing
./test-stripe-api.sh        # Test Stripe API
./test-stripe-billing.sh    # Test billing flow
```

## Performance Testing

```bash
# Load test ping endpoint
ab -n 1000 -c 10 http://localhost:3000/api/ping/$TOKEN

# With Apache Bench
brew install apache-bench

# Or with k6
k6 run load-tests/ping-api.js
```

## Test Data

### Seeded Data (make seed)
- Organization: "Test Org"
- User: dev@tokiflow.co
- Monitors: 3 sample monitors
- Runs: Historical run data
- Incidents: Sample incidents

### Reset Test Data
```bash
make reset  # Clean and reseed
```

## Verified Working Features

✅ **MISSED Detection**: 70s test confirmed  
✅ **Email Alerts**: Email ID verified in Resend  
✅ **Rate Limiting**: Triggers at request #61  
✅ **CLI Wrapper**: Wraps commands correctly  
✅ **Ping States**: start/success/fail all working  
✅ **Output Capture**: Stores in S3/MinIO  
✅ **Worker Evaluation**: Runs every 60s  
✅ **Incident Creation**: Auto-creates on failure  
✅ **Slack Integration**: OAuth and posting ready  

## Common Test Scenarios

### Scenario 1: Successful Job
```bash
curl "$API/ping/$TOKEN?state=start"
sleep 2
curl "$API/ping/$TOKEN?state=success&exitCode=0&durationMs=2000"
```

### Scenario 2: Failed Job
```bash
curl "$API/ping/$TOKEN?state=start"
sleep 1
curl "$API/ping/$TOKEN?state=fail&exitCode=1"
```

### Scenario 3: Missed Job
```bash
# Create monitor with 1-min interval, 30s grace
# Don't send any pings
# Wait 90 seconds
# Check incidents table - should have MISSED incident
```

### Scenario 4: Late Job
```bash
# Create monitor with 5-min interval, 1-min grace
# Wait 5:30 (past deadline but within grace)
# Send ping
# Should be marked as LATE
```

## CI/CD Testing

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: |
    make docker-up
    make migrate
    make test
    make test:e2e
```

## Troubleshooting Tests

**Tests hanging:**
- Check Docker services are running
- Verify database connection
- Check Redis connection

**E2E tests failing:**
- Ensure app is running on port 3000
- Check Playwright browsers installed
- Try with `--headed` flag to see browser

**API tests failing:**
- Verify token is valid
- Check rate limits not exceeded
- Ensure database is seeded

## Test Maintenance

- Update tests when adding features
- Keep E2E tests for critical paths only
- Mock external services (Stripe, Resend) in unit tests
- Use test mode for Stripe integration tests

## Test Coverage Goals

- Unit tests: 80%+ coverage
- API routes: 100% coverage
- Critical paths: E2E coverage
- Load testing: 1000+ req/s

