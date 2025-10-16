---
title: Privacy Policy
description: How Saturn collects, uses, and protects your data. Transparent notice of our data practices for DevOps and engineering teams.
slug: privacy
keywords: [privacy policy, data protection, GDPR, CCPA, data collection, security, encryption]
canonical: https://saturn.io/legal/privacy
lastReviewed: 2025-10-16
---

# Privacy Policy

**Last Updated:** October 16, 2025

Saturn, Inc. ("Saturn", "we", "us", or "our") provides cron and scheduled job monitoring services with statistical anomaly detection. This Privacy Policy explains how we collect, use, disclose, and protect information when you use our web application, CLI tools, WordPress plugin, Kubernetes sidecar, APIs, and webhooks (collectively, the "Services").

<!-- TODO: Update company legal name and address once finalized -->

## 1. Information We Collect

### 1.1 Account & Authentication Data

When you create an account or authenticate with Saturn, we collect:

- **Email address**: For account creation, magic link authentication, and service communications
- **Google OAuth profile**: If you sign in with Google, we collect your email, name, and profile picture (basic profile information only)
- **Password hash**: If you use password authentication, we store bcrypt-hashed passwords (we never store plaintext passwords)
- **Organization membership**: Your role (OWNER, ADMIN, or MEMBER) within each organization
- **Session data**: JWT tokens managed by NextAuth v5 for session management

**Technical Implementation**: Authentication is handled via NextAuth v5 with JWT session strategy. OAuth tokens are stored securely and used only for authentication purposes.

### 1.2 Billing & Payment Information

For paid subscriptions, we collect:

- **Stripe Customer ID**: A unique identifier linking your organization to your Stripe billing account
- **Subscription metadata**: Plan type (FREE, PRO, BUSINESS), billing cycle, monitor/user limits
- **Invoices**: Billing history and payment records (handled by Stripe)

**What we DON'T store**: Credit card numbers, CVV codes, or other payment card data. All payment information is securely processed and stored by Stripe, our PCI-compliant payment processor.

### 1.3 Monitoring Data

To provide our core monitoring services, we collect:

- **Monitor definitions**: Monitor names, descriptions, cron schedules/intervals, timezone settings, grace periods
- **Ping data**: Timestamps of start/success/fail/timeout events, request metadata (IP addresses for rate limiting)
- **Runtime metrics**: Job durations (milliseconds), exit codes, state transitions (OK → LATE → MISSED → FAILING)
- **Anomaly statistics**: Calculated using Welford's online algorithm
  - Running count of executions
  - Mean duration
  - Standard deviation (stddev)
  - Z-scores for anomaly detection (>3σ triggers incidents)
  - Min/max durations, percentiles (P50/P95/P99)
- **Incident records**: Incident type (MISSED, LATE, FAIL, ANOMALY), status (OPEN, ACKED, RESOLVED), timestamps, acknowledgment notes, resolution details, MTTR (Mean Time To Resolution) calculations
- **Health scores**: 0-100 scores with letter grades (A-F) based on reliability metrics
- **Uptime tracking**: Success rate, MTBF (Mean Time Between Failures), historical trends

**Data Minimization**: We use Welford's algorithm specifically to calculate statistics incrementally without storing every historical data point, minimizing storage footprint to ~40 bytes per monitor.

### 1.4 Output Capture (Optional)

If you enable output capture for a monitor:

- **Job output**: stdout/stderr from your jobs, up to 10KB by default (100KB max for Enterprise plans)
- **Storage location**: Outputs are stored in MinIO (S3-compatible object storage) with key pattern `outputs/{monitorId}/{timestamp}.txt`
- **Automatic redaction**: We apply security patterns to redact:
  - Passwords (e.g., `password=secret` → `password=***REDACTED***`)
  - API keys (e.g., `api_key: abc123` → `api_key: ***REDACTED***`)
  - Bearer tokens (JWT patterns)
  - AWS credentials (`AKIA*`, `AWS_SECRET_ACCESS_KEY`)
  - Private keys (`-----BEGIN PRIVATE KEY-----`)
  - Credit card numbers (last 4 digits preserved)
  - Database connection strings with credentials
- **Access control**: Output is scoped to your organization (org-level row-level security)

**IMPORTANT**: While we make best efforts to redact sensitive data, redaction is pattern-based and may not catch all sensitive information. You are responsible for reviewing what data your jobs output. Do not include PHI (Protected Health Information) or highly sensitive data in outputs unless required for debugging.

### 1.5 Integration Data

When you connect third-party integrations:

**Slack**:
- OAuth access tokens (encrypted at rest)
- Workspace ID and name
- Selected channel IDs and names
- OAuth scopes: `chat:write`, `commands`, `channels:read`, `users:read`

**Discord**:
- Webhook URLs (encrypted at rest)
- Server name and channel name

