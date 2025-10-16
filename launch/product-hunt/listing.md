# Saturn - Product Hunt Listing

## Title
Saturn: Cron monitoring with real anomaly detection

## Tagline
Stop guessing. Start knowing.

## Description

Saturn is next-generation monitoring for cron jobs and scheduled tasks. Unlike traditional "ping or fail" monitors, Saturn uses statistical analysis to catch performance issues **before** they become failures.

### What makes Saturn different?

**1. Anomaly Detection** 🔍  
- Automatic statistical baseline (Welford's algorithm)
- Z-Score analysis finds outliers
- Alerts when jobs slow down 3x, even if they succeed

**2. Zero-Code Kubernetes** ☸️  
- Helm chart + Go sidecar
- Deploy in 60 seconds
- No code changes required

**3. WordPress Native** 🔷  
- Dedicated plugin for wp-cron
- Bulk management for agencies
- Dashboard health widget

**4. Advanced Analytics** 📊  
- Health scores (0-100, A-F grades)
- MTTR/MTBF tracking
- P50/P95/P99 percentiles

### Perfect for:
- DevOps teams running critical cron jobs
- Kubernetes users with CronJob workloads
- WordPress agencies managing 10-1000+ sites
- SaaS companies with background jobs

### Tech Stack:
Next.js 15, PostgreSQL, Redis, Go (sidecar), TypeScript

## Maker Comment

Hey Product Hunt! 👋

I built Saturn because I was tired of finding out about slow cron jobs **after** they failed completely. Traditional monitors only tell you "job succeeded" or "job failed" — but what about when your 10-minute backup suddenly takes 45 minutes?

That's where anomaly detection comes in. Saturn learns your job's normal behavior and alerts you when something's off, giving you time to fix it before it breaks.

The Kubernetes integration was born from pain — adding monitoring to dozens of CronJobs meant editing every manifest. Now it's just `helm install` and done.

Would love your feedback! What scheduled jobs are you monitoring (or wish you were)?

## What's Different From Competitors?

**vs. Cronitor/Healthchecks.io:**
- ✅ Statistical anomaly detection (they only do pass/fail)
- ✅ Health scoring system
- ✅ Native Kubernetes Helm chart
- ✅ WordPress plugin with bulk management
- ✅ MTBF/MTTR analytics

**vs. Datadog/New Relic:**
- ✅ Purpose-built for cron (not generic APM)
- ✅ Simpler pricing (not per-host)
- ✅ Zero-code Kubernetes setup
- ✅ Free tier (10 monitors)

## Launch Day Checklist

- [ ] Submit to Product Hunt (9 AM PT)
- [ ] Post to Show HN
- [ ] Tweet launch thread
- [ ] LinkedIn announcement
- [ ] Email existing beta users
- [ ] Prepare for traffic spike
- [ ] Monitor #buildinpublic tag
- [ ] Respond to all comments
- [ ] Screenshot top comments
- [ ] Thank supporters

## Demo Video Script

See `demo-script.md`

## Gallery Images

See `/assets/` folder:
1. Dashboard overview
2. Anomaly incident detail
3. Health scores
4. Kubernetes Helm install
5. WordPress plugin
6. Alert channels

