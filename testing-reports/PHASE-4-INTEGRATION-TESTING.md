# Phase 4: Integration Testing Plan

## Objective
Test complete user workflows end-to-end with real Next.js server, worker processes, and database interactions.

## Why Integration Tests?

**Problem with Phase 3**: API routes couldn't be unit tested due to Next.js 15 + Jest compatibility

**Solution**: Integration tests with real server provide:
- ✅ Real request/response handling
- ✅ Database interactions
- ✅ Authentication flow validation
- ✅ Worker job processing
- ✅ End-to-end feature validation

## Test Strategy

### Approach: API Integration Tests
Use **Supertest** with Next.js test server to make real HTTP requests

### Setup
```bash
npm install --save-dev supertest @types/supertest
```

### Test Structure
```typescript
// Integration test example
import { createServer } from 'http';
import request from 'supertest';
import { handler } from '@/app/api/monitors/route';

describe('Monitor API Integration', () => {
  it('should create monitor with authentication', async () => {
    const response = await request(app)
      .post('/api/monitors')
      .set('Cookie', authCookie)
      .send({ name: 'Test Monitor', type: 'CRON' });
    
    expect(response.status).toBe(201);
    expect(response.body.monitor).toBeDefined();
  });
});
```

## Priority Test Flows

### 1. Authentication Flow (CRITICAL)
**Test**: Signup → Email Verification → Login → Session Validation

Steps:
1. POST `/api/auth/signup` with email/password
2. Verify email verification sent
3. POST `/api/auth/signin` with credentials
4. Receive session cookie
5. Access protected route with cookie
6. Verify user data returned

**Files**: `apps/web/src/__tests__/integration/auth-flow.test.ts`

---

### 2. Monitor Lifecycle (CORE FEATURE)
**Test**: Create → Configure → Ping → Incident → Alert → Resolve

Steps:
1. Create monitor via POST `/api/monitors`
2. Get monitor token
3. Ping endpoint GET `/api/ping/[token]`
4. Verify run recorded
5. Simulate missed check (time travel)
6. Verify incident created by evaluator
7. Verify alert sent
8. Acknowledge incident
9. Resolve incident

**Files**: `apps/web/src/__tests__/integration/monitor-lifecycle.test.ts`

---

### 3. Billing Flow (REVENUE CRITICAL)
**Test**: Signup → Select Plan → Checkout → Webhook → Active Subscription

Steps:
1. Create Stripe checkout session POST `/api/stripe/checkout`
2. Simulate checkout completion
3. Send webhook POST `/api/stripe/webhook`
4. Verify subscription created in database
5. Verify org upgraded
6. Verify monitor limits updated

**Files**: `apps/web/src/__tests__/integration/billing-flow.test.ts`

---

### 4. Team Collaboration
**Test**: Invite → Accept → Access → Remove

Steps:
1. Send invitation POST `/api/team/invite`
2. Verify email sent
3. Accept invitation with token
4. Verify membership created
5. Test permissions (view monitors, create alerts)
6. Remove team member
7. Verify access revoked

**Files**: `apps/web/src/__tests__/integration/team-flow.test.ts`

---

### 5. Alert Delivery
**Test**: Incident → Route → Deliver → Verify

Steps:
1. Create alert channel POST `/api/channels`
2. Create alert rule POST `/api/rules`
3. Trigger incident
4. Verify alert job queued
5. Process alert job (worker)
6. Verify delivery logged

**Files**: `apps/web/src/__tests__/integration/alert-delivery.test.ts`

---

### 6. Status Page
**Test**: Create → Configure → Publish → Public Access

Steps:
1. Create status page POST `/api/status-pages`
2. Add components (monitors)
3. Configure theme
4. Publish (set public)
5. Access public URL (no auth)
6. Verify monitors displayed
7. Verify real-time updates

**Files**: `apps/web/src/__tests__/integration/status-page.test.ts`

---

### 7. Worker Job Processing
**Test**: Queue → Process → Complete → Side Effects

