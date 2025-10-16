# Saturn vs. Healthchecks.io

Factual feature comparison between Saturn and Healthchecks.io.

## Feature Comparison

| Feature | Saturn | Healthchecks.io |
|---------|--------|-----------------|
| **Basic Monitoring** | ✓ | ✓ |
| **Email Alerts** | ✓ | ✓ |
| **Slack Alerts** | ✓ | ✓ |
| **Discord Alerts** | ✓ | ✓ |
| **Webhooks** | ✓ | ✓ |
| **Grace Periods** | ✓ | ✓ |
| **Anomaly Detection** | ✓ Statistical | ✗ |
| **Health Scoring** | ✓ (0-100, A-F) | ✗ |
| **MTTR/MTBF** | ✓ | ✗ |
| **Duration Percentiles** | ✓ | ✗ |
| **Kubernetes Helm Chart** | ✓ | ✗ |
| **WordPress Plugin** | ✓ | ✗ |
| **Self-Hosted** | Enterprise | ✓ Open Source |
| **Free Tier** | 10 monitors | 20 checks |
| **Starting Price** | $29/mo | $20/mo |

## Key Differences

### 1. Open Source

**Healthchecks.io**: Fully open source (BSD license), can self-host.

**Saturn**: Proprietary SaaS, self-hosted available for Enterprise.

### 2. Anomaly Detection

**Saturn**: Statistical analysis with Z-Score detection.

**Healthchecks.io**: No anomaly detection.

### 3. Kubernetes

**Saturn**: Native Helm chart.

**Healthchecks.io**: Manual integration.

### 4. Analytics

**Saturn**: Health scores, MTTR/MTBF, percentiles.

**Healthchecks.io**: Basic ping history.

## When to Choose Saturn

- Need anomaly detection
- Want health scoring and advanced analytics
- Running Kubernetes CronJobs
- Managing WordPress sites at scale
- Prefer SaaS over self-hosting

## When to Choose Healthchecks.io

- Want open source and self-hosting
- Simple monitoring is sufficient
- Tight budget
- Prefer community-driven development

## Migration from Healthchecks.io

1. Export checks from Healthchecks.io
2. Create monitors in Saturn
3. Update ping URLs
4. Test in parallel
5. Switch over

## Questions?

Contact: hello@saturn.example.com

