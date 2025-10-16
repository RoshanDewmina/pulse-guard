---
title: Security Overview
description: Saturn's security architecture, data protection measures, and compliance roadmap for enterprise DevOps teams.
slug: security
keywords: [security, data protection, encryption, compliance, SOC 2, penetration testing, vulnerability disclosure]
canonical: https://saturn.io/legal/security
lastReviewed: 2025-10-16
---

# Security Overview

Saturn is built with security-first architecture for DevOps and engineering teams monitoring business-critical scheduled jobs. This document outlines our technical security measures, infrastructure design, and compliance posture.

**Last Updated:** October 16, 2025

## 1. Infrastructure & Architecture

### 1.1 Multi-Layer Architecture

Saturn runs on a distributed, defense-in-depth architecture:

```
┌─────────────────────────────────────────────────────────┐
│  Web Application (Next.js 15)                           │
│  • Vercel Edge Network (Global CDN)                     │
│  • TLS 1.3, HTTPS-only                                  │
│  • Secure headers (HSTS, CSP, X-Frame-Options)          │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  Background Workers (BullMQ)                            │
│  • Fly.io isolated containers                           │
│  • Redis-backed job queues (Upstash)                    │
│  • Alert processing, webhook delivery                   │
└────────────────┬────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────┐
│  Data Layer                                             │
│  • PostgreSQL (Neon): Row-level security by org         │
│  • Redis (Upstash): Rate limiting, session cache        │
│  • MinIO/S3: Object storage for output capture          │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Infrastructure Providers

| Component | Provider | Region | Security Certifications |
|-----------|----------|--------|------------------------|
| Web hosting | Vercel | Global (Edge) | SOC 2 Type II, ISO 27001 |
| Workers | Fly.io | <!-- TODO: Specify regions --> | SOC 2 Type II |
| Database | Neon (Postgres) | <!-- TODO: Specify regions --> | SOC 2 Type II, GDPR-compliant |
| Caching | Upstash (Redis) | <!-- TODO: Specify regions --> | SOC 2 Type II |
| Object storage | MinIO (S3-compatible) | <!-- TODO: Specify provider/regions --> | Encryption at rest |
| Error tracking | Sentry | USA | SOC 2 Type II, ISO 27001 |
| Email | Resend | USA | SOC 2 Type II |
| Payments | Stripe | USA/Ireland | PCI DSS Level 1 |

All providers are contractually bound to industry-standard security practices.

### 1.3 Network Isolation

- **No direct database access**: Application layer enforces all queries
- **Private VPC**: Database and Redis accessible only via authenticated connections
- **Firewall rules**: IP allowlisting for administrative access
- **TLS-only connections**: All inter-service communication encrypted

## 2. Data Protection

### 2.1 Encryption

**In Transit**:
- TLS 1.2+ (TLS 1.3 preferred) for all HTTPS endpoints
- Certificate pinning for critical connections
- HSTS (HTTP Strict Transport Security) with `max-age=31536000` (1 year)

**At Rest**:
- Database encryption via PostgreSQL AES-256 (provider-managed keys)
- Object storage (MinIO) uses server-side encryption
- API tokens and secrets hashed with SHA-256 before storage
- OAuth tokens encrypted with AES-256-GCM

**Key Management**:
- Environment-based secrets (never in code or version control)
- <!-- TODO: Specify if using AWS KMS, HashiCorp Vault, or provider-managed keys -->

### 2.2 Row-Level Security (RLS)

Every database query is automatically scoped to the user's organization:

```sql
-- Automatic filter applied to all queries
WHERE orgId = current_user_org_id()
```

**Enforcement**:
- Prisma ORM middleware injects org filter
- Database-level RLS policies as secondary defense
- Audit logs record all data access

**Benefits**:
- Prevents accidental cross-org data leaks
- Simplifies multi-tenancy security model
- Compliant with GDPR data segregation requirements

### 2.3 Token Security

**API Tokens**:
- Generated using `crypto.randomBytes(32)` (256-bit entropy)
- Stored as SHA-256 hashes (irreversible)
- Prefixed for identification: `st_` (monitor tokens), `sk_` (API keys)
- Rate limited: 60 requests/minute per token

**Session Tokens**:
- JWT-based sessions via NextAuth v5
- httpOnly, secure, SameSite=Lax cookies
- Short-lived (7 days default, refresh via silent refresh)

**Token Rotation**:
- Users can regenerate tokens anytime via dashboard
- Old tokens invalidated immediately upon regeneration
- Zero-downtime rotation supported (create new, update services, delete old)

## 3. Output Capture & Redaction

Output capture (optional feature) poses unique security challenges. We address these with:

### 3.1 Automatic Redaction

**Redaction Patterns** (applied in real-time during upload):

| Pattern | Example Match | Redacted Output |
|---------|---------------|-----------------|
| Passwords | `password=secret123` | `password=***REDACTED***` |
| API Keys | `api_key: abc123xyz` | `api_key: ***REDACTED***` |
| Bearer Tokens | `Authorization: Bearer eyJ...` | `Authorization: Bearer ***REDACTED***` |
| AWS Access Keys | `AKIA1234567890ABCDEF` | `AKIA***************` |
| AWS Secret Keys | `AWS_SECRET_ACCESS_KEY=...` | `AWS_SECRET_ACCESS_KEY=***` |
| Private Keys | `-----BEGIN PRIVATE KEY-----` | `***REDACTED***` |
| SSH Keys | `ssh-rsa AAAAB3NzaC1...` | `***REDACTED***` |
| Credit Cards | `4532-1234-5678-9010` | `****-****-****-9010` |
| Database URLs | `postgres://user:pass@host:5432/db` | `postgres://***:***@host:5432/db` |

