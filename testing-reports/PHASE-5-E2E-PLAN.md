# Phase 5: E2E Testing Expansion Plan

## Current State
- **16 E2E test files** (190 test cases total)
- **Target**: 30+ test files, 250+ test cases
- **Browser**: Chromium only
- **Viewport**: Desktop only

---

## Existing E2E Coverage ✅

1. ✅ `auth.spec.ts` - Authentication flows
2. ✅ `auth-password.spec.ts` - Password reset
3. ✅ `homepage.spec.ts` - Landing page
4. ✅ `dashboard.spec.ts` - Main dashboard
5. ✅ `monitors.spec.ts` - Monitor list
6. ✅ `monitor-crud.spec.ts` - Monitor CRUD
7. ✅ `monitors-full.spec.ts` - Full monitor flow
8. ✅ `incidents.spec.ts` - Incidents page
9. ✅ `incident-flow.spec.ts` - Full incident flow
10. ✅ `alert-delivery.spec.ts` - Alert delivery
11. ✅ `ping-api.spec.ts` - Ping endpoint
12. ✅ `output-capture.spec.ts` - Output capture
13. ✅ `billing-stripe.spec.ts` - Stripe billing
14. ✅ `integrations.spec.ts` - Integrations
15. ✅ `settings.spec.ts` - Settings page
16. ✅ `security-pr12.spec.ts` - Security tests

---

## Missing Coverage (Per Plan) ⚠️

### 1. Status Pages ⚠️ MISSING
- [ ] Create status page
- [ ] Configure components
- [ ] Configure theme
- [ ] Publish status page
- [ ] Public access (no auth)
- [ ] Embed code generation
- [ ] Real-time status updates

**File**: `e2e/status-pages.spec.ts`

---

### 2. Analytics Dashboard ⚠️ MISSING
- [ ] View analytics charts
- [ ] Filter by date range
- [ ] Filter by monitor
- [ ] Export analytics data
- [ ] MTBF/MTTR calculations
- [ ] Uptime percentage
- [ ] Response time trends

**File**: `e2e/analytics.spec.ts`

---

### 3. Maintenance Windows ⚠️ MISSING
- [ ] Schedule maintenance window
- [ ] Active maintenance state
- [ ] Alerts suppressed during maintenance
- [ ] Edit maintenance window
- [ ] Delete maintenance window
- [ ] Past maintenance history

**File**: `e2e/maintenance-windows.spec.ts`

---

### 4. API Key Management ⚠️ PARTIAL
- [ ] Create API key
- [ ] View API key list
- [ ] Rotate API key
- [ ] Revoke API key
- [ ] Test API key usage
- [ ] Rate limit per org (20 keys)

**File**: `e2e/api-keys.spec.ts`

---

### 5. Team Management ⚠️ PARTIAL
- [ ] Invite team member
- [ ] Accept invitation
- [ ] View team members list
- [ ] Change member role
- [ ] Remove team member
- [ ] Permission checks (OWNER vs ADMIN vs MEMBER)
- [ ] Multi-org membership

**File**: `e2e/team-management.spec.ts`

---

### 6. Advanced Monitor Settings ⚠️ PARTIAL
- [ ] Custom HTTP headers
- [ ] Response assertions (status code, body, headers)
- [ ] Retry configuration
- [ ] Timeout settings
- [ ] HTTP method selection (GET, POST, PUT)
- [ ] Request body configuration
- [ ] TLS/SSL verification

**File**: `e2e/monitor-advanced.spec.ts`

---

### 7. Responsive Design Tests ⚠️ MISSING
Test all critical flows on:
- [ ] Mobile (375px - iPhone)
- [ ] Mobile (414px - iPhone Plus)
- [ ] Tablet (768px - iPad)
- [ ] Tablet (1024px - iPad Pro)
- [ ] Desktop (1280px)
- [ ] Desktop (1920px)
- [ ] 4K (2560px)

**File**: `e2e/responsive.spec.ts`

---

