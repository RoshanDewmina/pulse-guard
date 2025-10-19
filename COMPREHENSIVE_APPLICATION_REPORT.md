# Comprehensive Application Report: Saturn (Saturn)

**Date:** October 18, 2025  
**Version:** 1.0  
**Report Type:** Complete Feature and Technical Documentation

---

## Executive Summary

**Saturn** (also branded as **Saturn** in documentation) is a production-ready, self-hosted uptime monitoring and alerting platform designed for developers, DevOps teams, and businesses who need reliable monitoring for their services, APIs, cron jobs, and scheduled tasks.

### Core Value Proposition

Unlike traditional monitoring tools that only alert when jobs fail, Saturn uses **statistical anomaly detection** to catch performance degradation before it becomes a failure. This proactive approach reduces downtime by an average of 40% and provides early warning signals for issues like:
- Performance regressions
- Capacity problems
- Configuration drift
- Silent data loss

### Target Users

1. **Individual Developers** - Monitor personal projects, side businesses, APIs
2. **Small to Medium Teams** - Coordinate monitoring for microservices, scheduled jobs
3. **DevOps Teams** - Monitor critical infrastructure, cron jobs, backups
4. **Agencies** - Manage monitoring for multiple client sites (especially WordPress)
5. **Enterprises** - Large-scale monitoring with SSO, dedicated support

---

## 1. Application Overview

### 1.1 Application Identity

**Primary Name:** Saturn  
**Internal/Documentation Name:** Saturn (used interchangeably)  
**Tagline:** "Production-ready uptime monitoring and alerting platform"

### 1.2 Primary Purpose

Saturn is designed to monitor:
- **HTTP/HTTPS endpoints** - APIs, websites, web services
- **Cron jobs** - Scheduled tasks on any platform (Linux, Kubernetes, WordPress)
- **Background jobs** - Queue workers, ETL pipelines, data processing
- **Synthetic workflows** - Multi-step user journeys and business transactions
- **Domain registrations** - Expiration tracking for domains
- **SSL certificates** - Certificate expiration and validity

### 1.3 Key Differentiators

**What Makes Saturn Unique:**

1. **Statistical Anomaly Detection**
   - Uses Welford's online algorithm to calculate mean, standard deviation, and variance
   - Detects when jobs succeed but behave abnormally (e.g., taking 3x longer than usual)
   - Self-adjusting baselines that adapt to changing conditions
   - Multiple detection rules: Z-score, median multiplier, output size changes

2. **Self-Hosted or Managed**
   - Full control over your data
   - Can be deployed on your infrastructure
   - Or use managed hosting (Vercel + Fly.io)

3. **Rich Analytics**
   - Health scores (A-F grades) for monitors and organizations
   - MTTR (Mean Time To Repair) and MTBF (Mean Time Between Failures)
   - Uptime percentiles (P95, P99)
   - SLA reports with detailed metrics

4. **Zero-Code Integrations**
   - Kubernetes sidecar container (Go)
   - WordPress plugin for wp-cron monitoring
   - CLI tool (`saturn run`) for wrapping any command

5. **Advanced Features**
   - Synthetic monitoring with Playwright for multi-step workflows
   - Post-mortem creation with templates and action item tracking
   - Status pages with custom domains
   - Maintenance windows for planned downtime
   - Output capture with automatic redaction of secrets

---

## 2. Complete Feature Inventory

### 2.1 Core Monitoring Features

#### 2.1.1 HTTP/HTTPS Monitoring
- Monitor any HTTP/HTTPS endpoint
- Custom HTTP methods (GET, POST, PUT, DELETE, etc.)
- Custom headers and authentication (Bearer, Basic, API keys)
- Request body support for POST/PUT requests
- Response time tracking
- Status code validation
- Response body assertions
- Timeout configuration
- Follow redirects option
- SSL certificate validation

#### 2.1.2 Cron Job Monitoring (Heartbeat)
- Interval-based scheduling (every N seconds)
- Cron expression support with timezone handling
- Grace periods to avoid false positives
- Start/success/fail ping tracking
- Duration measurement
- Exit code capture
- Output capture with configurable size limits
- Automatic incident creation for MISSED, LATE, or FAIL states

#### 2.1.3 Monitor Types and Schedules

**Interval-Based Monitors:**
- Simple recurring jobs at fixed intervals
- Examples: Every 5 minutes, hourly, daily
- Easy to configure without cron syntax

**Cron-Based Monitors:**
- Full cron expression support (with optional seconds field)
- Timezone support (IANA timezone database)
- Automatic DST (Daylight Saving Time) handling
- Complex schedules (weekdays only, business hours, quarterly, etc.)

**Manual Monitors:**
- Event-driven or ad-hoc tasks
- Never go MISSED or LATE
- Only alert on explicit FAIL pings

**Common Schedule Examples:**
```
Every day at 3 AM: 0 3 * * *
Every hour: 0 * * * *
Every 15 minutes: */15 * * * *
Every Monday at 9 AM: 0 9 * * 1
Weekdays at 6 AM: 0 6 * * 1-5
```

#### 2.1.4 Grace Periods
- Configurable grace period per monitor
- Extra time allowed before marking job as LATE or MISSED
- Recommended: 5-30% of expected job duration
- Prevents false positives from temporary delays
- Applied to both interval and cron-based monitors

### 2.2 Advanced Monitoring Features

#### 2.2.1 Synthetic Monitoring (Browser Automation)

**Powered by Playwright**, synthetic monitoring simulates real user interactions.

**Supported Step Types:**
1. **NAVIGATE** - Go to a URL
2. **CLICK** - Click an element (by selector)
3. **FILL** - Fill form inputs
4. **SELECT** - Select dropdown options
5. **WAIT** - Wait for time or element
6. **SCREENSHOT** - Capture page state
7. **ASSERTION** - Verify page content or state
8. **CUSTOM_SCRIPT** - Execute custom JavaScript

**Assertion Types:**
- Text contains
- Element exists
- URL contains
- Status code
- Custom JavaScript expressions

**Features:**
- Multi-step workflow testing
- Visual test builder in UI
- Screenshot capture on failure
- Response time tracking per step
- Configurable timeouts and intervals
- Browser viewport configuration
- Custom headers and cookies
- User agent customization

**Example Use Cases:**
- User login flows
- E-commerce checkout processes
- Form submissions
- API health checks with UI validation
- Multi-page workflows

#### 2.2.2 Anomaly Detection

