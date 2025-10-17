# Phase 3 Completion Plan

## Current Status (Starting Point)
- **API Routes**: 7/32 tested (22%)
- **Worker Jobs**: 2/6 tested (33%)
- **CLI Commands**: 1/5 tested (20%)
- **Components**: ~20% estimated
- **Hooks**: 0% 
- **Overall Phase 3**: ~35% complete

## Target
- **Web App**: 90%+ coverage
- **Worker**: 95%+ coverage
- **CLI**: 90%+ coverage

## Strategy: Focus on High-Impact, Testable Code

### Priority 1: Business Logic & Utilities (Highest ROI)
These are easier to test and provide real coverage:
- ✅ `apps/web/src/lib/stripe.ts` - Stripe utilities
- ✅ `apps/web/src/lib/email.ts` - Email sending
- ✅ `apps/web/src/lib/redis.ts` - Redis operations
- ✅ `apps/web/src/lib/queues.ts` - Queue management
- ✅ `apps/worker/src/lib/discord.ts` - Discord integration
- ✅ `apps/worker/src/logger.ts` - Logger utilities

### Priority 2: Worker Jobs (Critical for Production)
- ✅ `evaluator.ts` - DONE
- ✅ `email.ts` - DONE
- ⚠️ `alerts.ts` - Alert routing logic
- ⚠️ `slack.ts` - Slack delivery
- ⚠️ `discord.ts` - Discord delivery
- ⚠️ `webhook.ts` - Custom webhooks

### Priority 3: CLI Commands
- ✅ `login.ts` - DONE (setup issues, needs fix)
- ⚠️ `logout.ts` - Simple, quick win
- ⚠️ `monitors.ts` - Core functionality
- ⚠️ `run.ts` - Wrapper command
- ⚠️ `config.ts` - Config management

### Priority 4: React Components (Visual/UI)
- Form components with validation
- Chart components
- Modal/dialog components
- Button/input components

### Priority 5: Custom Hooks
- `useMonitors` - Monitor data fetching
- `useIncidents` - Incident management
- Form hooks with validation

## Execution Plan

### Step 1: Complete Worker Tests (Est. 3 hours)
1. Test `alerts.ts` job processor
2. Test `webhook.ts` job processor  
3. Test utility functions (logger, health)

### Step 2: Complete CLI Tests (Est. 2 hours)
1. Fix and complete `login.ts` tests
2. Test `logout.ts`
3. Test `monitors.ts` commands
4. Test `config.ts` management

### Step 3: Test Business Logic/Utilities (Est. 4 hours)
1. Stripe utilities (`lib/stripe.ts`)
2. Email utilities (`lib/email.ts`)
3. Redis operations (`lib/redis.ts`)
4. Queue management (`lib/queues.ts`)
5. Discord utilities (`worker/lib/discord.ts`)

### Step 4: Component Tests (Est. 4 hours)
1. Form components (monitor creation, alert channels)
2. Chart components (metrics, uptime)
3. Modal components (confirmations, forms)

### Step 5: Hook Tests (Est. 2 hours)
1. Data fetching hooks
2. Form validation hooks
3. State management hooks

## Coverage Calculation
To reach 90% coverage:
- **Lines of Code (estimated)**: 
  - Web app: ~15,000 LOC
  - Worker: ~2,000 LOC
  - CLI: ~1,500 LOC
- **Required Test Coverage**:
  - Web: ~13,500 LOC tested
  - Worker: ~1,900 LOC tested
  - CLI: ~1,350 LOC tested

## Quick Wins (Complete These First)
1. ✅ Worker utilities (logger, health) - 30 min
2. ✅ CLI logout command - 20 min
3. ✅ CLI config management - 30 min
4. ✅ Email utilities - 45 min
5. ✅ Redis utilities - 30 min
6. ✅ Simple React components - 1 hour

## Notes on Testing Approach
Due to Next.js 15 + Jest compatibility issues:
- **API Routes**: Focus on business logic extraction, test that
- **Components**: Use @testing-library/react
- **Utilities**: Direct unit tests (easiest, highest value)
- **Worker**: Node.js context, easier to test
- **CLI**: Node.js context, command simulation

## Success Metrics
- [ ] Worker coverage: 95%+
- [ ] CLI coverage: 90%+
- [ ] Web app coverage: 90%+
- [ ] All critical paths tested
- [ ] Zero critical bugs
- [ ] Production-ready confidence

## Time Estimate
- **Total Remaining**: ~15 hours
- **Per Package**: 
  - Worker: 3 hours
  - CLI: 2 hours
  - Web utilities: 4 hours
  - Components: 4 hours
  - Hooks: 2 hours

