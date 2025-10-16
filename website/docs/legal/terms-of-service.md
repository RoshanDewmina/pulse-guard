---
title: Terms of Service
description: Terms and conditions for using Saturn's cron monitoring platform. Clear, developer-friendly legal terms for engineering teams.
slug: terms
keywords: [terms of service, terms and conditions, user agreement, acceptable use, SLA, service level agreement]
canonical: https://saturn.io/legal/terms
lastReviewed: 2025-10-16
---

# Terms of Service

**Last Updated:** October 16, 2025

**Effective Date:** October 16, 2025

These Terms of Service ("Terms") govern your access to and use of Saturn's cron and scheduled job monitoring platform, including our web application, CLI tools, WordPress plugin, Kubernetes sidecar, APIs, and webhooks (the "Services"). By using the Services, you agree to these Terms.

**Agreement Parties**: These Terms constitute a binding contract between you (individual or entity) and Saturn, Inc. ("Saturn", "we", "us", or "our").

<!-- TODO: Update company legal name and governing law once finalized -->

## 1. Acceptance & Changes

### 1.1 Acceptance

By creating an account, accessing the Services, or using our APIs, you agree to:

- These Terms of Service
- Our [Privacy Policy](/legal/privacy)
- Our [Security practices](/legal/security)
- Any additional terms for specific features (e.g., Enterprise SLA)

If you are using the Services on behalf of an organization, you represent that you have authority to bind that organization to these Terms.

### 1.2 Eligibility

You must be at least 16 years old and capable of forming a binding contract under applicable law. If using on behalf of an organization, that entity must be validly formed and in good standing.

### 1.3 Changes to Terms

We may modify these Terms from time to time. We will notify you of material changes via:

- Email to your account address
- Prominent notice in the application
- Update to the "Last Updated" date above

Continued use after changes take effect constitutes acceptance. If you disagree with changes, stop using the Services and terminate your account.

## 2. Accounts & Organizations

### 2.1 Account Creation

To use the Services, you must create an account by providing:

- Valid email address
- Secure password (if not using OAuth)
- Organization name (automatically created on signup)

You are responsible for:

- Maintaining confidentiality of credentials
- All activity under your account
- Notifying us immediately of unauthorized access (security@saturn.io)

### 2.2 Organizations & Multi-Tenancy

Saturn uses an organization-based model:

- **Organization**: A workspace containing monitors, team members, and billing
- **Primary organization**: Created automatically on signup
- **Multiple organizations**: You may create or join multiple organizations
- **Organization isolation**: Data is strictly segregated between organizations (row-level security)

### 2.3 Roles & Permissions

Each organization has role-based access control (RBAC):

| Role | Permissions |
|------|-------------|
| **OWNER** | Full access: manage monitors, incidents, team, billing, delete organization |
| **ADMIN** | Manage monitors, incidents, alerts, team; cannot access billing or delete organization |
| **MEMBER** | Create/edit own monitors, view team monitors, acknowledge/resolve incidents; read-only for settings |

Organization Owners are responsible for managing team access and ensuring team members comply with these Terms.

## 3. License & Acceptable Use

### 3.1 License Grant

Subject to these Terms, Saturn grants you a limited, non-exclusive, non-transferable, revocable license to:

- Access and use the Services via our web application, CLI, and APIs
- Install our WordPress plugin and Kubernetes sidecar on systems you control
- Integrate the Services with your applications via webhooks and APIs

### 3.2 Restrictions

You may NOT:

- Reverse engineer, decompile, or disassemble the Services
- Modify, adapt, or create derivative works
- Remove or obscure proprietary notices
- Use the Services to violate any law or third-party rights
- Bypass rate limits or security measures
- Share accounts or API tokens with unauthorized parties
- Use the Services to monitor third-party systems without authorization
- Resell, sublicense, or transfer the Services without written permission

### 3.3 Rate Limits

To ensure fair usage and system stability:

- **Ping API**: 120 requests per minute per monitor token
- **General API**: 60 requests per minute per API key
- **Webhook retries**: Exponential backoff with maximum 3 retry attempts

Exceeding rate limits results in HTTP 429 responses. Persistent abuse may result in account suspension.

### 3.4 Fair Use

The Services are intended for monitoring scheduled jobs and cron tasks. Prohibited uses include:

- High-frequency polling (use intervals ≥30 seconds unless legitimately required)
- Stress testing or benchmarking without written permission
- Scraping or bulk downloading of data via automated means
- Monitoring unrelated systems solely to abuse free tier limits

