# Saturn Event Tracking Specification

Complete event taxonomy for PostHog/GA4 analytics tracking.

## Core Philosophy

Track user **outcomes and value**, not just clicks. Focus on the journey from signup → first value → retention.

## North Star Metric

**Active Protected Jobs** = Monitors with ≥3 successful pings in the last 7 days

This metric captures real adoption (not just signup) and ongoing value delivery.

---

## Event Taxonomy

### Authentication & Onboarding

#### `Signup`

**When**: User creates account (after email verification)

**Properties**:
```typescript
{
  userId: string;
  email: string;
  signupMethod: 'email' | 'google' | 'magic_link';
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
}
```

**Example**:
```typescript
posthog.capture('Signup', {
  userId: 'user_abc123',
  email: 'alice@company.com',
  signupMethod: 'google',
  utmSource: 'product-hunt',
  utmMedium: 'launch-post',
  utmCampaign: '2025-10-launch'
});
```

---

#### `Login`

**When**: User successfully logs in

**Properties**:
```typescript
{
  userId: string;
  loginMethod: 'email' | 'google' | 'magic_link';
  sessionId: string;
}
```

---

### Organization & Team

#### `OrgCreated`

**When**: First organization created for user

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  orgName: string;
  planTier: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
}
```

---

#### `TeamMemberInvited`

**When**: User invites another team member

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  inviteeEmail: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
}
```

---

### Monitor Management

#### `MonitorCreated`

**When**: User creates a new monitor

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  monitorId: string;
  monitorName: string;
  scheduleType: 'interval' | 'cron';
  scheduleValue: string; // "3600" or "0 3 * * *"
  timezone?: string;
  captureOutput: boolean;
  source: 'web' | 'cli' | 'api' | 'helm' | 'wordpress-plugin';
}
```

**Example**:
```typescript
posthog.capture('MonitorCreated', {
  userId: 'user_abc123',
  orgId: 'org_xyz789',
  monitorId: 'mon_backup_001',
  monitorName: 'Nightly Database Backup',
  scheduleType: 'cron',
  scheduleValue: '0 3 * * *',
  timezone: 'America/New_York',
  captureOutput: true,
  source: 'helm'
});
```

---

#### `MonitorDeleted`

**When**: User deletes a monitor

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  monitorId: string;
  ageInDays: number;
  totalPings: number;
  totalIncidents: number;
}
```

---

### Pings & Health

#### `FirstPingReceived`

**When**: Monitor receives its very first ping (critical milestone!)

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  monitorId: string;
  timeSinceCreation: number; // seconds
  pingType: 'start' | 'success' | 'fail';
}
```

**Why important**: Indicates successful integration. Key activation metric.

---

#### `AnomalyDetected`

**When**: System detects statistical anomaly

**Properties**:
```typescript
{
  orgId: string;
  monitorId: string;
  incidentId: string;
  zScore: number;
  durationMs: number;
  meanMs: number;
  stddevMs: number;
  rule: 'zscore>3' | 'median_multiplier>3' | 'output_drop>50%';
}
```

---

### Incidents

#### `FirstIncidentOpened`

**When**: User's first incident is created (for any monitor)

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  incidentId: string;
  incidentType: 'MISSED' | 'LATE' | 'FAIL' | 'ANOMALY';
  timeSinceSignup: number; // seconds
}
```

---

#### `IncidentAcknowledged`

**When**: User acknowledges an incident

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  incidentId: string;
  incidentType: 'MISSED' | 'LATE' | 'FAIL' | 'ANOMALY';
  timeToAcknowledge: number; // seconds since incident opened
  acknowledgedFrom: 'web' | 'slack' | 'discord' | 'api';
}
```

---

#### `IncidentResolved`

**When**: Incident is resolved (manually or auto)

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  incidentId: string;
  incidentType: 'MISSED' | 'LATE' | 'FAIL' | 'ANOMALY';
  mttrSeconds: number;
  resolvedBy: 'user' | 'auto';
}
```

---

### Alert Channels

#### `AlertChannelConnected`

**When**: User connects an alert channel

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  channelType: 'email' | 'slack' | 'discord' | 'webhook';
  channelId: string;
  timeSinceSignup: number;
}
```

**Why important**: Users with alerts connected have 3x retention.

---

#### `AlertDelivered`

**When**: Alert successfully delivered to channel

**Properties**:
```typescript
{
  orgId: string;
  incidentId: string;
  channelType: 'email' | 'slack' | 'discord' | 'webhook';
  deliveryTimeMs: number;
  success: boolean;
}
```

---

### Maintenance Windows

#### `MaintenanceWindowCreated`

**When**: User creates maintenance window

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  windowType: 'one_time' | 'recurring';
  duration: number; // seconds
  monitorCount: number; // how many monitors affected
}
```

---

### Billing & Upgrades

#### `UpgradeStarted`

**When**: User clicks upgrade button

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  fromPlan: 'FREE' | 'PRO' | 'BUSINESS';
  toPlan: 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  trigger: 'usage_limit' | 'feature_gate' | 'voluntary';
}
```

---

#### `SubscriptionCreated`

**When**: User completes payment and subscription is active

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  plan: 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  billingCycle: 'monthly' | 'annual';
  amount: number; // in cents
  currency: 'USD';
  timeSinceSignup: number; // seconds
}
```

**Critical metric**: Time from signup to paid conversion.

---

#### `SubscriptionCancelled`