Steps:
1. Queue evaluator job
2. Process job (real worker execution)
3. Verify incidents created
4. Queue alert jobs
5. Process alert jobs
6. Verify side effects (emails sent, webhooks called)

**Files**: `apps/web/src/__tests__/integration/worker-jobs.test.ts`

---

### 8. CLI Integration
**Test**: Login → Token Storage → API Calls → Command Execution

Steps:
1. Run `saturn login` command
2. Simulate device authorization
3. Verify token stored
4. Run `saturn monitors list`
5. Verify API called with token
6. Run `saturn run "echo test"`
7. Verify ping sent, output captured

**Files**: `packages/cli/src/__tests__/integration/cli-flow.test.ts`

---

## Test Environment Setup

### Database
```typescript
// Use test database
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/saturn_test";

// Reset database before each test
beforeEach(async () => {
  await prisma.$executeRaw`TRUNCATE TABLE "User", "Org", "Monitor" CASCADE`;
});
```

### Redis
```typescript
// Use test Redis instance
process.env.REDIS_URL = "redis://localhost:6379/1"; // DB 1 for testing

// Flush Redis before each test
beforeEach(async () => {
  await redis.flushdb();
});
```

### External Services (Mocked)
```typescript
// Mock Stripe
jest.mock('stripe', () => mockStripe);

// Mock Resend
jest.mock('resend', () => mockResend);

// Mock Slack/Discord webhooks
nock('https://hooks.slack.com').post().reply(200);
```

---

## Implementation Plan

### Step 1: Setup (30 mins)
- [ ] Install Supertest
- [ ] Configure test database
- [ ] Create test utilities (auth helper, cleanup)
- [ ] Set up mock servers (Stripe, webhooks)

### Step 2: Authentication Flow (1 hour)
- [ ] Signup test
- [ ] Login test
- [ ] Session validation test
- [ ] Logout test
- [ ] Password reset test

### Step 3: Monitor Lifecycle (2 hours)
- [ ] Create monitor test
- [ ] Ping handling test
- [ ] Incident creation test
- [ ] Alert routing test
- [ ] Resolution test

### Step 4: Billing Flow (1.5 hours)
- [ ] Checkout session test
- [ ] Webhook handling test
- [ ] Subscription management test
- [ ] Plan limits test

### Step 5: Team Collaboration (1 hour)
- [ ] Invitation test
- [ ] Acceptance test
- [ ] Permissions test
- [ ] Removal test

### Step 6: Alert Delivery (1.5 hours)
- [ ] Channel creation test
- [ ] Rule configuration test
- [ ] Alert triggering test
- [ ] Delivery verification test

### Step 7: Status Pages (1 hour)
- [ ] Creation test
- [ ] Configuration test
- [ ] Public access test
- [ ] Real-time updates test

### Step 8: Worker Integration (1.5 hours)
- [ ] Job queueing test
- [ ] Job processing test
- [ ] Side effects test
- [ ] Error handling test

### Step 9: CLI Integration (1 hour)
- [ ] Auth flow test
- [ ] Monitor commands test
- [ ] Run wrapper test

---

## Success Criteria

- [ ] All 8 major flows tested
- [ ] 40+ integration tests passing
- [ ] Real database interactions validated
- [ ] Worker job processing verified
- [ ] API routes fully covered
- [ ] Zero integration bugs
- [ ] CI/CD ready

---

## Estimated Time
**Total**: 10-12 hours

**Breakdown**:
- Setup: 30 mins
- Auth: 1 hour
- Monitors: 2 hours
- Billing: 1.5 hours
- Team: 1 hour
- Alerts: 1.5 hours
- Status: 1 hour
- Worker: 1.5 hours
- CLI: 1 hour

---

## Next Steps After Phase 4

1. **Phase 5**: E2E expansion (Playwright)
2. **Phase 6**: Performance & accessibility
3. **Phase 7**: Security audit
4. **Phase 10**: CI/CD setup

---

*Phase 4 Plan Created: October 17, 2025*