**Implementation**: Regular expression-based matching in `apps/web/src/lib/s3.ts::redactOutput()`.

### 3.2 Redaction Limitations

**Best-Effort Approach**: Redaction is pattern-based and may not catch:

- Novel secret formats (e.g., custom API token structures)
- Context-specific sensitive data (e.g., proprietary algorithm parameters)
- Obfuscated secrets (base64-encoded, hex-encoded)
- Secrets split across multiple lines

**User Responsibility**: Review what your jobs output before enabling capture. Do NOT include:

- PHI (Protected Health Information) under HIPAA
- PCI data (credit card PANs, CVVs)
- Highly sensitive credentials unless absolutely necessary for debugging

### 3.3 Output Storage Security

- **Access control**: Outputs accessible only to users in the owning organization (RBAC enforced)
- **Size limits**: 10KB default, 100KB max (Enterprise) to prevent storage abuse
- **Retention**: Configurable per monitor (default 30 days, then auto-deleted)
- **Encryption**: At rest via provider-managed keys

### 3.4 Disabling Output Capture

Output capture is **off by default**. Enable per monitor:

```bash
# Via API
PATCH /api/monitors/{id}
{
  "captureOutput": true,
  "captureLimitKb": 10
}
```

Disable anytime via dashboard or API to stop collecting new outputs (existing outputs retained per retention policy).

## 4. Application Security (AppSec)

### 4.1 Input Validation & Sanitization

**All inputs validated using Zod schemas**:

```typescript
// Example: Ping request validation
const pingSchema = z.object({
  state: z.enum(['start', 'success', 'fail', 'timeout']),
  durationMs: z.number().int().min(0).max(86400000).optional(),
  exitCode: z.number().int().min(-1).max(255).optional(),
});
```

**Protection Against**:
- SQL injection (Prisma ORM with parameterized queries)
- NoSQL injection (input type validation)
- XSS (React automatic escaping, DOMPurify for user HTML)
- Path traversal (strict path validation, no user-controlled file paths)
- CRLF injection (header sanitization)

### 4.2 CSRF Protection

- NextAuth v5 built-in CSRF tokens
- `__Host-next-auth.csrf-token` cookie (SameSite=Lax)
- Double-submit cookie pattern for API requests
- Valid for single request, regenerated per-session

### 4.3 Rate Limiting

**Multi-tier rate limiting** (Redis-backed sliding window):

| Endpoint | Limit | Window | Enforcement |
|----------|-------|--------|-------------|
| Ping API | 120 req/min | Per monitor token | HTTP 429 after limit |
| General API | 60 req/min | Per API key | HTTP 429 + temporary block |
| Auth endpoints | 5 attempts | 15 minutes | 15-minute block after 5 failures |
| Webhooks (outbound) | 100 req/min | Per integration | Exponential backoff |

**Headers Returned**:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1697345678
```

**DDoS Protection**: Vercel Edge Network provides automatic DDoS mitigation.

### 4.4 Secure Headers

All responses include security headers:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; ...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

Configured in `apps/web/next.config.ts`.

### 4.5 Dependency Security

- **Automated scanning**: Dependabot alerts for known vulnerabilities
- **Regular updates**: Security patches applied within 48 hours of disclosure
- **Minimal dependencies**: Audit all third-party packages before inclusion
- **Lockfiles**: `bun.lock` ensures reproducible builds

## 5. Webhook Security

### 5.1 HMAC Signature Verification

**Every webhook includes** `X-Saturn-Signature` header:

```
X-Saturn-Signature: sha256=a7f3b9e2c1d0...
```

**Algorithm**: HMAC SHA-256

**Verification** (Node.js example):

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expected = `sha256=${hmac.digest('hex')}`;
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

**Best Practices**:
- Always verify signatures before processing webhooks
- Use constant-time comparison (prevents timing attacks)
- Store webhook secrets securely (environment variables, not in code)

### 5.2 Webhook Delivery Security

- **TLS-only**: Webhooks sent only to `https://` endpoints
- **Retry logic**: Exponential backoff (1s, 2s, 4s) with max 3 attempts
- **Timeout**: 10-second timeout per request
- **No sensitive data in URLs**: Payloads in POST body, not query parameters