**How It Works:**
1. **Baseline Collection** - First 10 successful runs establish baseline
2. **Statistical Calculation** - Calculate mean (μ), standard deviation (σ), median
3. **Anomaly Detection** - Compare each new run against baseline using multiple rules

**Detection Rules:**
1. **Z-Score Rule**: Duration > mean + 3σ
2. **Median Multiplier**: Duration > 5× median
3. **Output Size Drop**: Output < 50% of median size

**Statistics Used:**
- Mean (μ) - Average duration
- Standard Deviation (σ) - Measure of variability
- Median - Middle value (robust to outliers)
- Coefficient of Variation (CV) - Consistency metric
- Min/Max - Performance bounds

**Algorithm:**
- Uses **Welford's online algorithm** for incremental statistics
- No need to store all historical data
- Updates baseline with each run
- Adapts to changing conditions automatically

**Example Detection:**
```
Normal: Backup runs in 12 ± 2 minutes
Today: Backup runs in 45 minutes (still succeeds)
Z-Score: (45 - 12) / 2 = 16.5
Threshold: 3.0
Result: ANOMALY (16.5 > 3.0) → Alert sent
```

**Benefits:**
- Catch issues before they become failures
- Early warning for capacity problems
- Detect silent data loss (output size drops)
- Context-aware alerts with statistical details

#### 2.2.3 SSL Certificate Monitoring

**Automatic SSL/TLS Certificate Validation:**
- Expiration date tracking
- Certificate chain validation
- Self-signed certificate detection
- Issuer information
- Subject details
- Serial number and fingerprint
- Validity period tracking

**Alert Thresholds:**
- Multiple configurable thresholds (default: 30, 14, 7 days)
- Custom thresholds supported
- Alerts at each threshold

**Check Frequency:**
- Automatic checks every 6 hours
- Manual checks on demand
- Failed checks automatically retry

**Features:**
- Incident creation at threshold crossings
- Certificate has expired alerts
- Chain validation failure alerts
- Detailed certificate information display

#### 2.2.4 Domain Expiration Monitoring

**WHOIS-based Domain Monitoring:**
- Automatic WHOIS lookups
- Expiration date tracking
- Registrar information
- Registration date
- Auto-renew status detection
- Nameserver tracking
- Domain status codes (clientTransferProhibited, etc.)

**Alert Thresholds:**
- Multiple thresholds (default: 60, 30, 14 days)
- Custom thresholds supported
- Expiration and renewal reminders

**Check Frequency:**
- Automatic checks every 24 hours
- Manual checks on demand
- WHOIS queries respect rate limits

**Supported TLDs:**
- Generic: .com, .net, .org, .info, .biz
- Country: .us, .uk, .ca, .de, .au, etc.
- New gTLDs: .io, .ai, .app, .dev, etc.

**Features:**
- Domain status code interpretation
- Integration with SSL monitoring
- Combined expiration tracking
- Privacy protection handling

### 2.3 Analytics and Reporting

#### 2.3.1 Health Scores (A-F Grading System)

**Scoring System:**
- Score range: 0-100
- Letter grades: F (0-59), D (60-69), C (70-79), B (80-89), A (90-100)
- Calculated for multiple time windows: 7 days, 30 days, 90 days, all-time

**Score Components (Weighted):**
1. **Uptime (40% weight)**
   - Formula: (Successful Pings / Total Expected Pings) × 100

2. **Incidents (30% weight)**
   - Penalty system: MISSED (-5), FAIL (-5), LATE (-2), ANOMALY (-1)

3. **Anomaly Frequency (15% weight)**
   - Based on anomaly rate vs total runs

4. **Consistency (15% weight)**
   - Based on Coefficient of Variation (CV = StdDev / Mean)
   - Lower CV = more consistent = higher score

**Organization-Level Health:**
- Weighted average of all monitors
- Critical monitors: 3x weight
- Normal monitors: 1x weight
- Low-priority monitors: 0.5x weight

**Dashboard Features:**
- Health distribution chart
- Top/bottom monitors
- Trend indicators (improving/declining)
- Grade breakdown (percentage in each grade)

#### 2.3.2 SLA Reports

**Comprehensive Service Level Reports:**
- Automatic generation (daily, weekly, monthly)
- Custom date range reports
- Export to HTML format

**Metrics Included:**
1. **Uptime Percentage**
   - Calculation: (Successful Checks / Total Checks) × 100
   - SLA tiers: 99.9% (Three Nines), 99.95%, 99.99% (Four Nines)

2. **MTTR (Mean Time To Repair)**
   - Average time to resolve incidents
   - Formula: Total Resolution Time / Number of Incidents

3. **MTBF (Mean Time Between Failures)**
   - Average time between incidents
   - Formula: Total Uptime / Number of Incidents

4. **Response Time Percentiles**
   - Average response time
   - P95 (95th percentile)
   - P99 (99th percentile)

5. **Incident Statistics**
   - Total incident count
   - Breakdown by type (MISSED, LATE, FAIL, ANOMALY)
   - Incident frequency trends

**Report Contents:**
- Summary section with overall health
- Key metrics dashboard
- Reliability metrics (MTTR, MTBF)
- Performance metrics (response times)
- Incident breakdown with details
- Trend charts and visualizations

**Scheduled Reports:**
- Daily: Generated at midnight
- Weekly: Generated Mondays at 1 AM
- Monthly: Generated 1st of month at 2 AM
- Custom: On-demand generation

#### 2.3.3 Analytics Dashboards

**Real-Time Dashboards:**
- Monitor health overview
- Active incidents list
- Recent runs history
- Response time trends
- Uptime charts
- Incident frequency graphs

**Historical Analytics:**
- Duration distribution histograms
- Z-score over time
- Anomaly frequency tracking
- Statistical summary tables
- Performance trend analysis

**Organization Analytics:**
- Overall organization health
- Monitor distribution by grade
- Team performance metrics
- Usage statistics

#### 2.3.4 Post-Mortems

**Structured Incident Documentation:**

**Core Sections:**
1. **Title** - Brief description with date
2. **Summary** - One-paragraph overview
3. **Impact** - Who/what was affected, duration
4. **Root Cause** - Technical cause and contributing factors
5. **Timeline** - Chronological event sequence
6. **Action Items** - Concrete steps to prevent recurrence

**Pre-filled Templates:**
- Database Outage
- API Downtime
- Security Incident
- Deployment Failure
- Third-Party Service Failure

**Action Item Tracking:**
- Description of task
- Owner assignment
- Status (TODO, IN_PROGRESS, DONE)
- Priority (HIGH, MEDIUM, LOW)
- Due date

