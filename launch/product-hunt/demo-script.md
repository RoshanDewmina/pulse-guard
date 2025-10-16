# Saturn - Demo Video Script (60 seconds, no voice)

## Scene 1: The Problem (0-10s)
**Visual**: Traditional cron monitoring dashboard showing all green checkmarks  
**Caption**: "Your backups succeed every night. But something's wrong..."  
**Overlay**: Chart showing duration creeping from 10min → 15min → 30min → 45min  
**Caption**: "Traditional monitors only see ✅ Success"

## Scene 2: The Insight (10-20s)
**Visual**: Saturn dashboard with anomaly alert highlighted  
**Caption**: "Saturn uses statistical analysis to catch issues early"  
**Overlay**: Z-Score calculation: `(45min - 12min) / 2.1min = 15.7σ`  
**Caption**: "Job ran 15x slower than normal — alert sent 2 days before failure"

## Scene 3: Kubernetes (20-30s)
**Visual**: Terminal showing Helm install  
**Code**:
```bash
helm install backup saturn/saturn-monitor \
  --set saturn.token=<TOKEN> \
  --set cronjob.schedule="0 3 * * *"
```
**Caption**: "Zero-code Kubernetes monitoring"  
**Visual**: CronJob pod with sidecar, arrows showing ping flow

## Scene 4: WordPress (30-40s)
**Visual**: WordPress admin with Saturn health widget  
**Caption**: "Native wp-cron monitoring for agencies"  
**Visual**: Grid of 50 sites, all showing health scores (A-F)  
**Caption**: "Manage 1000+ sites from one dashboard"

## Scene 5: Analytics (40-50s)
**Visual**: Health score dashboard  
**Metrics displayed**:
- Overall Health: 87 (B+)
- MTTR: 13 minutes
- MTBF: 15 days
- P95 Duration: 12.3 minutes
**Caption**: "Advanced reliability metrics"

## Scene 6: CTA (50-60s)
**Visual**: Saturn homepage  
**Text**: 
```
Start monitoring in 60 seconds
→ Free tier: 10 monitors
→ Kubernetes | WordPress | Linux
→ saturn.example.com
```
**Final frame**: Logo + "Stop guessing. Start knowing."