## 6. Authentication & Authorization

### 6.1 Authentication Methods

Supported authentication flows:

| Method | Use Case | Security Features |
|--------|----------|-------------------|
| **Email + Password** | Web UI | bcrypt hashing (cost factor 10), rate-limited login attempts |
| **Magic Links** | Passwordless web login | One-time token, 15-minute expiry, single-use |
| **Google OAuth** | Social login | OAuth 2.0, minimal scopes (email, profile) |
| **API Keys** | Programmatic access | SHA-256 hashed, scoped to organization, revocable |
| **Device Flow** | CLI authentication | OAuth 2.0 Device Authorization Grant, 10-minute code expiry |

### 6.2 Session Management

- **JWT sessions** (NextAuth v5) with 7-day default expiry
- **Silent refresh**: Auto-refresh before expiry (seamless UX)
- **Logout**: Immediate session invalidation, cookie removal
- **Concurrent sessions**: Allowed (common for DevOps workflows)

### 6.3 Role-Based Access Control (RBAC)

Organization-level roles enforced at:

1. **API layer**: Middleware checks user role before processing requests
2. **Database layer**: RLS policies restrict query results
3. **UI layer**: Conditional rendering hides unauthorized actions

**Audit trail**: All role changes logged with timestamp and actor.

## 7. Monitoring & Incident Response

### 7.1 Security Monitoring

- **Error tracking**: Sentry captures exceptions, stack traces, user context
- **Audit logs**: All sensitive actions logged (user invitations, role changes, monitor deletions, billing changes)
- **Rate limit alerts**: Automated alerts for suspicious rate limit violations
- **Failed auth monitoring**: Automated blocking after 5 failed login attempts in 15 minutes

### 7.2 Logging & Retention

**Logs captured**:
- Authentication events (success/failure, IP address, user agent)
- API requests (endpoint, user ID, org ID, timestamp, response status)
- Administrative actions (audit log)
- Error events (via Sentry)

**Retention**: <!-- TODO: Specify log retention period (typically 30-90 days for compliance) -->

**PII in logs**: Logs never contain passwords, full API keys, or payment card data.

### 7.3 Incident Response

**Process**:
1. **Detection**: Automated alerts, user reports, security scans
2. **Triage**: Security team evaluates severity within 1 hour
3. **Containment**: Isolate affected systems, revoke compromised credentials
4. **Notification**: Affected users notified within 72 hours (GDPR requirement)
5. **Remediation**: Patch vulnerabilities, deploy fixes
6. **Post-mortem**: Document incident, update procedures

**Security Contacts**: security@saturn.io (monitored 24/7)

## 8. Vulnerability Disclosure

### 8.1 Responsible Disclosure

We welcome security researchers to report vulnerabilities:

**How to Report**:
1. Email **security@saturn.io** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Your contact information

2. **Do NOT**:
   - Publicly disclose before we've patched
   - Access user data beyond what's necessary to demonstrate the issue
   - Perform denial-of-service attacks

**Response Timeline**:
- **Initial response**: Within 24 hours
- **Triage & assessment**: Within 72 hours
- **Fix deployment**: Critical vulnerabilities patched within 7 days
- **Public disclosure**: Coordinated disclosure 30 days after fix (or sooner if already public)

### 8.2 Bug Bounty Program

<!-- TODO: Define bug bounty program once ready (e.g., HackerOne, Bugcrowd, or self-hosted) -->

Currently, we do not offer monetary rewards but will:
- Acknowledge researchers in our security hall of fame
- Provide detailed feedback on reports
- Issue CVEs for significant vulnerabilities

### 8.3 Security.txt

Per RFC 9116, our security metadata is available at:

```
https://saturn.io/.well-known/security.txt
```

<!-- TODO: Create security.txt file with contact, encryption (PGP key), acknowledgments, policy link -->

## 9. Compliance & Certifications

### 9.1 Current Compliance

**GDPR (General Data Protection Regulation)**:
- ✅ Data Processing Addendum (DPA) available for Enterprise
- ✅ Standard Contractual Clauses (SCCs) for international transfers
- ✅ Data subject rights (access, deletion, portability)
- ✅ Privacy by design (encryption, RLS, minimal data collection)