**Generic Webhooks**:
- Webhook endpoint URLs
- HMAC SHA-256 signing secrets (for signature verification)
- Retry configuration

**WordPress Plugin**:
- Site URL
- Plugin version
- wp-cron event names being monitored

**Kubernetes Sidecar**:
- CronJob name and namespace
- Pod name and container name
- Kubernetes cluster identification (from environment variables)
- **Note**: We do NOT collect source code, container images, or cluster credentials

### 1.6 Product Telemetry & Diagnostics

To improve service reliability and performance:

- **Error tracking**: Error messages, stack traces, and diagnostic data sent to Sentry
- **Structured logs**: Application logs stored via Winston logger (IP addresses, timestamps, request paths, user IDs)
- **Audit logs**: Administrative actions (user invitations, role changes, monitor deletions, subscription changes)

### 1.7 Cookies & Local Storage

- **Session cookies**: `next-auth.session-token` (JWT session identifier, httpOnly, secure, SameSite=Lax)
- **CSRF tokens**: `__Host-next-auth.csrf-token` (protection against cross-site request forgery)
- **Optional analytics cookies**: <!-- TODO: Specify if PostHog, Google Analytics, or none -->

See our [Cookie Policy](/legal/cookies) for full details.

## 2. How We Use Your Data

We use collected information to:

- **Provide the Services**: Monitor your scheduled jobs, detect anomalies, send alerts, store run history
- **Enforce security**: Rate limiting (60 requests/minute per monitor), RBAC enforcement, row-level security by organization
- **Anomaly detection**: Calculate z-scores, trigger incidents when jobs run slower than baseline
- **Analytics & insights**: Generate health scores, MTBF/MTTR metrics, uptime percentages, duration trends
- **Alerting**: Send notifications via email, Slack, Discord, and webhooks when incidents occur
- **Billing**: Process subscriptions, enforce plan limits, generate invoices (via Stripe)
- **Customer support**: Troubleshoot issues, respond to inquiries, provide technical assistance
- **Product improvement**: Analyze usage patterns (aggregated), fix bugs, develop new features
- **Legal compliance**: Respond to legal requests, enforce Terms of Service, prevent fraud and abuse

## 3. Legal Bases for Processing (GDPR)

For users in the European Economic Area (EEA), UK, and Switzerland:

- **Contract performance** (GDPR Art. 6(1)(b)): Processing necessary to provide the Services you've subscribed to
- **Legitimate interests** (GDPR Art. 6(1)(f)): Security monitoring, fraud prevention, product improvements, direct marketing (with easy opt-out)
- **Consent** (GDPR Art. 6(1)(a)): Optional analytics cookies, marketing communications (where consent is required by law)
- **Legal obligation** (GDPR Art. 6(1)(c)): Tax compliance, responding to lawful government requests

## 4. Data Sharing & Disclosure

### 4.1 Service Providers (Sub-Processors)

We share data with trusted third-party processors who help us provide the Services:

- **Vercel** (USA): Web application hosting and serverless functions
- **Fly.io** (USA): Background worker hosting and job processing
- **Neon** (USA): PostgreSQL database hosting
- **Upstash** (USA): Redis caching and queue management
- **MinIO / S3-compatible storage**: Object storage for output capture <!-- TODO: Specify actual provider and region -->
- **Sentry** (USA): Error tracking and performance monitoring
- **Resend** (USA): Transactional email delivery
- **Stripe** (USA/Ireland): Payment processing and subscription management

These processors are contractually bound to protect your data and use it only for the specified purposes. See our [Data Processing Addendum](/legal/dpa) for Enterprise customers.

### 4.2 User-Directed Sharing

When you configure integrations, we share data as you direct:

- **Slack**: We send alert messages to your specified Slack channels using your OAuth tokens
- **Discord**: We send webhook notifications to your configured Discord channels
- **Custom webhooks**: We POST incident data to your specified HTTPS endpoints with HMAC SHA-256 signatures

### 4.3 Legal Requirements

We may disclose information if required by law, including to:

- Comply with valid legal process (subpoenas, court orders, warrants)
- Protect rights, property, or safety of Saturn, our users, or the public
- Detect, prevent, or address fraud, security, or technical issues
- Enforce our Terms of Service

We will notify you of legal requests unless prohibited by law or court order.

### 4.4 Business Transfers

If Saturn is involved in a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. We will notify you via email and/or prominent notice on our website before your data is transferred and becomes subject to a different privacy policy.

## 5. International Data Transfers

Saturn operates globally. Your data may be transferred to and processed in countries outside your country of residence, including the United States.

<!-- TODO: Specify exact data residency regions once infrastructure is finalized -->

For EEA/UK users, we rely on:

- **Standard Contractual Clauses (SCCs)**: EU Commission-approved data transfer agreements with our sub-processors
- **Adequacy decisions**: Where the European Commission has determined a country provides adequate protection
- **Your explicit consent**: Where applicable for specific transfers