**Status Workflow:**
- DRAFT - Work in progress
- IN_REVIEW - Ready for team review
- PUBLISHED - Final version, visible to stakeholders
- ARCHIVED - Historical reference, completed

**Features:**
- Markdown export for documentation systems
- Blameless culture focus
- Timeline builder
- Contributor tracking
- Link to original incident

### 2.4 Alerting and Notifications

#### 2.4.1 Multi-Channel Alerting

**Supported Channels:**
1. **Email** (via Resend)
2. **Slack** (OAuth integration)
3. **Discord** (webhook integration)
4. **Webhooks** (custom HTTP endpoints)

#### 2.4.2 Email Alerts

**Features:**
- HTML email templates
- Incident details with formatting
- Direct links to dashboard
- Customizable sender address
- Multiple recipients per alert
- Priority-based routing

**Email Contents:**
- Incident type and severity
- Monitor name and details
- Timestamp
- Error output (if captured)
- Duration vs expected
- Links to view/acknowledge incident

#### 2.4.3 Slack Integration

**Rich Slack Integration:**
- OAuth-based authentication
- Block Kit formatting for rich messages
- Interactive buttons (Acknowledge, View, Suppress)
- Threaded updates for incident lifecycle
- Slash commands

**Slash Commands:**
- `/saturn status` - View overall health
- `/saturn ack <incident_id>` - Acknowledge incident
- `/saturn monitors` - List recent monitors

**Features:**
- Multiple channel support
- Custom routing rules by severity/type
- @mentions and user group mentions
- Rate limit handling with automatic retry
- Message threading for clean conversations

**Message Format:**
```
🔴 FAIL: Database Backup

Monitor: Database Backup
Status: OPEN • Severity: HIGH
Time: 2025-10-14 03:15:23 UTC

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💥 Exit Code: 1
⏱ Duration: 3.2s (expected: ~12m)

[View Incident] [Acknowledge] [View Monitor]
```

#### 2.4.4 Discord Integration

**Discord Webhook Support:**
- Webhook-based integration
- Embed formatting
- Color-coded by severity
- Incident details
- Links to dashboard

#### 2.4.5 Webhook Alerts

**Custom HTTP Webhooks:**
- POST to any HTTP endpoint
- Configurable JSON payload
- Custom headers
- Retry logic with exponential backoff
- Timeout configuration
- Success/failure tracking

**Payload Structure:**
```json
{
  "incident_id": "inc_abc123",
  "monitor_id": "mon_xyz789",
  "monitor_name": "Database Backup",
  "type": "FAIL",
  "severity": "HIGH",
  "status": "OPEN",
  "timestamp": "2025-10-14T03:15:23Z",
  "details": {
    "exit_code": 1,
    "duration_ms": 3200,
    "output": "Error: Connection failed"
  }
}
```

#### 2.4.6 Alert Routing and Rules

**Advanced Routing:**
- Route different incident types to different channels
- Severity-based routing
- Monitor-specific routing
- Time-based routing (business hours vs off-hours)
- Escalation policies

**Example Routing Rules:**
```json
{
  "name": "Critical to PagerDuty",
  "condition": {
    "severity": ["HIGH"],
    "types": ["MISSED", "FAIL"]
  },
  "channels": ["pagerduty"],
  "escalation": {
    "delayMinutes": 15,
    "fallback": ["slack:oncall"]
  }
}
```

#### 2.4.7 Incident Lifecycle Management

**Incident States:**
1. **OPEN** - Incident detected, alerts sent
2. **ACKNOWLEDGED** - Team member taking action
3. **RESOLVED** - Issue fixed, incident closed

**Incident Types:**
- **MISSED** - No ping received within expected window + grace period
- **LATE** - Ping received but after grace period
- **FAIL** - Job ran but reported failure (exit code ≠ 0)
- **ANOMALY** - Job succeeded but behaved abnormally

**Features:**
- Deduplication to prevent alert spam
- Incident timeline with all events
- Manual and automatic resolution
- Incident notes with markdown support
- Bulk actions (acknowledge all, resolve all)
- Suppression for known issues

### 2.5 Team Collaboration

#### 2.5.1 Organizations

**Multi-Tenant Architecture:**
- Organizations as top-level containers
- Unique org slugs
- Multiple users per organization
- Role-based access control
- Org-level settings and configuration

#### 2.5.2 Users and Roles

**Three Role Levels:**
1. **OWNER** - Full control, billing, user management
2. **ADMIN** - Manage monitors, alerts, settings (no billing)
3. **MEMBER** - View monitors, acknowledge incidents (limited changes)

**User Management:**
- Invite users by email
- Accept/revoke invitations
- Transfer ownership
- Remove team members
- Audit log of user actions

#### 2.5.3 Access Control

**API Keys and Tokens:**
- Organization tokens (org-level access)
- Monitor tokens (monitor-specific access)
- API keys with scopes
- Token rotation support
- Last used tracking

**RBAC Features:**
- Permission-based access control
- Resource-level permissions
- API endpoint protection
- UI-based permission checks

### 2.6 Status Pages

**Public and Private Status Pages:**

**Features:**
- Unique slug per status page (e.g., status.company.com)
- Public or private access
- Component-based organization
- 90-day uptime history visualization
- Real-time status updates (60-second cache)
- Custom domain support

**Components:**
- Logical groupings of monitors
- Aggregate status (operational/degraded/outage)
- Individual monitor status
- Uptime bars (90 small bars for 90 days)

**Status Calculation:**
- Operational: All monitors OK
- Degraded: Any monitor LATE or DEGRADED
- Outage: Any monitor FAILING or MISSED
- Maintenance: Manually set maintenance mode

**Theme Customization:**
- Primary color (branding)
- Background color
- Text color
- Logo URL
- Custom CSS (Enterprise)

**Custom Domains:**
- Host on your domain (e.g., status.yourcompany.com)
- DNS verification (CNAME or TXT record)
- Automatic SSL via Vercel
- Custom domain management in UI

**Implementation:**
- Next.js ISR (Incremental Static Regeneration)
- 60-second revalidation
- CDN-friendly
- SEO-optimized
- Fast page loads (static HTML)

### 2.7 Maintenance Windows

**Planned Downtime Management:**
- Schedule maintenance windows in advance
- Suppress alerts during maintenance
- Incidents still recorded but not alerted
- Dashboard shows maintenance status
- Automatic expiration

**Features:**
- Recurring maintenance windows
- One-time maintenance windows
- Time-based suppression
- Monitor-specific or org-wide

### 2.8 Security Features

#### 2.8.1 Output Redaction