## 4. Customer Data & Output Capture

### 4.1 Your Data Ownership

You retain all ownership rights to data you submit to the Services, including:

- Monitor configurations (names, schedules, metadata)
- Ping timestamps and runtime durations
- Job output (if you enable output capture)

We claim no intellectual property rights over your Customer Data.

### 4.2 License to Process

You grant Saturn a worldwide, non-exclusive license to:

- Store, process, and transmit your Customer Data to provide the Services
- Perform statistical analysis (anomaly detection, health scores, MTBF/MTTR)
- Generate aggregated, anonymized analytics for product improvement

This license terminates when you delete your data or close your account.

### 4.3 Output Capture Responsibility

If you enable **output capture** (optional):

- You are responsible for what data your jobs output
- Our automatic redaction is **best-effort** and may not catch all sensitive data
- Do NOT include PHI, PII, or highly sensitive data unless essential for debugging
- Review outputs before enabling capture for production jobs
- Configure appropriate retention periods for your compliance requirements

**Redaction Patterns**: We automatically redact passwords, API keys, bearer tokens, AWS credentials, private keys, and credit card numbers. However, novel patterns or context-specific secrets may not be caught.

### 4.4 Prohibited Data

You may NOT submit to the Services:

- Protected Health Information (PHI) under HIPAA without a signed Business Associate Agreement (BAA)
- Payment Card Industry (PCI) data (credit card details) beyond what our redaction may inadvertently capture
- Illegal, defamatory, or infringing content
- Malware, viruses, or malicious code

## 5. Integrations & Third-Party Services

### 5.1 Slack Integration

When you connect Slack via OAuth:

- You authorize Saturn to post messages to your selected channels
- We request minimal scopes: `chat:write`, `commands`, `channels:read`, `users:read`
- You can revoke access anytime via Slack's App Management
- Slack's own Terms of Service apply to your Slack workspace

### 5.2 Discord & Webhooks

For Discord and generic webhooks:

- **Discord**: You provide webhook URLs; we send JSON embeds to your Discord channels
- **Generic webhooks**: We POST JSON payloads to your HTTPS endpoints
- **HMAC signatures**: Webhooks include `X-Saturn-Signature` header (HMAC SHA-256) for verification
- **Retries**: Failed webhooks are retried up to 3 times with exponential backoff
- **Your responsibility**: Verify signatures, handle retries gracefully, secure your webhook endpoints

### 5.3 Kubernetes & WordPress

- **Kubernetes sidecar**: You deploy our open-source Go sidecar container; it sends pings to our API
- **WordPress plugin**: You install our open-source PHP plugin; it monitors wp-cron execution
- **License**: Both integrations are licensed under their respective open-source licenses (see repositories)
- **Support**: Community support for open-source integrations; priority support for paid plans

### 5.4 Third-Party Terms

Use of third-party platforms (Slack, Discord, Kubernetes, WordPress) is subject to their respective terms of service. Saturn is not responsible for third-party service availability or changes.

## 6. Payments, Plans & Billing

### 6.1 Pricing Plans

Saturn offers the following subscription tiers:

| Plan | Price | Monitors | Users | Features |
|------|-------|----------|-------|----------|
| **FREE** | $0/month | 5 | 3 | Email + Slack alerts, 7-day history |
| **PRO** | $19/month | 100 | 10 | All channels, anomaly detection, 90-day history, output capture |
| **BUSINESS** | $49/month | 500 | Unlimited | Priority support, 365-day history, advanced analytics |
| **ENTERPRISE** | Custom | Unlimited | Unlimited | SLA, SSO, DPA, custom retention, dedicated support |

Pricing is subject to change with 30 days' notice (existing subscriptions grandfathered for the current billing period).

### 6.2 Billing via Stripe

- **Payment processor**: All payments processed by Stripe
- **Payment methods**: Credit card, debit card (via Stripe)
- **Billing cycle**: Monthly or annual (20% discount for annual prepayment)
- **Currency**: USD (additional currencies may be supported)
- **Taxes**: You are responsible for applicable sales tax, VAT, GST, or similar taxes

### 6.3 Plan Limits & Enforcement

- **Monitor limit**: Cannot create monitors beyond your plan limit
- **User limit**: Cannot invite users beyond your plan limit
- **Soft enforcement**: At 90% of limit, we send warning emails
- **Existing resources**: Remain functional if you exceed limits; you cannot create new ones until you upgrade or reduce usage