### 8. Multi-Browser Tests ⚠️ MISSING
Run ALL tests on:
- [ ] Chromium ✅ (current)
- [ ] Firefox ⚠️ (not tested)
- [ ] WebKit/Safari ⚠️ (not tested)

---

### 9. Onboarding Flow ⚠️ MISSING
- [ ] First-time user onboarding
- [ ] Create first organization
- [ ] Create first monitor
- [ ] Test first ping
- [ ] View first incident
- [ ] Complete setup wizard

**File**: `e2e/onboarding.spec.ts`

---

### 10. Organization Settings ⚠️ MISSING
- [ ] Update org name
- [ ] Update org logo
- [ ] Update org billing info
- [ ] Delete organization
- [ ] Transfer ownership

**File**: `e2e/org-settings.spec.ts`

---

### 11. Alerts Configuration ⚠️ PARTIAL
- [ ] Create Slack alert channel
- [ ] Create Discord alert channel
- [ ] Create Email alert channel
- [ ] Create Webhook alert channel
- [ ] Configure alert rules
- [ ] Test alert delivery
- [ ] Alert escalation

**File**: `e2e/alerts-config.spec.ts`

---

### 12. User Profile & Settings ⚠️ PARTIAL
- [ ] Update profile (name, email, image)
- [ ] Change password
- [ ] Enable 2FA
- [ ] API token management
- [ ] Notification preferences
- [ ] Timezone settings
- [ ] Delete account (GDPR)

**File**: `e2e/user-profile.spec.ts`

---

## Implementation Priority

### HIGH PRIORITY (Must Have)
1. **Status Pages** - Core feature, customer-facing
2. **Analytics Dashboard** - Business value
3. **Team Management** - Multi-user support
4. **API Keys** - Developer experience
5. **Responsive Design** - Mobile users

### MEDIUM PRIORITY (Should Have)
6. **Maintenance Windows** - Operational necessity
7. **Advanced Monitor Settings** - Power users
8. **Multi-Browser** - Compatibility
9. **Onboarding** - User activation

### LOW PRIORITY (Nice to Have)
10. **Org Settings** - Admin tasks
11. **Alerts Config** - Already partially covered
12. **User Profile** - Self-service

---

## Execution Plan

### Week 1: High Priority (15-20 hours)
- Day 1-2: Status Pages (4 hours)
- Day 3: Analytics Dashboard (3 hours)
- Day 4: Team Management (3 hours)
- Day 5: API Keys (2 hours)
- Day 6-7: Responsive Design (5 hours)

### Week 2: Medium Priority (10-15 hours)
- Day 1: Maintenance Windows (3 hours)
- Day 2: Advanced Monitor Settings (3 hours)
- Day 3-4: Multi-Browser Testing (5 hours)
- Day 5: Onboarding Flow (2 hours)

### Week 3: Low Priority + Polish (5-10 hours)
- Day 1: Org Settings (2 hours)
- Day 2: Alerts Config (2 hours)
- Day 3: User Profile (2 hours)
- Day 4-5: Bug fixes and polish (4 hours)

**Total Estimated Time**: 30-45 hours

---

## Success Criteria

- [ ] 30+ E2E test files
- [ ] 250+ E2E test cases
- [ ] All critical flows tested
- [ ] 3 browsers tested (Chromium, Firefox, WebKit)
- [ ] 7 viewports tested (mobile to 4K)
- [ ] 95%+ pass rate
- [ ] < 10 minute total test execution time

---

## Test Execution Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run on specific viewport
npx playwright test --grep @mobile
npx playwright test --grep @tablet
npx playwright test --grep @desktop

# Run specific test file
npx playwright test e2e/status-pages.spec.ts

# Debug mode
npx playwright test --debug

# Generate report
npx playwright show-report
```

---

## Current vs Target

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Test Files** | 16 | 30+ | 14 files |
| **Test Cases** | 190 | 250+ | 60+ tests |
| **Browsers** | 1 | 3 | 2 browsers |
| **Viewports** | 1 | 7 | 6 viewports |
| **Coverage** | 60% | 95% | 35% |

---

*Phase 5 Plan Created: October 17, 2025*  
*Target Completion: 30-45 hours*

