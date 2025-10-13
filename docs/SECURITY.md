# Security Best Practices - Tokiflow

## Overview

Tokiflow implements defense-in-depth security with multiple layers of protection. This document outlines security features, best practices, and compliance considerations.

## Security Features

### 1. Input Validation & Sanitization

**Implementation**: `apps/web/src/lib/security/validation.ts`

All user input is validated using Zod schemas:
- Email addresses (RFC 5322)
- URLs (RFC 3986)
- Slugs (alphanumeric + hyphens)
- Cron expressions
- Domain names
- IP addresses
- API keys
- File names (prevent directory traversal)

**XSS Prevention**:
```typescript
// Remove HTML tags, javascript: protocol, event handlers
sanitizeInput(userInput);
```

**SQL Injection Prevention**:
- Prisma ORM with parameterized queries (primary defense)
- Pattern detection for defense-in-depth
- Never concatenate user input into raw SQL

**Command Injection Prevention**:
- Pattern detection for shell metacharacters
- No user input passed to `exec()` or `spawn()`

### 2. Secret Encryption

**Implementation**: `apps/web/src/lib/security/encryption.ts`

**Algorithm**: AES-256-GCM (authenticated encryption)

**Encrypted at Rest**:
- API keys (Slack, PagerDuty, etc.)
- Webhook URLs with auth tokens
- Integration credentials
- OAuth tokens
- Custom domain verification tokens

**Key Management**:
```bash
# Generate encryption key (run once)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Store in environment
ENCRYPTION_KEY=<generated_key>
```

**Usage**:
```typescript
import { encryptSecret, decryptSecret } from '@/lib/security/encryption';

// Encrypt before storing
const encrypted = encryptSecret(apiKey);
await prisma.alertChannel.create({
  data: {
    type: 'SLACK',
    configJson: { accessToken: encrypted },
  },
});

// Decrypt when using
const decrypted = decryptSecret(config.accessToken);
```

**Best Practices**:
- ✅ Rotate encryption key annually
- ✅ Use different keys for dev/staging/prod
- ✅ Never commit keys to Git
- ✅ Use secret management service (AWS Secrets Manager, Vault)
- ✅ Mask secrets in logs: `maskSecret(apiKey)` → `tk_a...xyz`

### 3. Rate Limiting

**Implementation**: `apps/web/src/lib/security/rate-limiting.ts`

**Multi-Tier Limits**:
| Endpoint | Window | Max Requests | Block Duration |
|----------|--------|--------------|----------------|
| API (default) | 1 min | 60 | None |
| Auth | 15 min | 5 | 15 min |
| Ping | 1 min | 120 | None |
| Status Pages | 1 min | 30 | None |
| Webhooks | 1 min | 100 | None |
| Email | 1 hour | 100 | None |

**Algorithm**: Sliding window with Redis

**Usage**:
```typescript
const result = await checkRateLimit(clientIP, RateLimitTiers.API_DEFAULT);

if (!result.allowed) {
  return NextResponse.json(
    { error: 'Rate limit exceeded', retryAfter: result.retryAfter },
    { status: 429, headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': '0',
      'Retry-After': result.retryAfter.toString(),
    }}
  );
}
```

**IP Detection Order**:
1. `CF-Connecting-IP` (Cloudflare)
2. `X-Forwarded-For` (first IP)
3. `X-Real-IP`
4. Fallback to 'unknown'

### 4. Security Headers

**Implementation**: `apps/web/src/middleware.ts`

Applied to all responses:
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Content-Security-Policy: (see below)
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

**Content Security Policy (CSP)**:
```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self';
frame-ancestors 'none';
```

Note: `unsafe-inline` and `unsafe-eval` are required for Next.js and Tailwind.

### 5. Authentication & Authorization

**NextAuth.js** with session-based auth:
- Secure HTTP-only cookies
- CSRF protection built-in
- Session expiry (30 days default)
- Secure password hashing (bcrypt)

**Role-Based Access Control (RBAC)**:
- `OWNER`: Full access
- `ADMIN`: Manage monitors, integrations, users
- `MEMBER`: View and manage monitors
- `VIEWER`: Read-only access

**API Key Scopes**:
```typescript
const scopes = ['monitors:read', 'monitors:write', 'incidents:read'];
```

### 6. Database Security

**Prisma ORM**:
- Parameterized queries (prevents SQL injection)
- Type-safe database access
- Connection pooling
- Read replicas support

**Best Practices**:
- ✅ Use connection pooling (max 10 connections)
- ✅ Enable SSL/TLS for database connections
- ✅ Least-privilege database user
- ✅ Regular backups (daily)
- ✅ Point-in-time recovery enabled

**Environment Variables**:
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"
```

### 7. Secrets Management

**Environment Variables**:
- Never commit `.env` to Git
- Use `.env.local` for local development
- Use secret management service in production

**Required Secrets**:
```bash
# Encryption
ENCRYPTION_KEY=<32-byte-hex>

