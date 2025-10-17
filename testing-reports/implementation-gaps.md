# Implementation Gaps & Issues

## Critical Issues (Security & Compliance)

### 1. User Data Export (GDPR) - INCOMPLETE
**File:** `apps/web/src/app/api/user/export/route.ts`
**Issue:** Returns minimal placeholder data, missing:
- Monitors, runs, incidents
- Memberships, organizations
- Alert channels, rules
- No async export for large datasets
- No rate limiting

### 2. Account Deletion (GDPR Right to Erasure) - NON-FUNCTIONAL
**File:** `apps/web/src/app/api/user/export/route.ts` (DELETE)
**Issue:** Accepts confirmation but doesn't delete anything
- No user data deletion
- No S3 cleanup
- No organization ownership transfer
- Compliance risk

### 3. API Key Management - MOCK DATA ONLY
**File:** `apps/web/src/app/api/api-keys/route.ts`
**Issue:** Returns hardcoded placeholder keys
- Keys not stored in database
- Keys not hashed before storage
- No actual key generation/validation
- Security risk

### 4. API Key Revocation - NON-FUNCTIONAL
**File:** `apps/web/src/app/api/api-keys/[id]/route.ts`
**Issue:** Doesn't actually revoke keys
- No database update
- Keys remain valid after "revocation"

### 5. Team Invitations - INCOMPLETE
**File:** `apps/web/src/app/api/team/invite/route.ts`
**Issue:** No actual invitation flow
- Emails not sent
- No invitation record in database
- No invitation tokens generated
- Can't accept/reject invitations

## High Priority Issues

### 6. Maintenance Windows - UNIMPLEMENTED
**File:** `apps/web/src/lib/maintenance/scheduler.ts`
**Issue:** Entire feature is placeholder
- No database model
- All functions return empty/mock data
- Feature advertised but non-functional

### 7. Monitor Updates - INCOMPLETE
**File:** `apps/web/src/app/api/monitors/[id]/route.ts` (PATCH)
**Issue:** Limited update functionality
- Only updates name
- Can't update schedule, grace period, etc.
- Missing validation

### 8. Monitor Deletion - MISSING CLEANUP
**File:** `apps/web/src/app/api/monitors/[id]/route.ts` (DELETE)
**Issue:** No cleanup of associated resources
- S3 outputs not deleted
- No confirmation check
- Should archive instead of hard delete

### 9. Pending Invitations List - NON-FUNCTIONAL
**File:** `apps/web/src/app/api/team/invite/route.ts` (GET)
**Issue:** Returns empty array
- No database query
- Can't view pending invitations

## Medium Priority Issues

### 10. Console.log in Production Code
**Affected Files:** 47 files, 114 instances
**Issue:** Using console.log instead of proper logging
- Should use structured logging
- No log levels
- Debugging statements left in prod code

### 11. Stripe Placeholder for Build
**File:** `apps/web/src/lib/stripe.ts`
**Issue:** Fallback to placeholder key
- `sk_test_placeholder_for_build` if env var missing
- Could mask configuration errors
- Should fail early instead

### 12. Incomplete Status Page Domain Verification
**File:** `apps/web/src/app/api/status-pages/[id]/verify-domain/route.ts`
**Issue:** Verification logic incomplete

### 13. Missing Database Indexes
**Potential Issue:** Performance degradation
- Need to verify indexes on frequently queried fields
- Monitor.token, Run.monitorId, Incident.monitorId

## Security Concerns

### 14. No API Key Hashing
**File:** `apps/web/src/app/api/api-keys/route.ts`
**Issue:** TODO indicates keys should be hashed but aren't
- Keys would be stored in plaintext
- If database compromised, all keys exposed

### 15. No Rate Limiting on Key Creation
**File:** `apps/web/src/app/api/api-keys/route.ts`
**Issue:** Users could create unlimited API keys
- Potential abuse vector

### 16. No Audit Logging
**Multiple Files**
**Issue:** Security events not logged
- Account deletions
- API key creation/revocation
- Permission changes
- No audit trail

## Code Quality Issues

### 17. Inconsistent Error Handling
**Multiple Files**
**Issue:** Some endpoints have proper error handling, others don't
- Inconsistent error messages
- Some leak stack traces

### 18. Missing Input Validation
**Multiple API Routes**
**Issue:** Not all endpoints use Zod validation
- Some rely on TypeScript types only
- Runtime validation gaps

### 19. No Request Timeout Handling
**API Routes with External Calls**
**Issue:** External API calls (Stripe, Slack, Discord) lack timeout handling
- Could hang indefinitely
- Need circuit breakers

### 20. Commented-out Code
**Various Files**
**Issue:** Old code left as comments
- Should be removed (use git history instead)

## Documentation TODOs

### 21. Legal Documents Incomplete
**Files:** `website/docs/legal/*.md`
**Issue:** Multiple TODO placeholders in:
- Terms of Service
- Privacy Policy  
- Security documentation
- Missing jurisdiction, refund policy, SLA details

### 22. Website Configuration TODOs
**File:** `website/src/config/constants.ts`
**Issue:** Placeholder values for:
- PostHog analytics key
- Algolia search credentials
- Social media handles

## Testing Gaps

### 23. No Unit Tests for API Routes
**All files in `apps/web/src/app/api/**`**
**Issue:** 0% test coverage on API routes
- Critical paths untested
- No mocking of external services

### 24. No Worker Tests
**Directory:** `apps/worker/src/**`
**Issue:** 0% test coverage on worker
- Job processors untested
- Queue handling untested

### 25. No CLI Tests
**Directory:** `packages/cli/src/**`
**Issue:** 0% test coverage on CLI
- Commands untested
- Auth flow untested

## Performance Concerns

### 26. N+1 Query Potential
**Various API routes**
**Issue:** Some queries may cause N+1 problems
- Need to review Prisma includes
- Use dataloader pattern where appropriate

### 27. No Response Caching
**Public endpoints**
**Issue:** Status pages, public data not cached
- Should use Redis caching
- CDN headers not set optimally

## Summary

- **Critical Issues:** 5 (GDPR compliance, security)
- **High Priority:** 5 (incomplete features)
- **Medium Priority:** 8 (code quality, config)
- **Testing Gaps:** 3 (0% coverage on major components)
- **Performance:** 2 (queries, caching)

**Next Steps:** Fix critical issues first, then high priority, then expand test coverage.



