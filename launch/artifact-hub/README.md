# Saturn Helm Chart - Artifact Hub Distribution

Complete Artifact Hub listing assets for the Saturn Kubernetes monitoring chart.

## Quick Start

### Install Saturn for Kubernetes CronJobs

```bash
helm repo add saturn https://charts.saturn.example.com
helm repo update
helm install my-cronjob saturn/saturn-monitor \
  --set saturn.token=<ORG_TOKEN> \
  --set cronjob.schedule="0 3 * * *" \
  --set cronjob.container.image="your-image:latest"
```

## Overview

Saturn provides **zero-code monitoring** for Kubernetes CronJobs using a sidecar pattern. The Helm chart deploys a CronJob with two containers:

1. **Main container**: Your job logic (backup, ETL, cleanup, etc.)
2. **Saturn sidecar**: Monitoring that sends start/success/fail pings automatically

### Key Features

- ✅ **Zero code changes** — wrap any existing container
- ✅ **Anomaly detection** — catch performance issues before failures
- ✅ **Output capture** — stdout/stderr saved with configurable limits
- ✅ **Health scoring** — A-F grades based on reliability
- ✅ **Multi-channel alerts** — Email, Slack, Discord, Webhooks
- ✅ **MTTR/MTBF tracking** — reliability metrics over time

## Prerequisites

