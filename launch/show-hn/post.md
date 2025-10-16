# Show HN: Saturn — cron & CronJob monitoring with real anomaly detection

Hey HN! I built Saturn to solve a problem I kept running into: my cron jobs would slowly degrade over weeks, then suddenly fail. Traditional monitors only told me "it failed" — by then it was too late.

## The Problem

You have a nightly backup that normally takes 10 minutes. One day it takes 15 minutes. Then 20. Then 30. Then 45. Then it times out and fails. Traditional monitoring: ✅ ✅ ✅ ✅ ✅ ❌

You only find out when it fails completely.

## The Solution

Saturn uses **statistical analysis** (Welford's algorithm for incremental mean/variance) to establish a baseline and detect when jobs behave abnormally — even if they technically succeed.

In the example above, Saturn would alert you on day 3 when the job hit 30 minutes (3 standard deviations above the mean), giving you time to investigate before the failure.

## Try It Now

**Kubernetes** (60 seconds):
```bash
helm repo add saturn https://charts.saturn.example.com
helm install backup saturn/saturn-monitor \
  --set saturn.token=<YOUR_TOKEN> \
  --set cronjob.schedule="0 3 * * *"
```

**Linux cron** (curl):
```bash
0 3 * * * ./backup.sh && curl https://api.saturn.example.com/api/ping/<MONITOR_ID>/success
```

**WordPress**: Install plugin, add token, done.

## What's Unique

1. **Anomaly detection** using Z-Score analysis
2. **Health scores** (0-100, A-F grades) per monitor
3. **MTTR/MTBF** tracking
4. **Kubernetes native** (Helm + sidecar, zero code changes)
5. **WordPress plugin** for wp-cron (perfect for agencies managing hundreds of sites)

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind
- **Backend**: PostgreSQL (Neon), Redis (Upstash), BullMQ
- **Sidecar**: Go (for Kubernetes)
- **Anomalies**: Welford's online algorithm (O(1) memory!)

## Demo

Live demo available at saturn.example.com (sign up for free tier: 10 monitors)

## Open Questions

- What scheduled jobs are you monitoring?
- How do you currently detect performance degradation?
- Would you use anomaly detection for your cron jobs?

The code is proprietary but I'm happy to discuss the architecture, especially the anomaly detection algorithms and the Kubernetes sidecar pattern.

**GitHub**: github.com/saturn  
**Docs**: docs.saturn.example.com

Looking forward to your feedback!