# Database
DATABASE_URL=<postgres-url>

# Auth
NEXTAUTH_SECRET=<random-string>
NEXTAUTH_URL=<app-url>

# Redis
REDIS_URL=<redis-url>

# Email (optional)
SMTP_HOST=<smtp-server>
SMTP_USER=<user>
SMTP_PASS=<encrypted-password>

# S3 (optional)
S3_ACCESS_KEY=<key>
S3_SECRET_KEY=<encrypted-secret>
```

### 8. Audit Logging

**Implementation**: `AuditLog` model in Prisma

**Logged Events**:
- User login/logout
- Monitor create/update/delete
- Integration add/remove
- API key generation
- RBAC changes
- Incident acknowledge/resolve

**Log Format**:
```typescript
{
  userId: "cm0xyz",
  orgId: "cm0abc",
  action: "monitor.create",
  resource: "Monitor:cm0def",
  metadata: { name: "DB Backup" },
  ipAddress: "1.2.3.4",
  userAgent: "Mozilla/5.0...",
  timestamp: "2025-10-13T12:00:00Z"
}
```

**Retention**: 90 days (configurable)

### 9. Dependency Security

**Automated Scanning**:
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check for outdated packages
npm outdated
```

**Dependabot**: Enabled on GitHub for automated security updates

**Supply Chain Security**:
- ✅ Use package lock files
- ✅ Verify package signatures
- ✅ Pin dependency versions
- ✅ Review changelogs before upgrading

### 10. HTTPS/TLS

**Requirements**:
- ✅ Force HTTPS in production
- ✅ TLS 1.2 or higher
- ✅ Strong cipher suites only
- ✅ HSTS header (max-age=31536000)

**Cloudflare Setup** (recommended):
- Full (strict) SSL/TLS mode
- Automatic HTTPS rewrites
- Opportunistic encryption
- TLS 1.3 enabled

## Compliance

### GDPR

**Data Minimization**:
- Only collect necessary data
- User can delete account (cascade deletes all data)
- Export data on request (API: `GET /api/users/me/export`)

**Consent**:
- Clear privacy policy
- Cookie consent banner
- Email opt-in for notifications

**Data Retention**:
- Runs: 90 days (configurable)
- Incidents: 1 year
- Audit logs: 90 days
- User data: Until account deletion

### SOC 2

**Access Controls**:
- RBAC enforced
- Audit logging enabled
- MFA support (via NextAuth providers)

**Encryption**:
- At rest: AES-256-GCM
- In transit: TLS 1.2+
- Secrets encrypted in database

**Monitoring**:
- Sentry for error tracking
- Cloudflare for DDoS protection
- Uptime monitoring (self-hosted)

## Incident Response

### Security Incident Procedure

1. **Detection**: Sentry alerts, audit log anomalies, user reports
2. **Containment**: Revoke compromised keys, block IPs, disable accounts
3. **Investigation**: Review audit logs, check database access logs
4. **Remediation**: Patch vulnerabilities, rotate secrets, update dependencies
5. **Recovery**: Restore from backups if needed
6. **Post-Mortem**: Document incident, update procedures

### Contact

**Security Issues**: security@tokiflow.com  
**Response Time**: < 24 hours for critical issues

## Security Checklist

### Deployment

- [ ] `ENCRYPTION_KEY` set and not default value
- [ ] `NEXTAUTH_SECRET` is random and secure
- [ ] Database uses SSL (`sslmode=require`)
- [ ] Redis uses TLS
- [ ] HTTPS enforced (no HTTP)
- [ ] HSTS header enabled
- [ ] CSP headers configured
- [ ] Rate limiting enabled
- [ ] Sentry configured for error tracking
- [ ] Audit logging enabled
- [ ] Backups configured (daily)
- [ ] Monitoring alerts configured

### Code Review

- [ ] No secrets in code or Git history
- [ ] Input validation on all endpoints
- [ ] Output encoding for XSS prevention
- [ ] Parameterized database queries
- [ ] Rate limiting on public endpoints
- [ ] Authentication required for sensitive operations
- [ ] Authorization checks (RBAC)
- [ ] Audit logging for sensitive actions
- [ ] Error messages don't leak sensitive info

### Testing

- [ ] Unit tests for validation functions
- [ ] Integration tests for auth flows
- [ ] Penetration testing (annual)
- [ ] Dependency security scan (weekly)
- [ ] OWASP Top 10 review (quarterly)

## Reporting Security Issues

We take security seriously. If you discover a security vulnerability, please:

1. **DO NOT** open a public GitHub issue
2. Email security@tokiflow.com with details
3. Allow up to 48 hours for initial response
4. We'll work with you to understand and address the issue
5. We may offer a bug bounty for responsible disclosure

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Next.js Security Best Practices](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security Guide](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

Last Updated: 2025-10-13  
Version: 1.0

