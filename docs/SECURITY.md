# Security Best Practices

Security features and guidelines for Saturn.

## Security Features

### Authentication
- NextAuth v5 with session management
- Magic link email authentication
- Google OAuth integration
- Secure session cookies (httpOnly, secure, sameSite)
- CSRF protection built-in

### API Security
- API key authentication (SHA-256 hashed)
- Rate limiting (60 requests/min per monitor)
- Token-based access for ping endpoint
- Row-level security (org isolation)

### Input Validation
- Zod schemas for all inputs
- SQL injection prevention (Prisma ORM)
- XSS prevention (React auto-escaping)
- Path traversal prevention
- Cron expression validation

### Data Protection
- Output redaction (passwords, tokens, keys)
- Secure headers (HSTS, CSP, X-Frame-Options)
- HTTPS enforcement in production
- Encrypted connections to database/Redis

### Secret Management
- Environment variables for secrets (never in code)
- Token hashing (never store plaintext)
- Webhook HMAC signatures
- Secure credential storage

## Production Security Checklist

### Environment Variables
```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -hex 32     # For JWT_SECRET

# Never commit these!
NEXTAUTH_SECRET=<generated>
JWT_SECRET=<generated>
DATABASE_URL=<secure connection string>
```

### Headers Configuration
Already configured in `next.config.ts`:
```typescript
headers: {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000'
}
```

### Database
- Use connection pooling (PgBouncer)
- Enable SSL/TLS connections
- Restrict access by IP (if possible)
- Regular backups with encryption
- Strong passwords (20+ characters)

### Redis
- Use TLS connections (rediss://)
- Require authentication
- Restrict network access
- Regular snapshots

### Storage (S3/R2)
- Use private buckets (no public access)
- Enable versioning
- Set up lifecycle rules
- Use pre-signed URLs for access

## Rate Limiting

### Ping API
- 60 requests/min per monitor
- Returns 429 Too Many Requests on limit
- Implemented in `apps/web/src/app/api/ping/[token]/route.ts`

### Web API
- Per-IP rate limiting
- Configurable limits per endpoint
- DDoS protection via Vercel

## Output Redaction

Automatically redacts sensitive patterns:
```typescript
// Redacted patterns
- password=*
- api_key=*
- token=*
- secret=*
- Authorization: Bearer ***
```

Configured in `apps/web/src/lib/redaction.ts`

## Audit Logging

All critical actions are logged:
- User logins/logouts
- Monitor create/update/delete
- Alert configuration changes
- Organization changes
- API key generation

View in `AuditLog` table.

## Incident Response

### Security Issue Detected?
1. **Isolate**: Disable affected features
2. **Investigate**: Check logs and audit trail
3. **Notify**: Alert affected users
4. **Fix**: Deploy patch immediately
5. **Review**: Post-mortem and prevention

### Reporting Security Issues
Email: security@saturn.io
- Use PGP for sensitive reports
- Include reproduction steps
- Expected response: 24-48 hours

## Compliance

### GDPR
- User data export available
- Right to deletion implemented
- Consent management
- Data retention policies

### SOC 2 Considerations
- Audit logging
- Access controls (RBAC)
- Encryption at rest and in transit
- Regular security reviews
- Incident response procedures

## Security Updates

### Dependencies
```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update

# Fix critical issues
npm audit fix
```

Run weekly in CI/CD pipeline.

### Monitoring
- Sentry for error tracking
- Uptime monitoring
- Log aggregation
- Security alerts

## Best Practices for Users

### API Keys
- Rotate regularly (every 90 days)
- Use separate keys per environment
- Never commit to git
- Store in environment variables
- Revoke unused keys

### Webhooks
- Use HMAC signature verification
- Validate payload structure
- Implement replay protection
- Use HTTPS endpoints only
- Rate limit incoming webhooks

### Monitoring
- Use least privilege principle
- Separate prod/staging monitors
- Review access regularly
- Enable 2FA for accounts
- Monitor audit logs

## Common Vulnerabilities Prevented

- ✅ SQL Injection (Prisma ORM)
- ✅ XSS (React escaping + CSP)
- ✅ CSRF (NextAuth built-in)
- ✅ Clickjacking (X-Frame-Options)
- ✅ MIME sniffing (X-Content-Type-Options)
- ✅ Path traversal (input validation)
- ✅ Command injection (no shell exec)
- ✅ Session fixation (secure sessions)
- ✅ Timing attacks (constant-time comparison)

## Resources

- OWASP Top 10: https://owasp.org/www-project-top-ten/
- NextAuth Security: https://next-auth.js.org/security/
- Prisma Security: https://www.prisma.io/docs/concepts/components/prisma-client/security