- Kubernetes 1.19+ cluster
- Helm 3.x
- Saturn account and organization token ([sign up free](https://saturn.example.com))

## Installation

### 1. Add Helm Repository

```bash
helm repo add saturn https://charts.saturn.example.com
helm repo update
```

### 2. Create values.yaml

```yaml
saturn:
  token: "<ORG_TOKEN>"  # Get from Settings → Tokens
  apiUrl: "https://api.saturn.example.com"
  captureOutput: true
  maxOutputBytes: 10240  # 10KB

cronjob:
  name: nightly-backup
  schedule: "0 3 * * *"
  timezone: "America/New_York"
  
  container:
    name: backup
    image: backup-tool:v1.2.3
    command: ["/bin/bash"]
    args: ["-c", "./run-backup.sh"]
    
    env:
      - name: DB_HOST
        value: postgres.default.svc
      - name: BACKUP_PATH
        value: /backups
    
    resources:
      requests:
        cpu: "100m"
        memory: "128Mi"
      limits:
        cpu: "500m"
        memory: "512Mi"
  
  restartPolicy: OnFailure
  concurrencyPolicy: Forbid
```

### 3. Install Chart

```bash
helm install nightly-backup saturn/saturn-monitor -f values.yaml
```

### 4. Verify Deployment

```bash
# Check CronJob created
kubectl get cronjob nightly-backup

# View next scheduled run
kubectl get cronjob nightly-backup -o jsonpath='{.status.lastScheduleTime}'

# Trigger manual run
kubectl create job --from=cronjob/nightly-backup manual-test
```

## Configuration

### Values Reference

| Parameter | Description | Default |
|-----------|-------------|---------|
| `saturn.token` | Organization token (required) | `""` |
| `saturn.apiUrl` | Saturn API endpoint | `https://api.saturn.example.com` |
| `saturn.captureOutput` | Capture stdout/stderr | `true` |
| `saturn.maxOutputBytes` | Max output size in bytes | `10240` |
| `cronjob.name` | CronJob name | `saturn-monitor` |
| `cronjob.schedule` | Cron schedule expression | `"0 * * * *"` |
| `cronjob.timezone` | Timezone for schedule | `""` |
| `cronjob.container.name` | Main container name | `job` |
| `cronjob.container.image` | Container image | `""` |
| `cronjob.container.command` | Container command | `[]` |
| `cronjob.container.args` | Container arguments | `[]` |
| `cronjob.container.env` | Environment variables | `[]` |
| `cronjob.container.resources` | Resource requests/limits | See values.yaml |
| `cronjob.restartPolicy` | Pod restart policy | `OnFailure` |
| `cronjob.concurrencyPolicy` | Concurrency policy | `Forbid` |
| `cronjob.successfulJobsHistoryLimit` | Keep N successful jobs | `3` |
| `cronjob.failedJobsHistoryLimit` | Keep N failed jobs | `1` |

## How It Works

The sidecar monitors your main container:

```
┌─────────────────────────────────────┐
│ Kubernetes Pod                      │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │ Main         │  │ Saturn      │ │
│  │ Container    │  │ Sidecar     │ │
│  │              │  │             │ │
│  │ Your job     │  │ Monitors &  │ │
│  │ logic runs   │  │ sends pings │ │
│  └──────┬───────┘  └──────┬──────┘ │
│         │                 │        │
│         └─exit code/logs──┘        │
└─────────────────────────────────────┘
                    │
                    v
            Saturn API (incidents & alerts)
```

**Lifecycle**:

1. Pod starts → Sidecar sends **start ping**
2. Main container runs your job
3. Main container exits → Sidecar reads exit code & logs
4. Sidecar sends **success** (exit 0) or **fail** (exit ≠ 0) ping
5. Saturn analyzes duration, detects anomalies, creates incidents

## Examples

### Database Backup

```yaml
cronjob:
  schedule: "0 3 * * *"
  timezone: "UTC"
  container:
    image: postgres:15
    command: ["pg_dump"]
    args: 
      - "-h"
      - "postgres.default.svc"
      - "-U"
      - "backup_user"
      - "-f"
      - "/backups/db_$(date +%Y%m%d).sql"
    env:
      - name: PGPASSWORD
        valueFrom:
          secretKeyRef:
            name: postgres-credentials
            key: password
```

### ETL Pipeline

```yaml
cronjob:
  schedule: "*/15 * * * *"
  container:
    image: python:3.11-slim
    command: ["python"]
    args: ["/app/etl.py"]
    env:
      - name: DATA_SOURCE
        value: "https://api.example.com/data"
      - name: OUTPUT_BUCKET
        value: "s3://data-lake/processed"
```

### Log Rotation

```yaml
cronjob:
  schedule: "0 0 * * *"
  container:
    image: alpine:3.18
    command: ["sh", "-c"]
    args: 
      - |
        find /logs -name "*.log" -mtime +7 -delete
        echo "Cleaned logs older than 7 days"
    volumeMounts:
      - name: logs
        mountPath: /logs
```

## Troubleshooting

### CronJob Not Creating Jobs

```bash
# Check CronJob status
kubectl describe cronjob <name>

# Check for scheduling issues
kubectl get events --field-selector involvedObject.name=<name>
```

**Common causes**:
- Invalid schedule expression
- CronJob suspended (`spec.suspend: true`)
- Concurrency policy blocking new jobs

### Sidecar Not Sending Pings

```bash
# Check sidecar logs
kubectl logs <pod-name> -c saturn-sidecar

# Verify token is set
kubectl get cronjob <name> -o jsonpath='{.spec.jobTemplate.spec.template.spec.containers[1].env}'
```

**Common causes**:
- Invalid or missing token
- Network policy blocking egress to Saturn API
- API endpoint misconfigured

### Jobs Failing Immediately

```bash
# Check main container logs
kubectl logs <pod-name> -c <container-name>

# Check image pull status
kubectl describe pod <pod-name>
```

**Common causes**:
- Image pull errors (`ImagePullBackOff`)
- Missing secrets or config maps
- Insufficient resources (CPU/memory)

## Publishing to Artifact Hub

### 1. Host Chart Repository

**Option A: GitHub Pages**

```bash
# Package chart
helm package ./saturn-monitor

# Create or update index
helm repo index . --url https://charts.saturn.example.com

# Commit to gh-pages branch
git add saturn-monitor-*.tgz index.yaml artifacthub-repo.yml
git commit -m "Publish chart v1.0.0"
git push origin gh-pages
```

**Option B: S3 + CloudFront**

```bash
# Package and index
helm package ./saturn-monitor
helm repo index . --url https://charts.saturn.example.com

# Upload to S3
aws s3 cp saturn-monitor-*.tgz s3://charts-bucket/
aws s3 cp index.yaml s3://charts-bucket/
aws s3 cp artifacthub-repo.yml s3://charts-bucket/

# Invalidate CDN cache
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

### 2. Register with Artifact Hub

The `artifacthub-repo.yml` file must be in the **same directory** as your `index.yaml`:

```
https://charts.saturn.example.com/
├── index.yaml
├── artifacthub-repo.yml
└── saturn-monitor-1.0.0.tgz
```

Artifact Hub will automatically discover and index your charts within 30 minutes.

### 3. Verify Listing

After publishing:

1. Search for "Saturn" on [Artifact Hub](https://artifacthub.io)
2. Verify metadata appears correctly
3. Test installation instructions
4. Monitor download stats

## Sample index.yaml

```yaml
apiVersion: v1
entries:
  saturn-monitor:
    - apiVersion: v2
      appVersion: "1.0.0"
      created: "2025-10-15T00:00:00Z"
      description: Zero-code monitoring for Kubernetes CronJobs with anomaly detection
      digest: abc123def456...
      home: https://saturn.example.com
      icon: https://saturn.example.com/icon.png
      keywords:
        - monitoring
        - cronjob
        - cron
        - anomaly-detection
        - observability
      maintainers:
        - email: support@saturn.example.com
          name: Saturn Team
      name: saturn-monitor
      sources:
        - https://github.com/saturn/saturn
      urls:
        - https://charts.saturn.example.com/saturn-monitor-1.0.0.tgz
      version: 1.0.0
generated: "2025-10-15T00:00:00Z"
```

## Support

- **Documentation**: [docs.saturn.example.com](https://docs.saturn.example.com)
- **Issues**: [github.com/saturn/saturn/issues](https://github.com/saturn/saturn/issues)
- **Email**: support@saturn.example.com
- **Slack**: [saturn.slack.com](https://saturn.slack.com)

## License

Chart is Apache 2.0. Saturn service is proprietary.