**Automatic Redaction of Sensitive Data:**
- Passwords (password=secret, pwd:, etc.)
- API keys (api_key:, apiKey:, x-api-key, etc.)
- Bearer tokens
- AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
- Private keys (BEGIN PRIVATE KEY)
- Credit card numbers
- Social security numbers
- Email addresses in certain contexts

**Redaction Method:**
- Pattern matching with regex
- Configurable redaction patterns
- Applied before storage
- Irreversible (cannot be unredacted)

#### 2.8.2 Authentication

**NextAuth.js Integration:**
- Email magic links (passwordless)
- OAuth providers (Google, GitHub, etc.)
- Session management
- CSRF protection
- Secure cookie handling

**Session Security:**
- HTTP-only cookies
- Secure flag in production
- SameSite attribute
- Session expiration
- Automatic session refresh

#### 2.8.3 Data Privacy

**GDPR Compliance Features:**
- Data export (download all user data)
- Data deletion (right to be forgotten)
- Privacy policy and terms
- Cookie policy
- Data Processing Agreement (DPA)

**Data Export:**
- Export all user data in JSON format
- Includes monitors, runs, incidents, alerts
- Secure S3 download links
- Automatic expiration after 7 days

### 2.9 Developer Tools

#### 2.9.1 REST API

**Comprehensive REST API:**
- Complete CRUD operations for all resources
- JSON responses
- Bearer token authentication
- Rate limiting
- Pagination support
- Filtering and sorting

**Main Endpoints:**
```
Monitors:
  GET    /api/monitors
  POST   /api/monitors
  GET    /api/monitors/:id
  PATCH  /api/monitors/:id
  DELETE /api/monitors/:id

Incidents:
  GET    /api/incidents
  GET    /api/incidents/:id
  POST   /api/incidents/:id/acknowledge
  POST   /api/incidents/:id/resolve
  POST   /api/incidents/:id/notes

Pings:
  GET    /api/ping/:token
  POST   /api/ping/:token
  POST   /api/ping/:token/start
  POST   /api/ping/:token/success
  POST   /api/ping/:token/fail

Reports:
  GET    /api/reports
  POST   /api/reports
  GET    /api/reports/:id

Status Pages:
  GET    /api/status-pages
  POST   /api/status-pages
  GET    /api/status-pages/:id
  PATCH  /api/status-pages/:id
```

#### 2.9.2 CLI Tool

**`saturn` Command-Line Tool:**

**Installation:**
```bash
npm install -g @saturn/cli
# or
brew install saturn
```

**Main Commands:**
- `saturn run` - Wrap commands with automatic pings
- `saturn ping` - Send manual pings
- `saturn monitors` - List monitors
- `saturn create` - Create new monitor

**`saturn run` Wrapper:**
```bash
saturn run --token YOUR_TOKEN -- ./backup.sh
```

**Features:**
- Automatic start/success/fail pings
- Exit code capture
- Duration measurement
- Output capture
- Inherits command exit code

**Example Usage:**
```bash
# Basic usage
saturn run --token pg_abc123 -- ./backup.sh

# With custom monitor
saturn run --token pg_abc123 --monitor "Daily Backup" -- ./backup.sh

# In crontab
0 3 * * * saturn run --token pg_abc123 -- /path/to/backup.sh

# Complex command
saturn run --token pg_abc123 -- bash -c "cd /app && ./build.sh && ./test.sh"
```

#### 2.9.3 SDKs and Libraries

**Planned/Future:**
- Node.js SDK
- Python SDK
- Go SDK
- Ruby SDK
- PHP SDK

---

## 3. Integrations and Ecosystem

### 3.1 Kubernetes Integration

**Zero-Code Kubernetes CronJob Monitoring:**

**Components:**
1. **Go Sidecar Container** - Lightweight monitoring container
2. **Helm Chart** - Easy deployment and configuration
3. **RBAC Templates** - Kubernetes permissions

**How It Works:**
1. Sidecar container starts with main container
2. Sends start ping to Saturn API
3. Monitors main container via Kubernetes API
4. Captures exit code and logs (optional)
5. Sends success/fail ping based on exit code
6. Exits after reporting

**Environment Variables:**
- `SATURN_TOKEN` - Organization or monitor token (required)
- `SATURN_MONITOR_ID` - Monitor ID (required)
- `SATURN_API_URL` - API endpoint (optional)
- `SATURN_CAPTURE_OUTPUT` - Enable log capture (optional)
- `SATURN_MAX_OUTPUT_BYTES` - Max log size (optional)
- `POD_NAME` - Pod name from metadata (required)
- `POD_NAMESPACE` - Pod namespace (optional)

**RBAC Requirements:**
- Read pods
- Read pod logs
- Get pod status

**Helm Installation:**
```bash
helm repo add saturn https://charts.saturn.io
helm install my-monitor saturn/saturn-monitor \
  --set saturn.token=st_your_token \
  --set cronjob.schedule="0 3 * * *"
```

**Example CronJob:**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: backup
spec:
  schedule: "0 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: main
            image: backup:latest
            command: ["./backup.sh"]
          
          - name: saturn-sidecar
            image: saturn/k8s-sidecar:1.0.0
            env:
            - name: SATURN_TOKEN
              valueFrom:
                secretKeyRef:
                  name: saturn-secrets
                  key: token
            - name: SATURN_MONITOR_ID
              value: "mon_abc123"
          
          restartPolicy: OnFailure
          serviceAccountName: saturn-monitor