### 6.4 Upgrades & Downgrades

- **Upgrades**: Effective immediately; prorated credit for unused time on old plan
- **Downgrades**: Effective at end of current billing period
- **Refunds**: <!-- TODO: Define refund policy (e.g., pro-rata refunds, no refunds for partial months) -->

### 6.5 Failed Payments & Suspension

- **Payment failure**: Account suspended after 7 days of failed payment attempts
- **During suspension**: Read-only access; monitors stop sending alerts
- **Data retention**: Data retained for 30 days after suspension; then permanently deleted
- **Reactivation**: Update payment method and contact support

### 6.6 Enterprise Plans

Enterprise customers receive:

- Custom pricing based on volume
- Service Level Agreement (SLA) <!-- TODO: Specify SLA percentage, e.g., 99.9% uptime -->
- Data Processing Addendum (DPA) for GDPR compliance
- Priority support with dedicated Slack/email channel
- Custom data retention policies
- Optional on-premise deployment

Contact sales@saturn.io for Enterprise inquiries.

## 7. Service Level & Availability

### 7.1 Service Availability

We strive for high availability but do not guarantee uninterrupted access. The Services are provided "as is" without uptime warranties for FREE and PRO plans.

**Business Plan**: Best-effort 99.9% uptime (excluding scheduled maintenance)

**Enterprise Plan**: <!-- TODO: Define Enterprise SLA, e.g., 99.9% or 99.99% with SLA credits -->

### 7.2 Scheduled Maintenance

We may perform scheduled maintenance with:

- At least 24 hours' notice for planned downtime
- Maintenance windows scheduled during low-traffic periods (typically weekends, late UTC hours)
- Status updates posted to <!-- TODO: status.saturn.io once status page is set up -->

Emergency maintenance may occur without advance notice.

### 7.3 Beta & Preview Features

Features labeled "Beta", "Preview", "Alpha", or "Experimental":

- Provided AS-IS without warranties
- May have bugs, limited functionality, or be discontinued
- Not covered by SLA
- Data may be deleted without notice when feature exits beta

## 8. Confidentiality & Intellectual Property

### 8.1 Confidential Information

Each party agrees to protect the other's Confidential Information, including:

- **Your Confidential Information**: Customer Data, business information, API tokens
- **Our Confidential Information**: Non-public product features, pricing, security measures

Confidential Information does not include information that is publicly available or independently developed.

### 8.2 Saturn Intellectual Property

Saturn and our licensors own all rights, title, and interest in:

- The Services (code, design, algorithms, documentation)
- Trademarks, logos, brand assets
- Statistical models (e.g., Welford anomaly detection implementation)

These Terms do not grant you any rights to our intellectual property except the limited license in Section 3.

### 8.3 Feedback License

If you provide feedback, suggestions, or feature requests:

- We may use them without obligation or compensation
- You grant us a perpetual, irrevocable, worldwide license to implement and commercialize such feedback

## 9. Warranties & Disclaimers

### 9.1 Your Warranties

You represent and warrant that:

- You have authority to enter into these Terms
- Your use of the Services complies with all applicable laws
- Your Customer Data does not infringe third-party rights
- You have obtained necessary consents to submit personal data to the Services

### 9.2 Disclaimer of Warranties

TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING:

- **Merchantability**: Fitness for a particular purpose
- **Non-infringement**: Freedom from third-party IP claims
- **Accuracy**: Anomaly detection, health scores, and analytics are probabilistic and may produce false positives/negatives
- **Reliability**: We do not guarantee error-free operation or data integrity
- **Security**: While we implement robust security, no system is impervious to attacks

**Anomaly Detection Disclaimer**: Our z-score anomaly detection requires a baseline of at least 10 runs to establish statistical patterns. Early runs may not trigger anomaly alerts. Anomaly thresholds may need tuning for your specific workloads.

## 10. Limitation of Liability

### 10.1 Liability Cap

TO THE MAXIMUM EXTENT PERMITTED BY LAW, SATURN'S TOTAL LIABILITY FOR ALL CLAIMS ARISING FROM OR RELATED TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE GREATER OF:

- **(A)** The amount you paid Saturn in the 12 months preceding the claim, OR
- **(B)** $100 USD

### 10.2 Excluded Damages

IN NO EVENT SHALL SATURN BE LIABLE FOR:

- Indirect, incidental, special, consequential, or punitive damages
- Loss of profits, revenue, data, or business opportunities
- Cost of substitute services
- Service interruptions or data loss

EVEN IF SATURN HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

### 10.3 Exceptions

These limitations do not apply to:

- Saturn's gross negligence or willful misconduct
- Death or personal injury caused by our negligence
- Liability that cannot be excluded by law (e.g., fraud)

## 11. Indemnification

You agree to indemnify, defend, and hold harmless Saturn, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys' fees) arising from:

- Your violation of these Terms
- Your Customer Data or its use by Saturn as authorized
- Your violation of any law or third-party rights
- Unauthorized access to your account due to your failure to secure credentials

We will notify you of any such claim and allow you to control the defense (at your expense), provided we may participate with our own counsel at our cost.

## 12. Data Portability & Termination

### 12.1 Data Export

You may export your data at any time via:

- **Dashboard**: Download monitor configurations, run history (CSV/JSON)
- **API**: Programmatically retrieve data using your API key
- **Support request**: Contact support@saturn.io for bulk exports

### 12.2 Termination by You

You may terminate your account at any time via:

- **Settings → Billing → Cancel Subscription** (for paid plans)
- **Settings → Organization → Delete Organization**
- **Email**: support@saturn.io

Upon termination:

- Billing stops immediately (or at end of current period for annual plans)
- Access is revoked within 24 hours
- Data is deleted within 90 days (unless we have a legal obligation to retain)

### 12.3 Termination by Us

We may suspend or terminate your account if:

- You violate these Terms
- Payment fails for more than 7 days
- You engage in abusive, fraudulent, or illegal activity
- Required by law or government order

We will provide notice and opportunity to cure (except for material violations like security breaches or fraud).

### 12.4 Effect of Termination

Upon termination:

- Your license to the Services immediately ends
- Outstanding fees become immediately due
- Sections 4.1 (Data Ownership), 8 (IP), 9 (Disclaimers), 10 (Liability), 11 (Indemnity), and 13 (Disputes) survive

## 13. Dispute Resolution

### 13.1 Governing Law

These Terms are governed by the laws of <!-- TODO: specify jurisdiction, e.g., Delaware, USA -->, without regard to conflict of law principles.

### 13.2 Venue

Any disputes shall be resolved in <!-- TODO: specify venue/court or arbitration forum -->.

### 13.3 Informal Resolution

Before filing a claim, contact legal@saturn.io to attempt informal resolution. We commit to good-faith negotiation for 30 days.

### 13.4 Class Action Waiver

You agree to resolve disputes on an individual basis. You waive any right to participate in class actions or class arbitrations.

## 14. Miscellaneous

### 14.1 Entire Agreement

These Terms, together with our Privacy Policy and any supplemental agreements (e.g., Enterprise DPA), constitute the entire agreement between you and Saturn.

### 14.2 Severability

If any provision is found unenforceable, the remaining provisions remain in full effect.

### 14.3 Waiver

Failure to enforce any right does not waive that right. Waivers must be in writing.

### 14.4 Assignment

You may not assign these Terms without our written consent. We may assign to affiliates or in connection with a merger/acquisition.

### 14.5 Force Majeure

Neither party is liable for delays due to events beyond reasonable control (natural disasters, war, pandemic, government actions, third-party service outages).

### 14.6 Export Control

You agree not to export, re-export, or transfer the Services in violation of U.S. export laws or sanctions.

### 14.7 Government Users

If you are a U.S. Government entity, the Services are "Commercial Items" as defined in FAR 2.101, provided with only those rights granted to non-government customers.

## 15. Contact & Legal Notices

For questions, concerns, or legal notices:

- **General support**: support@saturn.io <!-- TODO: Verify email -->
- **Legal inquiries**: legal@saturn.io <!-- TODO: Verify email -->
- **Security reports**: security@saturn.io
- **Sales (Enterprise)**: sales@saturn.io <!-- TODO: Add if sales team exists -->
- **Mailing address**: <!-- TODO: Add physical mailing address for legal compliance -->

Legal notices must be sent via email to legal@saturn.io or via certified mail to the address above.

---

**Last Updated**: October 16, 2025

**Related Documents**:
- [Privacy Policy](/legal/privacy)
- [Security Overview](/legal/security)
- [Cookie Policy](/legal/cookies)
- [Data Processing Addendum](/legal/dpa) (Enterprise)