**When**: User cancels subscription

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  plan: 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  lifetimeValue: number; // total paid
  subscriptionAge: number; // days
  cancelReason?: string;
}
```

---

### Feature Adoption

#### `CLIInstalled`

**When**: User runs `pulse login` successfully

**Properties**:
```typescript
{
  userId: string;
  cliVersion: string;
  os: string;
  arch: string;
}
```

---

#### `HelmChartInstalled`

**When**: First Helm chart install detected (via sidecar ping with Helm metadata)

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  monitorId: string;
  chartVersion: string;
  kubernetesVersion: string;
}
```

---

#### `WordPressPluginActivated`

**When**: WordPress plugin sends first health check

**Properties**:
```typescript
{
  userId: string;
  orgId: string;
  siteUrl: string;
  wordpressVersion: string;
  pluginVersion: string;
  eventCount: number; // discovered wp-cron events
}
```

---

## UTM Conventions

### Structure

```
https://saturn.example.com/signup?utm_source=<source>&utm_medium=<medium>&utm_campaign=<campaign>&utm_content=<content>
```

### Sources

- `product-hunt` — Product Hunt listing
- `show-hn` — Hacker News Show HN post
- `google-ads` — Google Ads campaigns
- `linkedin` — LinkedIn organic/paid
- `twitter` — Twitter/X posts
- `reddit` — Reddit posts
- `github` — GitHub README/repo
- `artifact-hub` — Artifact Hub listing
- `wordpress-org` — WordPress.org plugin directory

### Mediums

- `launch-post` — Launch announcement
- `cpc` — Cost per click (ads)
- `social` — Organic social media
- `referral` — Partner referrals
- `email` — Email campaigns
- `content` — Blog/content marketing

### Campaign Examples

- `2025-10-launch` — October 2025 launch week
- `kubernetes-q4` — Kubernetes-focused Q4 campaign
- `wordpress-agency` — WordPress agency outreach
- `cronitor-alternative` — Comparison landing page

### Content

- `hero-cta` — Hero section CTA
- `feature-anomaly` — Anomaly detection feature
- `comparison-table` — Feature comparison
- `pricing-card` — Pricing card click

---

## Implementation Example

### React Component

```typescript
import { usePostHog } from 'posthog-js/react';

export function CreateMonitorButton() {
  const posthog = usePostHog();
  
  const handleCreateMonitor = async (data) => {
    const monitor = await api.createMonitor(data);
    
    // Track event
    posthog.capture('MonitorCreated', {
      userId: user.id,
      orgId: user.orgId,
      monitorId: monitor.id,
      monitorName: monitor.name,
      scheduleType: monitor.schedule.type,
      scheduleValue: monitor.schedule.value,
      captureOutput: monitor.captureOutput,
      source: 'web'
    });
    
    // Check if first ping
    if (isFirstMonitor) {
      posthog.capture('FirstMonitorCreated', {
        userId: user.id,
        orgId: user.orgId,
        timeSinceSignup: Date.now() - user.createdAt
      });
    }
  };
  
  return <button onClick={handleCreateMonitor}>Create Monitor</button>;
}
```

---

## Funnel Analysis

### Primary Funnel: Signup → Value

```
Signup
  ↓ (Target: 90% proceed)
OrgCreated
  ↓ (Target: 80% proceed)
MonitorCreated
  ↓ (Target: 70% proceed)
FirstPingReceived
  ↓ (Target: 50% proceed)
AlertChannelConnected
  ↓ (Target: 20% proceed within 30 days)
SubscriptionCreated
```

### Activation Metric

User is "activated" when:
1. Monitor created AND
2. First ping received AND
3. Alert channel connected

**Target**: 60% of signups reach activation within 7 days.

---

## Retention Cohorts

Track weekly retention by:
- Users with ≥1 active protected job
- Users who viewed dashboard
- Users who acknowledged incident

**Hypothesis**: Users who experience their first incident and successfully resolve it have 2x retention.

---

## A/B Test Events

#### `ExperimentViewed`

**When**: User enters A/B test variant

**Properties**:
```typescript
{
  userId: string;
  experimentId: string;
  variant: 'control' | 'variant_a' | 'variant_b';
}
```

---

#### `ExperimentConverted`

**When**: User completes experiment goal

**Properties**:
```typescript
{
  userId: string;
  experimentId: string;
  variant: 'control' | 'variant_a' | 'variant_b';
  goalType: string;
}
```

---

## Dashboard Metrics

### KPIs to Display

1. **North Star**: Active Protected Jobs (7-day rolling)
2. **Acquisition**: Signups per day
3. **Activation**: % of signups with first ping received
4. **Revenue**: MRR, ARR
5. **Retention**: 7-day, 30-day, 90-day retention by cohort
6. **Feature Adoption**:
   - % with Helm chart
   - % with WordPress plugin
   - % with CLI installed
   - % with 3+ alert channels

---

## Privacy & Compliance

- **No PII** in event properties (use hashed IDs only)
- **User consent** required before tracking (cookie notice)
- **Opt-out** mechanism in user settings
- **Data retention**: 2 years, then automatic deletion
- **GDPR**: Right to deletion implemented

---

## Implementation Checklist

- [ ] PostHog project created with API key
- [ ] Cookie consent banner implemented
- [ ] All signup/login events tracked
- [ ] First ping milestone tracked
- [ ] Activation funnel dashboard created
- [ ] UTM parameters captured on signup
- [ ] Retention cohorts configured
- [ ] A/B testing framework ready

---

## Next Steps

1. **Phase 1**: Implement core events (Signup → FirstPingReceived)
2. **Phase 2**: Add alert and incident events
3. **Phase 3**: Implement feature adoption tracking
4. **Phase 4**: Add custom dashboards and funnels

**Owner**: Product team  
**Review**: Quarterly