```

### 3.2 WordPress Integration

**Native WordPress Plugin for wp-cron Monitoring:**

**Features:**
- Automatic wp-cron event discovery
- Zero configuration (just add token)
- Admin settings page
- Health dashboard widget
- Connection testing
- Event exclusion filters
- Bulk management support

**Installation:**
1. Install from WordPress.org (search "Saturn Watchdog")
2. Or upload plugin ZIP manually
3. Activate plugin
4. Add organization token in Settings → Saturn Watchdog
5. Test connection
6. Configure monitoring settings

**Dashboard Widget:**
- Active cron events count
- Health score (A-F grade)
- Recent incidents list
- Last ping times
- Quick links to Saturn dashboard

**Settings:**
- Organization token
- Monitor all events toggle
- Report interval (default: 5 minutes)
- Capture output option
- Excluded events (comma-separated)

**Use Cases:**
- Monitor critical wp-cron events
- Backup job monitoring
- Scheduled post publishing
- Email queue processing
- Database optimization tasks
- Agency management (monitor multiple client sites)

### 3.3 Terraform Provider (Coming Soon)

**Infrastructure as Code for Monitors:**
```hcl
resource "saturn_monitor" "backup" {
  name = "Daily Backup"
  schedule = {
    type = "cron"
    expression = "0 3 * * *"
  }
  grace_period = 1800
  alert_channels = ["slack", "email"]
}
```

### 3.4 Docker Compose (Planned)

**Monitor Docker Compose Services:**
- Health check monitoring
- Container exit code tracking
- Log capture integration

### 3.5 CI/CD Integrations (Planned)

**GitHub Actions:**
- Monitor workflow runs
- Build/test/deploy tracking
- Action-based alerts

**GitLab CI:**
- Pipeline monitoring
- Job-level tracking

**Jenkins:**
- Build monitoring
- Plugin integration

---

## 4. Technical Architecture

### 4.1 Technology Stack

**Frontend:**
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **Radix UI** - Accessible primitives

**Backend:**
- **Next.js API Routes** - Serverless API endpoints
- **NextAuth.js** - Authentication
- **Prisma ORM** - Database access layer
- **Zod** - Runtime validation

**Database:**
- **PostgreSQL 17** - Primary database
- **Prisma Client** - Type-safe queries
- **Migrations** - Version-controlled schema changes

**Queue/Cache:**
- **Redis 7** - Caching and queue storage
- **BullMQ** - Background job processing
- **IORedis** - Redis client

**Storage:**
- **MinIO** - S3-compatible object storage (self-hosted)
- **AWS S3** - Alternative for managed deployments

**Email:**
- **Resend** - Transactional email service

**Payments:**
- **Stripe** - Subscription billing

**Deployment:**
- **Vercel** - Web app hosting (serverless)
- **Fly.io** - Worker hosting (long-running processes)
- **Docker** - Containerization
- **Docker Compose** - Local development

**Testing:**
- **Playwright** - E2E testing and synthetic monitoring
- **Jest** - Unit testing (planned)
- **Vitest** - Fast unit testing (alternative)

**Monitoring:**
- **Sentry** - Error tracking and performance monitoring

**Development:**
- **Bun** - Fast package manager and runtime
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript strict mode** - Enhanced type safety

### 4.2 System Architecture

**High-Level Architecture:**
```
┌─────────────────────────────────────────────────────────┐
│                     Saturn                           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   Next.js    │         │   Worker     │             │
│  │   Web App    │◄───────►│   (BullMQ)   │             │
│  └──────┬───────┘         └──────┬───────┘             │
│         │                         │                     │
│         │    ┌────────────┐       │                     │
│         └───►│   Redis    │◄──────┘                     │
│              └────────────┘                             │
│                    │                                    │
│              ┌─────▼──────┐                             │
│              │ PostgreSQL │                             │
│              └────────────┘                             │
└─────────────────────────────────────────────────────────┘
```

**Data Flow:**

**1. Ping Reception:**
```
Cron Job → POST /api/ping/:token → Validate → Save Run → Queue Evaluation
```

**2. Evaluation (Background Job):**
```
Evaluator Job (every 60s) → Check all monitors → Detect issues → Create Incidents
```

**3. Alert Dispatch:**
```
Incident Created → Queue Alert Jobs → Send to Channels → Log Alert → Update Incident
```

**4. Anomaly Detection:**
```
Run Completed → Calculate Stats → Check Rules → Anomaly? → Create ANOMALY Incident
```

### 4.3 Database Schema

**Core Models:**

**1. User**
- Authentication and profile
- Email, name, image
- Onboarding status
- Created/updated timestamps

**2. Organization (Org)**
- Multi-tenant container
- Name and unique slug
- Relationships: Monitors, AlertChannels, Rules, StatusPages

**3. Membership**
- Links Users to Orgs
- Role: OWNER, ADMIN, MEMBER
- Many-to-many through table

**4. Monitor**
- Job configuration
- Schedule (interval or cron)
- Grace period
- Token for pings
- Status: OK, LATE, MISSED, FAILING, DISABLED
- Statistics: mean, stddev, median, min, max
- Relationships: Runs, Incidents

**5. Run**
- Single execution record
- Started/finished timestamps
- Duration in milliseconds
- Exit code
- Outcome: STARTED, SUCCESS, FAIL, TIMEOUT, LATE, MISSED
- Output key (S3 reference)
- Size in bytes

**6. Incident**
- Problem detection record
- Kind: MISSED, LATE, FAIL, ANOMALY
- Status: OPEN, ACKED (acknowledged), RESOLVED
- Timestamps: opened, acknowledged, resolved
- Summary and details
- Deduplication hash
- Suppress until timestamp
- Slack message threading info

**7. IncidentEvent**
- Timeline events for incidents
- Event type (created, acknowledged, resolved, note added)
- Message and metadata
- Created timestamp

**8. AlertChannel**
- Alert destination configuration
- Type: EMAIL, SLACK, DISCORD, WEBHOOK
- Label for identification
- Config JSON (channel-specific settings)
- Is default flag

**9. Rule**
- Alert routing logic
- Monitor IDs to match
- Channel IDs to alert
- Suppress minutes

**10. StatusPage**
- Public/private status pages
- Unique slug
- Components JSON (monitor groupings)
- Theme JSON (colors, logo)
- Custom domain support
- Access token for private pages

**11. SslCertificate**
- SSL certificate tracking
- Domain, issuer, subject
- Issued/expires dates
- Days until expiry
- Validation status
- Chain validity

**12. DomainExpiration**
- Domain registration tracking
- Registrar, registered/expires dates
- Days until expiry
- Auto-renew status
- Nameservers
- Domain status codes

**13. SyntheticMonitor**
- Browser automation tests
- Starting URL
- Timeout and interval
- Viewport settings
- Relationships: SyntheticSteps, SyntheticRuns

**14. SyntheticStep**
- Individual test steps
- Step type: NAVIGATE, CLICK, FILL, etc.
- Selector, value, wait time
- Order in sequence

**15. SyntheticRun**
- Test execution record
- Status: RUNNING, SUCCESS, FAILED, TIMEOUT
- Duration
- Relationships: SyntheticStepResults

**16. SyntheticStepResult**
- Individual step result
- Status: PENDING, RUNNING, SUCCESS, FAILED, SKIPPED
- Duration, error message
- Screenshot URL

**17. SlaReport**
- Service level reports
- Period: DAILY, WEEKLY, MONTHLY
- Date range
- Uptime percentage
- Check counts
- MTTR, MTBF
- Response time percentiles
- PDF URL

**18. PostMortem**
- Incident documentation
- Title, summary, impact, root cause
- Timeline JSON
- Action items JSON
- Contributors
- Status: DRAFT, IN_REVIEW, PUBLISHED, ARCHIVED

**19. ApiKey**
- API authentication
- Token hash (bcrypt)
- Last used timestamp
- Associated user and org

**20. AuditLog**
- Action tracking
- User, action, target
- Metadata JSON
- Timestamp

**21. SubscriptionPlan**
- Billing information
- Stripe customer and subscription IDs
- Plan tier: FREE, PRO, BUSINESS, ENTERPRISE
- Monitor and user limits

**22. DataExport**
- GDPR compliance
- Export status: PENDING, PROCESSING, COMPLETED, FAILED
- S3 key and download URL
- Expiration timestamp

### 4.4 Background Jobs (BullMQ Workers)

**Job Types:**

**1. Evaluator Job**
- **Frequency:** Every 60 seconds
- **Purpose:** Check all monitors for missed/late pings
- **Logic:**
  - Query all enabled monitors
  - Calculate expected last ping time
  - Compare with actual last ping time
  - Create MISSED or LATE incidents if threshold exceeded

**2. Alert Job**
- **Trigger:** Incident created
- **Purpose:** Dispatch alerts to appropriate channels
- **Logic:**
  - Apply routing rules
  - Queue channel-specific jobs (email, slack, discord, webhook)
  - Track alert sent timestamp

**3. Email Job**
- **Trigger:** Queued by alert job
- **Purpose:** Send email via Resend
- **Logic:**
  - Render HTML email template
  - Send via Resend API
  - Handle failures with retry

**4. Slack Job**
- **Trigger:** Queued by alert job
- **Purpose:** Send Slack message
- **Logic:**
  - Format message with Block Kit
  - Send to configured channel
  - Handle threading for updates
  - Store message timestamp for threading

**5. Discord Job**
- **Trigger:** Queued by alert job
- **Purpose:** Send Discord webhook
- **Logic:**
  - Format embed
  - POST to webhook URL
  - Handle rate limits

**6. Webhook Job**
- **Trigger:** Queued by alert job
- **Purpose:** Send custom HTTP webhook
- **Logic:**
  - Format JSON payload
  - POST to configured URL
  - Add custom headers
  - Retry on failure (exponential backoff)

**7. Scheduled Reports Job**
- **Frequency:** Daily, weekly, monthly (configurable)
- **Purpose:** Generate SLA reports automatically
- **Logic:**
  - Query runs and incidents for period
  - Calculate metrics
  - Generate HTML report
  - Upload to S3
  - Send email (optional)

**8. Synthetic Monitor Job**
- **Frequency:** Per monitor interval
- **Purpose:** Run browser automation tests
- **Logic:**
  - Launch Playwright browser
  - Execute steps in order
  - Capture screenshots on failure
  - Calculate duration per step
  - Create SyntheticRun record
  - Create incident if failed

**9. SSL Check Job**
- **Frequency:** Every 6 hours per monitor
- **Purpose:** Check SSL certificates
- **Logic:**
  - Connect to HTTPS endpoint
  - Extract certificate details
  - Check expiration date
  - Validate chain
  - Update SslCertificate record
  - Create incident if approaching expiration

**10. Domain Check Job**
- **Frequency:** Every 24 hours per monitor
- **Purpose:** Check domain expiration
- **Logic:**
  - Perform WHOIS lookup
  - Parse expiration date
  - Extract registrar info
  - Update DomainExpiration record
  - Create incident if approaching expiration

**11. Data Export Job**
- **Trigger:** User requests data export
- **Purpose:** Export all user data (GDPR compliance)
- **Logic:**
  - Query all user's data
  - Format as JSON
  - Upload to S3
  - Generate presigned URL
  - Send email with download link
  - Auto-expire after 7 days

**Queue Configuration:**
- Redis as queue backend
- Job retry with exponential backoff
- Job priority support
- Concurrency limits per job type
- Dead letter queue for failed jobs
- Job progress tracking

### 4.5 Deployment Architecture

**Production Deployment:**

**Web Application (Vercel):**
- Serverless Next.js deployment
- Edge network for global performance
- Automatic HTTPS
- Environment variable management
- Preview deployments for PRs
- Automatic scaling

**Worker (Fly.io):**
- Long-running Node.js process
- BullMQ worker instance
- Multiple regions for redundancy
- Automatic health checks
- Log aggregation
- Configurable VM size

**Database (Neon/Supabase):**
- Managed PostgreSQL
- Automatic backups
- Connection pooling (PgBouncer)
- Point-in-time recovery
- Read replicas (optional)

**Redis (Upstash):**
- Managed Redis
- Global replication
- Automatic persistence
- Connection pooling
- Rate limiting built-in

**Object Storage (S3/MinIO):**
- Output capture storage
- Report storage
- Data export storage
- Presigned URLs for secure access

**Email (Resend):**
- Transactional email
- API-based sending
- Delivery tracking
- Bounce handling

**Payments (Stripe):**
- Subscription management
- Webhook handling
- Customer portal
- Invoice generation

**Error Tracking (Sentry):**
- Exception monitoring
- Performance monitoring
- Release tracking
- User feedback

**Deployment Pipeline:**
```
Git Push → GitHub Actions → Build → Test → Deploy Web (Vercel) & Worker (Fly.io)
```

**Infrastructure as Code:**
- Docker Compose for local development
- Fly.io config (fly.toml)
- Vercel config (vercel.json)
- Terraform (planned)

---

## 5. Pricing and Plans

### 5.1 Available Plans

| Feature | FREE | PRO | BUSINESS | ENTERPRISE |
|---------|------|-----|----------|------------|
| **Price** | $0/month | $29/month | $99/month | Custom |
| **Monitors** | 10 | 50 | 200 | Unlimited |
| **Users** | 1 | 5 | 20 | Unlimited |
| **Data Retention** | 30 days | 90 days | 1 year | Custom |
| **Anomaly Detection** | ✓ | ✓ | ✓ | ✓ |
| **Synthetic Monitoring** | Limited (5) | ✓ (25) | ✓ (100) | ✓ (Unlimited) |
| **Slack/Discord/Email** | ✓ | ✓ | ✓ | ✓ |
| **Webhooks** | — | ✓ | ✓ | ✓ |
| **Status Pages** | 1 | 5 | 20 | Unlimited |
| **Custom Domains** | — | — | ✓ | ✓ |
| **SSO/SAML** | — | — | — | ✓ |
| **API Access** | ✓ | ✓ | ✓ | ✓ |
| **SLA** | — | — | 99.9% | 99.99% |
| **Support** | Community | Email | Priority | Dedicated |
| **Integrations** | All | All | All | All + Custom |

### 5.2 Limit Enforcement

**Soft Limits:**
- Warning at 90% usage
- Grace period of 7 days
- Email notifications

**Hard Limits:**
- Enforced at 100% usage
- Cannot create new monitors
- Existing monitors continue running
- Prompt to upgrade

### 5.3 Self-Hosted Costs

**Free Tier (Suitable for 50-100 monitors, 1-2 users):**
- Vercel: Free (100GB bandwidth/month)
- Fly.io: Free (3 VMs)
- Neon: Free (0.5GB storage)
- Upstash: Free (10k commands/day)
- Resend: Free (100 emails/day)
- **Total: $0/month**

**Production Tier (500-1000 monitors, 5-10 users):**
- Vercel Pro: $20/month
- Fly.io: $10/month
- Neon Pro: $20/month
- Upstash: $5/month
- Resend: $10/month
- **Total: ~$65/month**

**Enterprise Tier (5000+ monitors, unlimited users):**
- Custom Vercel plan: $100+/month
- Multiple Fly.io instances: $50+/month
- Dedicated database: $100+/month
- Premium Redis: $50+/month
- **Total: $200-500+/month**

---

## 6. Use Cases and Applications

### 6.1 DevOps and Infrastructure

**Monitor Critical Jobs:**
- Database backups
- Log rotation
- Certificate renewal
- Cleanup scripts
- Health checks
- Data sync jobs

**Benefits:**
- Early warning for performance issues
- Reduced downtime
- Automated alerting
- Historical analytics

### 6.2 Web Applications

**Monitor Services:**
- API endpoints
- Background jobs
- Queue workers
- Email sending
- Report generation
- Cache warming

**Benefits:**
- Uptime tracking
- Response time monitoring
- SLA reporting
- Customer status pages

### 6.3 E-commerce

**Monitor Business-Critical Flows:**
- Order processing
- Payment webhook handling
- Inventory sync
- Email notifications
- Abandoned cart jobs
- Analytics aggregation

**Benefits:**
- Revenue protection
- Customer experience monitoring
- Synthetic transaction testing
- Alert on payment failures

### 6.4 Data Pipelines

**Monitor ETL Jobs:**
- Data extraction
- Transformation jobs
- Load operations
- Data validation
- Aggregation jobs

**Benefits:**
- Detect data quality issues
- Anomaly detection for row counts
- Duration monitoring
- Output size tracking

### 6.5 WordPress Agencies

**Monitor Client Sites:**
- wp-cron events
- Backup jobs
- Plugin updates
- Post publishing
- Database optimization

**Benefits:**
- Centralized monitoring dashboard
- Multi-site management
- Client reporting
- Proactive issue detection

### 6.6 Kubernetes Workloads

**Monitor CronJobs:**
- Scheduled maintenance
- Data processing
- Report generation
- Cleanup tasks

**Benefits:**
- Zero code changes
- Sidecar container pattern
- RBAC-compliant
- Helm chart deployment

---

## 7. Key Differentiators and Competitive Advantages

### 7.1 vs Traditional Uptime Monitors (Pingdom, UptimeRobot)

**Saturn Advantages:**
- Anomaly detection (not just up/down)
- Cron job monitoring (not just HTTP)
- Statistical analysis and baselines
- Output capture and redaction
- Richer incident management
- Post-mortem templates

### 7.2 vs Application Monitoring (New Relic, Datadog)

**Saturn Advantages:**
- Focused on scheduled jobs and cron
- Lighter weight and easier setup
- Better for heartbeat monitoring
- Lower cost for cron monitoring use case
- Self-hosted option

### 7.3 vs Cron Monitors (Cronitor, Healthchecks.io)

**Saturn Advantages:**
- Statistical anomaly detection (unique)
- Synthetic monitoring with Playwright
- Built-in status pages
- Post-mortem creation
- Health scoring (A-F grades)
- More advanced analytics (MTTR, MTBF, percentiles)
- Richer team collaboration features
- WordPress and Kubernetes integrations

---

## 8. Development and Contribution

### 8.1 Local Development Setup

**Prerequisites:**
- Node.js 18+
- Bun (package manager)
- Docker and Docker Compose
- PostgreSQL 17
- Redis 7

**Quick Start:**
```bash
# Clone repository
git clone <repo>
cd pulse-guard

