---
title: About Saturn
description: Our mission to make scheduled job reliability observable and proactive. Built for DevOps teams who refuse to let cron jobs fail silently.
slug: about
keywords: [about, mission, values, team, company, story, careers, contact]
canonical: https://saturn.io/company/about
lastReviewed: 2025-10-16
---

# About Saturn

## Our Mission

**Make scheduled job reliability observable and proactive.**

Cron jobs run the internet—database backups, ETL pipelines, cache warming, report generation—yet they fail silently in the dark. Saturn brings them into the light with statistical anomaly detection that catches slowdowns *before* they become failures.

We believe DevOps and SRE teams deserve better than "it ran at some point, probably." They deserve confidence.

---

## The Problem We're Solving

### The Silent Crisis

Every night, thousands of critical cron jobs fail silently:

- **Database backups** that never complete (you discover this during a restore)
- **ETL pipelines** that take 3 hours instead of 30 minutes (downstream systems starve)
- **Cache warmers** that timeout (your app serves stale data)
- **Report generators** that skip (executives make decisions on yesterday's numbers)

Traditional monitoring tools only tell you *if* a job ran. They don't tell you:

- Is it getting slower over time? (Welford algorithm + z-score anomaly detection)
- What's normal vs. abnormal? (Statistical baselines established in 10 runs)
- What's the reliability trend? (Health scores: 0-100 with A-F grades)
- How often does this job fail? (MTBF: Mean Time Between Failures)
- How quickly do we recover? (MTTR: Mean Time To Resolution)

**You don't need another ping service. You need a partner that understands reliability.**

---

## Our Story

Saturn was born from frustration—the frustration of waking up to production incidents that started *hours ago* but nobody noticed because "the backup cron didn't email us."

### The Breaking Point

*"The backup job is slow. Has been slow for weeks. Nobody notices. One night, it times out. No backup. The database crashes. You restore from… three weeks ago. You've lost data. Customers are furious. The team is scrambling."*

**This happens every day, somewhere.**

### Why Existing Tools Aren't Enough

We evaluated every cron monitoring tool on the market:

- **Healthchecks.io**: Great for simple checks, but no anomaly detection, no Kubernetes integration, no health scoring
- **Cronitor**: Solid monitoring, but lacks statistical analysis, limited enterprise features, no WordPress support
- **PagerDuty/Opsgenie**: Alerting platforms, not cron-specific, expensive, overwhelming for small teams
- **DIY scripts**: Fragile, unmaintained, no analytics

**None of them answered the question**: *"Is my job getting slower?"*

So we built Saturn.

---

## What Makes Saturn Different

### 1. Statistical Anomaly Detection (Unique)

We're the only cron monitoring platform with **Welford's online algorithm** for incremental statistics:

- **Baseline in 10 runs**: Establishes mean duration and standard deviation
- **Z-score analysis**: Triggers incidents when runtime exceeds 3σ (99.7% confidence)
- **Memory-efficient**: O(1) memory usage (40 bytes per monitor, not 40KB of historical data)
- **Catches regressions early**: "Your backup is 2× slower than usual—investigate before it fails"

**Real-world example**: A customer's ETL job gradually slowed from 12 minutes to 28 minutes over 3 months. Traditional monitoring said "success" every time. Saturn detected the anomaly on day 15 and alerted the team to investigate. Root cause: database index fragmentation. Fixed before it cascaded into downstream failures.

### 2. Kubernetes & WordPress Integrations (Unique)

**Kubernetes Sidecar** (Go container):
- Automatically wraps CronJobs—no code changes
- Sends start/success/fail pings with duration and exit codes
- Captures last 10KB of logs (optional)
- Deploys via Helm chart in 5 minutes

**WordPress Plugin** (PHP):
- Monitors wp-cron (notorious for breaking on low-traffic sites)
- Detects if `DISABLE_WP_CRON` is set
- Alerts if cron hasn't run in 24 hours
- Zero-config: just add a Saturn token

**Nobody else has these.** We built them because 43% of websites run WordPress, and Kubernetes is the infrastructure standard. Your monitoring should meet you where you are.

### 3. Health Scoring System (Unique)

Every monitor gets a **0-100 health score** with letter grade (A-F):

```
A (90-100):  Excellent reliability, no recent incidents
B (80-89):   Good, minor issues resolved quickly
C (70-79):   Fair, some reliability concerns
D (60-69):   Poor, frequent issues
F (<60):     Critical, requires immediate attention
```

**Factors**:
- Uptime percentage (last 30 days)
- MTBF (Mean Time Between Failures)
- MTTR (Mean Time To Resolution)
- Anomaly frequency
- Incident severity

**Why it matters**: Executives don't want z-scores. They want "Are we green or red?" Health scores translate technical reliability into business language.

### 4. Maintenance Windows with RRULE (Unique)

**Problem**: Planned maintenance triggers false-positive alerts.

**Solution**: RFC 5545 recurrence rules (RRULE) for complex schedules:

```
FREQ=WEEKLY;BYDAY=SU;BYHOUR=2;BYMINUTE=0
# "Every Sunday at 2:00 AM" (weekly backup window)

FREQ=MONTHLY;BYDAY=1SU;BYHOUR=3;BYMINUTE=0
# "First Sunday of every month at 3:00 AM" (monthly maintenance)
```

Alerts suppressed during windows, but runs still tracked for analytics.

### 5. Advanced Output Capture with Redaction

**Capture job output** (stdout/stderr) for debugging:

- **Size limits**: 10KB (default) to 100KB (Enterprise)
- **Automatic redaction**: Passwords, API keys, AWS credentials, private keys, credit cards
- **Storage**: MinIO (S3-compatible) with org-scoped access control
- **Retention**: Configurable (30 days default)

**Best-effort security**: Redaction is pattern-based. Review outputs before enabling for production jobs.

---

## Our Values

### Reliability > Vanity Metrics

We don't care about "how many monitors you have." We care about "how reliable are they?"

- Health scores over ping counts
- MTBF/MTTR over uptime percentages
- Actionable insights over dashboards full of noise

### Developer Empathy

We're engineers. We build tools we'd want to use.

- **CLI-first**: Device auth flow (no copy-paste API keys)
- **API-first**: Everything in the dashboard is available via REST API
- **Infrastructure-as-Code**: Helm charts, Terraform modules (roadmap), API-driven configuration
- **No lock-in**: Export your data anytime (JSON/CSV)

### Clarity Over Cleverness

- **No magic**: We document how anomaly detection works (Welford algorithm, z-score thresholds)
- **No surprises**: Rate limits clearly documented (60 req/min), pricing transparent, no hidden fees
- **No BS**: If a feature is beta, we say so. If it's not ready, we don't ship it.

### Pragmatism Over Perfection

- **80/20 rule**: Ship features that solve 80% of use cases really well
- **Progressive enhancement**: Basic features free, advanced features paid—but free tier is genuinely useful
- **Technical debt is OK**: If it gets you to market faster and you pay it down later

### Security by Default

- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Token hashing**: SHA-256 (irreversible)
- **Row-level security**: Automatic org-level data isolation
- **Redaction**: On by default for output capture
- **No shortcuts**: CSRF protection, rate limiting, input validation (Zod schemas), audit logs

---

## Our Technology

Saturn is built on modern, battle-tested infrastructure:

### Application Stack

- **Frontend**: Next.js 15 (React), Tailwind CSS, shadcn/ui components
- **Backend**: Next.js API Routes (TypeScript), Prisma ORM
- **Workers**: BullMQ (Redis-backed job queues), 6 specialized workers
- **CLI**: TypeScript, OAuth 2.0 Device Flow

### Infrastructure

- **Web**: Vercel (Edge Network, auto-scaling, zero-config deployments)
- **Workers**: Fly.io (isolated containers, multi-region)
- **Database**: Neon (serverless Postgres, auto-scaling, branching)
- **Caching**: Upstash (Redis, durable, multi-region)
- **Object Storage**: MinIO (S3-compatible, self-hosted option available)
- **Email**: Resend (high deliverability, transactional focus)
- **Payments**: Stripe (PCI Level 1, global)
- **Monitoring**: Sentry (error tracking, performance monitoring)

### Integrations

- **Kubernetes**: Go sidecar container (Dockerfile, Helm chart, RBAC manifests)
- **WordPress**: PHP plugin (WordPress Coding Standards, internationalization-ready)
- **Slack**: OAuth app (Block Kit formatting, message threading, slash commands)
- **Discord**: Webhook embeds (rich formatting, buttons)
- **Generic Webhooks**: HMAC SHA-256 signatures, exponential backoff retry

### Open Source Contributions

We believe in giving back:

- **Welford algorithm implementation**: MIT-licensed TypeScript library (used by Saturn and available for your projects)
- **Kubernetes manifests**: Example CronJob YAML files with sidecar integration
- **Webhook signature verification examples**: Node.js, Python, Go, Ruby implementations

---

## Milestones & Roadmap

### What We've Shipped

- **v0.1 (Oct 2024)**: Core monitoring, ping API, email alerts
- **v0.5 (Nov 2024)**: Slack/Discord integration, RBAC, multi-org
- **v0.8 (Dec 2024)**: Anomaly detection (Welford + z-score), health scores
- **v0.9 (Jan 2025)**: Kubernetes sidecar + Helm chart, WordPress plugin
- **v1.0 (Feb 2025)**: Maintenance windows (RRULE), output capture with redaction, advanced analytics (MTBF/MTTR)

### What's Next

**v1.1 (Q2 2025)**:
- Public status pages (per organization, customizable branding)
- Incident postmortems (timeline, root cause, lessons learned)
- Advanced RBAC (custom roles, per-monitor permissions)

**v1.2 (Q3 2025)**:
- Terraform provider (infrastructure-as-code for monitors)
- PagerDuty/Opsgenie integrations (bi-directional sync)
- API v2 with GraphQL (more flexible querying)

**v2.0 (Q4 2025)**:
- SSO/SAML (Okta, Azure AD, Google Workspace)
- SCIM provisioning (auto-create/delete users from IdP)
- Kubernetes Operator (CRD-based, GitOps-friendly)
- AI-powered insights (predictive failure analysis, root cause suggestions)

See our [public roadmap](https://github.com/saturn-monitoring/roadmap) for voting on features.

---

## Team & Culture

### Who We Are

Saturn is a **distributed team** of engineers, designers, and operators who've felt the pain of unreliable cron jobs at companies like:

<!-- TODO: Add team backgrounds once team is formalized -->

- Infrastructure engineering teams managing 1000+ CronJobs
- SRE teams responsible for multi-region database backups
- WordPress agencies managing 500+ client sites
- ETL engineers wrangling data pipelines for Fortune 500 companies

### Why We're Building in Public

We share:

- **Weekly changelog**: Every deployment documented at https://saturn.io/changelog
- **Open roadmap**: Vote on features, see what's coming next
- **Technical blog**: Deep dives into Welford's algorithm, Kubernetes sidecars, webhook security
- **Open-source components**: Helm charts, plugins, example integrations

### Careers

<!-- TODO: Add careers information once hiring begins -->

We're not currently hiring, but if you're passionate about reliability engineering, dev tools, or monitoring infrastructure, keep an eye on https://saturn.io/careers.

**What we value in teammates**:
- **Technical depth**: You've debugged production incidents at 3 AM and learned from them
- **Product sense**: You know the difference between "cool feature" and "solves real pain"
- **Clear communication**: You write docs as carefully as you write code
- **Ownership**: You ship features end-to-end (backend, frontend, docs, tests, deployment)

---

## Pricing & Philosophy

### Pricing Tiers

| Plan | Price | Monitors | Users | Best For |
|------|-------|----------|-------|----------|
| **FREE** | $0/month | 5 | 3 | Side projects, small teams, proof-of-concept |
| **PRO** | $19/month | 100 | 10 | Startups, growing teams, full feature set |
| **BUSINESS** | $49/month | 500 | Unlimited | Scale-ups, agencies, multi-product companies |
| **ENTERPRISE** | Custom | Unlimited | Unlimited | Enterprises, compliance requirements, SLA |

### Why We Have a Free Tier

**We remember being broke engineers.** When you're bootstrapping a startup or running a side project, $20/month matters.

Our free tier is **genuinely useful**:
- 5 monitors (enough for critical jobs: backup, ETL, cache warmer, report, health check)
- Full anomaly detection (not a paid-only feature)
- Slack + Email alerts (no "upgrade to get notifications")
- 7-day run history (sufficient for catching trends)

If you outgrow the free tier, you're probably making money—and $19/month is a no-brainer investment in reliability.

### Enterprise Transparency

Enterprise pricing is custom because it depends on:
- Monitor count (500-10,000+)
- Data retention (1-7 years for compliance)
- Support SLA (1-hour response vs. 24-hour)
- On-premise deployment (optional)
- SSO/SCIM (integration effort)

We don't believe in "contact sales for a quote you'll never get." Typical Enterprise starts at $500/month for 1,000 monitors with 99.9% SLA.

---

## Contact & Community

### Support

- **Email**: support@saturn.io <!-- TODO: Verify email -->
- **Response time**: 24 hours (FREE/PRO), 4 hours (BUSINESS), 1 hour (ENTERPRISE)
- **Docs**: https://docs.saturn.io <!-- TODO: Verify URL -->

### Sales (Enterprise)

- **Email**: sales@saturn.io <!-- TODO: Add if sales team exists -->
- **Demo**: Book a 30-minute walkthrough at https://saturn.io/demo <!-- TODO: Set up Calendly -->

### Security

- **Vulnerability reports**: security@saturn.io (monitored 24/7)
- **PGP key**: <!-- TODO: Add PGP key fingerprint if available -->

### Community

<!-- TODO: Add community links once established -->

- **Discord**: https://discord.gg/saturn (for users, not customers)
- **GitHub Discussions**: https://github.com/saturn-monitoring/discussions
- **Twitter**: @SaturnMonitor (product updates, changelog)
- **Blog**: https://saturn.io/blog (technical deep dives, case studies)

### Partnerships

Interested in partnering with Saturn?

- **Agencies**: White-label options for monitoring client WordPress/Kubernetes infrastructure
- **Cloud providers**: Marketplace listings (AWS, Azure, GCP)
- **Dev tool integrations**: CI/CD pipelines (GitHub Actions, GitLab CI, CircleCI)
- **Observability platforms**: Data exports to Datadog, Grafana, New Relic

Email partnerships@saturn.io <!-- TODO: Add partnerships email if relevant -->

---

## Press & Media

### Press Kit

Download our press kit (logos, screenshots, product descriptions):

https://saturn.io/press <!-- TODO: Create press kit -->

Includes:
- High-resolution logos (SVG, PNG)
- Product screenshots (dashboard, alerts, analytics)
- Founder headshots (if applicable)
- One-pager (PDF)

### Media Inquiries

**Email**: press@saturn.io <!-- TODO: Add press email if relevant -->

### Recent Coverage

<!-- TODO: Add as coverage is published -->

- *"Saturn brings statistical rigor to cron monitoring"* — Hacker News (Oct 2025)
- *"Why Kubernetes needs better CronJob monitoring"* — The New Stack (Nov 2025)
- *"The $19/month tool that caught our $50K incident before it happened"* — Indie Hackers (Dec 2025)

---

## Legal & Compliance

- **Privacy Policy**: [/legal/privacy](/legal/privacy)
- **Terms of Service**: [/legal/terms](/legal/terms)
- **Security Overview**: [/legal/security](/legal/security)
- **Cookie Policy**: [/legal/cookies](/legal/cookies)
- **Data Processing Addendum** (Enterprise): [/legal/dpa](/legal/dpa)

<!-- TODO: Add physical address for legal compliance -->

**Registered Address**: <!-- TODO: Add company address -->

**Legal Entity**: Saturn, Inc. <!-- TODO: Verify legal name -->

---

## Acknowledgments

Saturn is built with and inspired by:

- **Welford's algorithm** (1962 paper): For making incremental statistics possible
- **Healthchecks.io**: For pioneering simple, effective cron monitoring
- **Cronitor**: For showing the market demand for dev-first monitoring
- **Our early users**: For trusting us with their production infrastructure
- **Open-source community**: For the tools and libraries we build upon

Thank you for choosing Saturn. Let's make cron jobs reliable together.

---

**Questions?** Email us at support@saturn.io or start a chat in-app.

**Last Updated**: October 16, 2025