**CCPA (California Consumer Privacy Act)**:
- ✅ Data disclosure transparency
- ✅ Opt-out mechanisms (we don't sell data)
- ✅ Non-discrimination for rights exercise

### 9.2 Compliance Roadmap

**Planned Certifications** (Timeline TBD):

- **SOC 2 Type I**: <!-- TODO: Target date for SOC 2 Type I audit -->
- **SOC 2 Type II**: <!-- TODO: Target date for SOC 2 Type II (requires 6-12 months of Type I) -->
- **ISO 27001**: Under evaluation for Enterprise customers
- **HIPAA Business Associate Agreement (BAA)**: Available upon request for Enterprise plans with dedicated infrastructure

### 9.3 Penetration Testing

- **Frequency**: <!-- TODO: Define pen test frequency, e.g., annually or bi-annually -->
- **Scope**: Web application, API endpoints, infrastructure configuration
- **Third-party auditors**: <!-- TODO: Name auditing firm once contracted -->
- **Remediation**: All high/critical findings addressed within 30 days

## 10. Data Residency & Sovereignty

### 10.1 Data Locations

<!-- TODO: Specify exact data residency once infrastructure regions are finalized -->

**Expected Regions**:
- **Primary**: USA (Vercel, Fly.io, Neon, Upstash)
- **Potential EU region**: For GDPR customers requiring EU-only data residency (Enterprise)

**Customer Control**:
- Enterprise customers may request specific regions
- Data residency commitments documented in DPA

### 10.2 Cross-Border Transfers

For EEA/UK customers, we rely on:
- **Standard Contractual Clauses (SCCs)**: EU Commission-approved data transfer agreements
- **Adequacy decisions**: For providers in countries deemed adequate by the EU
- **Explicit consent**: Where required by law

## 11. Third-Party Security

### 11.1 Vendor Risk Management

All sub-processors evaluated for:
- SOC 2 Type II or equivalent certification
- GDPR/CCPA compliance
- Data breach notification commitments
- Business continuity plans

**Sub-processor list**: See [Privacy Policy](/legal/privacy#service-providers)

### 11.2 Open-Source Dependencies

- **Dependency scanning**: Automated vulnerability scanning via Dependabot
- **License compliance**: All dependencies vetted for compatible licenses (MIT, Apache 2.0)
- **Supply chain security**: Lockfiles prevent dependency confusion attacks

## 12. Employee & Contractor Access

### 12.1 Access Controls

- **Least privilege**: Employees granted minimum necessary access
- **Role-based access**: Separate roles for developers, support, security, finance
- **MFA required**: Multi-factor authentication mandatory for all employee accounts
- **Access reviews**: Quarterly reviews of employee permissions

### 12.2 Background Checks

<!-- TODO: Define employee background check policy -->

### 12.3 Security Training

- **Onboarding**: Security training within first week of employment
- **Annual refreshers**: Phishing simulations, incident response drills
- **Topics**: OWASP Top 10, secure coding, data privacy, incident response

## 13. Business Continuity & Disaster Recovery

### 13.1 Backups

- **Database**: Automated daily snapshots (retained 30 days), point-in-time recovery
- **Object storage**: Versioning enabled, 30-day soft delete
- **Configuration**: Infrastructure-as-code (IaC) in version control

### 13.2 Recovery Objectives

- **RTO (Recovery Time Objective)**: <!-- TODO: Define RTO, e.g., 4 hours for database restore -->
- **RPO (Recovery Point Objective)**: 24 hours maximum data loss (daily backups)

### 13.3 Disaster Recovery Testing

- **Frequency**: <!-- TODO: Define DR test frequency, e.g., quarterly -->
- **Scope**: Database restore, service failover, incident communication

## 14. Changes to This Document

We may update this Security Overview to reflect infrastructure changes or new security measures. Material changes will be announced via:

- Email to account administrators
- Changelog at https://saturn.io/changelog
- Updated "Last Updated" date at the top of this page

## 15. Contact & Questions

**Security Inquiries**: security@saturn.io

**Vulnerability Reports**: security@saturn.io (PGP key: <!-- TODO: Add PGP key fingerprint if available -->)

**Compliance Questions**: legal@saturn.io

**DPA Requests** (Enterprise): sales@saturn.io

---

**Last Updated**: October 16, 2025

**Related Documents**:
- [Privacy Policy](/legal/privacy)
- [Terms of Service](/legal/terms)
- [Data Processing Addendum](/legal/dpa) (Enterprise)
- [Cookie Policy](/legal/cookies)


