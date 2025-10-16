# Saturn vs. Cronitor

Factual feature comparison between Saturn and Cronitor.

## Feature Comparison

| Feature | Saturn | Cronitor |
|---------|--------|----------|
| **Basic Monitoring** | ✓ | ✓ |
| **Email Alerts** | ✓ | ✓ |
| **Slack Alerts** | ✓ | ✓ |
| **Discord Alerts** | ✓ | ✗ |
| **Webhooks** | ✓ | ✓ |
| **Grace Periods** | ✓ | ✓ |
| **Anomaly Detection** | ✓ Statistical (Z-Score) | ✗ |
| **Health Scoring** | ✓ (0-100, A-F) | ✗ |
| **MTTR/MTBF** | ✓ | ✗ |
| **Duration Percentiles** | ✓ (P50/P95/P99) | ✗ |
| **Kubernetes Helm Chart** | ✓ Native | ✗ |
| **WordPress Plugin** | ✓ | ✗ |
| **CLI Tool** | ✓ | ✓ |
| **Free Tier** | 10 monitors | 3 monitors |
| **Starting Price** | $29/mo (50 monitors) | $29/mo (30 monitors) |

## Key Differences

### 1. Anomaly Detection

**Saturn**: Uses Welford's algorithm for statistical analysis. Detects when jobs run 3+ standard deviations slower than normal.

**Cronitor**: Binary pass/fail only. No performance anomaly detection.

### 2. Health Scoring

**Saturn**: Every monitor gets a 0-100 health score with A-F grade based on uptime, incidents, consistency.

**Cronitor**: No health scoring system.

### 3. Kubernetes

**Saturn**: Native Helm chart with Go sidecar. Zero code changes.

**Cronitor**: Manual integration required.

### 4. WordPress

**Saturn**: Dedicated plugin with bulk management for agencies.

**Cronitor**: Generic HTTP integration only.

## When to Choose Saturn

- Need anomaly detection for performance issues
- Running Kubernetes CronJobs
- Managing multiple WordPress sites
- Want reliability metrics (MTTR/MTBF)
- Need health scoring for reporting

## When to Choose Cronitor

- Simple pass/fail monitoring is sufficient
- Established integration ecosystem
- Prefer mature, battle-tested product

## Migration from Cronitor

1. Export monitor list from Cronitor
2. Create monitors in Saturn with same schedules
3. Update ping URLs in cron jobs
4. Run in parallel for 7 days
5. Verify Saturn alerts working
6. Cancel Cronitor subscription

No downtime required — monitors can ping both services simultaneously during migration.

## Questions?

Contact: hello@saturn.example.com