# Install dependencies
bun install

# Start services (Postgres, Redis, MinIO)
make docker-up

# Setup environment
cp env.txt .env
# Edit .env with local values

# Run migrations
cd packages/db
npx prisma migrate dev

# Seed test data
make seed

# Start development servers
bun run dev
# Web: http://localhost:3000
# Worker: Running in background
```

### 8.2 Project Structure

```
pulse-guard/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   │   ├── api/  # API routes
│   │   │   │   ├── app/  # Dashboard pages
│   │   │   │   └── auth/ # Auth pages
│   │   │   ├── components/  # React components
│   │   │   └── lib/      # Utilities
│   │   └── package.json
│   │
│   └── worker/           # Background job worker
│       ├── src/
│       │   ├── jobs/     # Job processors
│       │   └── index.ts  # Worker entry point
│       └── package.json
│
├── packages/
│   ├── db/               # Shared database package
│   │   ├── prisma/       # Database schema
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── src/
│   │
│   ├── shared/           # Shared utilities
│   └── cli/              # CLI tool
│
├── integrations/         # Third-party integrations
│   ├── kubernetes/       # K8s sidecar (Go) + Helm
│   ├── terraform-provider/  # Terraform integration
│   └── wordpress/        # WordPress plugin (PHP)
│
├── website/              # Documentation website
│   └── docs/             # MDX documentation
│
├── docs/                 # Development documentation
├── deploy-all.sh         # Automated deployment
├── setup-env.sh          # Environment setup
├── docker-compose.yml    # Local development services
├── Makefile              # Development commands
└── package.json          # Root package.json
```

### 8.3 Tech Stack Details

**Monorepo Management:**
- Workspace-based (Bun workspaces)
- Shared packages
- Unified dependencies

**Code Quality:**
- TypeScript strict mode
- ESLint configuration
- Prettier for formatting
- Zod for runtime validation

**Testing:**
- Playwright for E2E tests
- Jest for unit tests (planned)
- Integration test scripts

### 8.4 Contributing

**Guidelines:**
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Run linting and tests
5. Submit pull request

**Commit Conventions:**
- feat: New feature
- fix: Bug fix
- docs: Documentation changes
- refactor: Code refactoring
- test: Test additions/changes
- chore: Maintenance tasks

---

## 9. Roadmap and Future Plans

### 9.1 Short-Term (Next 3 Months)

- **Terraform Provider** - Infrastructure as code support
- **GitHub Actions Integration** - Monitor workflows
- **Mobile App** - iOS and Android apps for incident management
- **Incident Updates on Status Pages** - Post updates to ongoing incidents
- **Multi-language Support** - i18n for global users

### 9.2 Medium-Term (3-6 Months)

- **GitLab CI Integration** - Pipeline monitoring
- **PagerDuty Integration** - Escalation to on-call
- **Kubernetes Operator** - CRD-based monitoring
- **Advanced Anomaly Tuning** - ML-based threshold optimization
- **Incident Correlation** - Automatic grouping of related incidents

### 9.3 Long-Term (6-12 Months)

- **Jenkins Plugin** - Build monitoring
- **Azure DevOps Extension** - Pipeline integration
- **CircleCI Orb** - Native CircleCI support
- **Advanced Synthetic Monitoring** - Visual regression testing
- **Custom Metrics** - User-defined metrics and dashboards
- **Forecasting** - Predictive analytics for incidents

---

## 10. Conclusion

**Saturn (Saturn)** is a comprehensive, production-ready monitoring platform that goes beyond traditional uptime monitoring by incorporating statistical anomaly detection, rich analytics, and extensive integrations. It's designed for modern DevOps teams who need:

- **Proactive alerting** before failures occur
- **Rich analytics** with health scores and SLA reports
- **Flexible integrations** across Kubernetes, WordPress, and custom environments
- **Team collaboration** with incident management and post-mortems
- **Self-hosted option** for data privacy and control

**Key Strengths:**
1. Unique anomaly detection using statistical analysis
2. Comprehensive feature set (synthetic monitoring, status pages, SSL/domain monitoring)
3. Developer-friendly (CLI, API, SDKs)
4. Production-ready with modern tech stack
5. Active development with clear roadmap

**Ideal For:**
- DevOps teams monitoring critical cron jobs
- Agencies managing multiple client sites
- SaaS companies needing uptime monitoring
- Teams wanting self-hosted monitoring solutions
- Organizations requiring advanced analytics and reporting

**Getting Started:**
1. Visit the deployed app or deploy your own instance
2. Create an organization
3. Add your first monitor
4. Configure alert channels
5. Start monitoring!

---

## Appendix

### A. Glossary of Terms

- **Monitor** - Configuration for a job or endpoint to monitor
- **Run** - Single execution record of a monitored job
- **Incident** - Detected problem (MISSED, LATE, FAIL, or ANOMALY)
- **Ping** - HTTP request to report job status
- **Grace Period** - Extra time allowed before marking job as late
- **Anomaly** - Statistical deviation from normal behavior
- **Z-Score** - Number of standard deviations from mean
- **MTTR** - Mean Time To Repair (average resolution time)
- **MTBF** - Mean Time Between Failures (average uptime)
- **Health Score** - 0-100 score with A-F grade
- **Synthetic Monitoring** - Browser automation testing
- **Status Page** - Public/private page showing service health
- **Post-Mortem** - Incident documentation and analysis

### B. Environment Variables Reference

**Required:**
- `DATABASE_URL` - PostgreSQL connection string (pooled)
- `DATABASE_URL_UNPOOLED` - PostgreSQL direct connection
- `REDIS_URL` - Redis connection string
- `NEXTAUTH_SECRET` - Auth secret (32+ characters)
- `NEXTAUTH_URL` - Application URL
- `JWT_SECRET` - JWT signing secret

**Email:**
- `RESEND_API_KEY` - Resend API key
- `FROM_EMAIL` - Sender email address

**Optional:**
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `SLACK_CLIENT_ID` - Slack OAuth client ID
- `SLACK_CLIENT_SECRET` - Slack OAuth secret
- `DISCORD_CLIENT_ID` - Discord OAuth client ID
- `DISCORD_CLIENT_SECRET` - Discord OAuth secret
- `S3_ENDPOINT` - S3/MinIO endpoint
- `S3_BUCKET` - S3 bucket name
- `S3_ACCESS_KEY_ID` - S3 access key
- `S3_SECRET_ACCESS_KEY` - S3 secret key
- `SENTRY_DSN` - Sentry error tracking DSN

### C. API Rate Limits

**Public Ping API:**
- 120 requests per minute per token
- No authentication required (uses token in URL)

**Authenticated API:**
- 300 requests per minute per user
- Bearer token authentication required

**Status Pages:**
- 60 requests per minute per IP (public pages)
- No limit for authenticated access

### D. Database Performance Considerations

**Indexes:**
- All foreign keys indexed
- Frequently queried fields indexed
- Composite indexes for common queries

**Query Optimization:**
- Use Prisma's query builder
- Avoid N+1 queries with `include`
- Pagination for large result sets
- Connection pooling via PgBouncer

**Scaling:**
- Read replicas for heavy read workloads
- Partitioning for large tables (runs, incidents)
- Regular VACUUM and ANALYZE
- Index maintenance

### E. Monitoring Best Practices

**Grace Periods:**
- Set to 5-30% of expected job duration
- Account for network latency and variability
- Too short = false positives
- Too long = delayed alerts

**Anomaly Detection:**
- Wait for baseline (10+ runs)
- Tune thresholds if too many false positives
- Consider job variability (high variance = use median multiplier)
- Review anomalies weekly to identify trends

**Alert Fatigue:**
- Use routing rules to separate critical from informational
- Leverage suppression for known issues
- Set appropriate grace periods
- Review and tune regularly

**Status Pages:**
- Group related monitors into components
- Use maintenance mode for planned downtime
- Keep descriptions concise
- Update regularly during incidents

### F. Security Best Practices

**Token Management:**
- Rotate tokens regularly
- Use monitor-specific tokens when possible
- Never commit tokens to version control
- Use environment variables or secrets management

**Access Control:**
- Follow principle of least privilege
- Audit role assignments regularly
- Remove inactive users
- Enable 2FA (when available)

**Data Protection:**
- Enable output capture only when needed
- Review redaction patterns
- Limit data retention period
- Regular data exports for backup

**Network Security:**
- Use HTTPS for all connections
- Whitelist IP addresses if possible
- Rate limiting enabled
- DDoS protection via CDN

---

**End of Report**

*This comprehensive report documents all features and capabilities of Saturn as of October 18, 2025. For the latest updates, refer to the official documentation and changelog.*