## 6. Data Security

We implement industry-standard security measures:

### Technical Safeguards

- **Encryption in transit**: TLS 1.2+ for all HTTPS connections
- **Token hashing**: API tokens and secrets hashed using SHA-256 (we cannot reverse-engineer stored tokens)
- **Row-level security**: Database queries automatically filtered by organization ID
- **Rate limiting**: 60 requests/minute per monitor, 120 requests/minute for ping endpoints
- **Secure headers**: HSTS, Content Security Policy (CSP), X-Frame-Options, X-Content-Type-Options
- **Input validation**: Zod schemas validate all API inputs to prevent injection attacks
- **CSRF protection**: Built-in NextAuth v5 CSRF tokens
- **XSS prevention**: React automatic escaping, sanitization of user-generated content

### Organizational Safeguards

- **Access controls**: Role-based access control (RBAC) with OWNER/ADMIN/MEMBER roles
- **Audit logging**: All administrative actions logged with timestamps and user IDs
- **Incident response**: Documented procedures for security incidents and data breaches
- **Vendor management**: Regular review of sub-processor security practices

**No security is perfect**: While we implement robust protections, no method of transmission or storage is 100% secure. Use strong passwords, enable two-factor authentication (when available), and follow security best practices.

## 7. Data Retention

We retain data for different periods based on type and purpose:

- **Active monitors & ping data**: Retained while your account is active and for operational purposes
- **Run history**: 7 days (FREE), 90 days (PRO), 365 days (BUSINESS), custom (Enterprise)
- **Output capture**: Configurable per monitor (default retention: 30 days; adjustable per organization policy)
- **Deleted monitors**: Associated data deleted within 30 days
- **Closed accounts**: Account data deleted within 90 days unless we have a legal obligation to retain it
- **Billing records**: Stripe retains invoices for 7 years to comply with tax laws
- **Logs & diagnostics**: <!-- TODO: Specify log retention period (typically 30-90 days) -->
- **Backups**: Database backups retained for 30 days, then permanently deleted

You can request deletion of your data at any time by contacting support@saturn.io.

## 8. Your Privacy Rights

### 8.1 Rights for All Users

- **Access**: Request a copy of the personal data we hold about you
- **Correction**: Update inaccurate or incomplete information via your account settings or by contacting support
- **Deletion**: Request deletion of your account and associated data
- **Portability**: Receive your monitor configurations, run history, and analytics in machine-readable format (JSON/CSV)
- **Opt-out of marketing**: Unsubscribe from promotional emails (we'll still send transactional emails required for the service)

### 8.2 GDPR Rights (EEA/UK Users)

In addition to the above, you have the right to:

- **Restriction**: Request that we limit processing of your personal data
- **Object**: Object to processing based on legitimate interests
- **Withdraw consent**: Where processing is based on consent, withdraw it at any time
- **Lodge a complaint**: File a complaint with your local supervisory authority

**Data Protection Officer**: <!-- TODO: Add DPO contact if required: dpo@saturn.io -->

### 8.3 CCPA/CPRA Rights (California Residents)

California residents have additional rights:

- **Know**: What personal information we collect, use, disclose, and sell
- **Delete**: Request deletion of personal information
- **Opt-out**: Opt out of "sale" or "sharing" of personal information
  - **Note**: We do NOT sell or share personal information for cross-context behavioral advertising
- **Non-discrimination**: Exercise your rights without discriminatory treatment

To exercise CCPA rights, email legal@saturn.io with subject line "CCPA Request".

## 9. Children's Privacy

Saturn is not intended for users under 16 years of age. We do not knowingly collect personal information from children under 16. If you believe we have inadvertently collected information from a child under 16, contact us immediately at legal@saturn.io, and we will delete it promptly.

## 10. Changes to This Policy

We may update this Privacy Policy from time to time. We will notify you of material changes by:

- Posting the new policy on this page with an updated "Last Updated" date
- Sending an email to the address associated with your account
- Displaying a prominent notice in the application

Your continued use of the Services after changes become effective constitutes acceptance of the updated policy.

## 11. Contact Us

Questions, concerns, or requests regarding this Privacy Policy:

- **Email**: support@saturn.io <!-- TODO: Verify contact email -->
- **Legal inquiries**: legal@saturn.io <!-- TODO: Verify legal email -->
- **Security issues**: security@saturn.io
- **Mailing address**: <!-- TODO: Add physical address for legal compliance -->

For GDPR-related inquiries (EEA/UK users), contact: <!-- TODO: Add DPO email if required -->

---

**Related Documents**:
- [Terms of Service](/legal/terms)
- [Security Overview](/legal/security)
- [Cookie Policy](/legal/cookies)
- [Data Processing Addendum](/legal/dpa) (Enterprise)


