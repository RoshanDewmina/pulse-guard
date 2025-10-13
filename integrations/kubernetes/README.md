# Tokiflow Kubernetes Integration

Zero-code monitoring for Kubernetes CronJobs. Add the Tokiflow sidecar to your CronJobs and get instant monitoring with automatic start/success/fail pings.

## Features

- ✅ **Zero-code monitoring** - No changes to your job code
- ✅ **Automatic pings** - Sidecar handles start/success/fail states
- ✅ **Output capture** - Optionally capture job logs
- ✅ **Exit code tracking** - Automatic failure detection
- ✅ **Duration tracking** - Measure job performance
- ✅ **Easy deployment** - Helm chart or kubectl apply

## Quick Start (Helm)

### 1. Install Helm Chart

```bash
# Add Tokiflow Helm repository
helm repo add tokiflow https://charts.tokiflow.co
helm repo update

# Create values file
cat > my-cronjob-values.yaml <<EOF
tokiflow:
  token: "tf_your_monitor_token_here"
  apiUrl: "https://api.tokiflow.co"
  captureOutput: true

cronjob:
  name: backup-job
  schedule: "0 3 * * *"
  container:
    name: backup
    image: your-backup-image:latest
    command: ["/bin/sh"]
    args: ["-c", "/scripts/backup.sh"]
EOF

# Install
helm install my-backup tokiflow/tokiflow-monitor \
  -f my-cronjob-values.yaml \
  -n your-namespace
```

### 2. Verify Deployment

```bash
# Check CronJob
kubectl get cronjobs -n your-namespace

# Check if monitor is receiving pings
# Visit Tokiflow dashboard to see runs
```

## Quick Start (kubectl)

### 1. Create Secret with Token

```bash
kubectl create secret generic tokiflow-token \
  --from-literal=token=tf_your_token_here \
  -n your-namespace
```

### 2. Apply RBAC

```bash
kubectl apply -f - <<EOF
apiVersion: v1
kind: ServiceAccount
metadata:
  name: tokiflow-monitor
  namespace: your-namespace
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tokiflow-monitor
  namespace: your-namespace
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list", "watch"]
- apiGroups: [""]
  resources: ["pods/log"]
  verbs: ["get"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: tokiflow-monitor
  namespace: your-namespace
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: tokiflow-monitor
subjects:
- kind: ServiceAccount
  name: tokiflow-monitor
  namespace: your-namespace
EOF
```

### 3. Add Sidecar to Existing CronJob

Add the sidecar container to your CronJob:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: your-cronjob
spec:
  schedule: "0 3 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          serviceAccountName: tokiflow-monitor
          containers:
          # Your existing main container
          - name: main
            image: your-image
            # ... your config ...
          
          # Add Tokiflow sidecar
          - name: tokiflow-sidecar
            image: tokiflow/k8s-sidecar:1.0.0
            env:
            - name: PULSEGUARD_TOKEN
              valueFrom:
                secretKeyRef:
                  name: tokiflow-token
                  key: token
            - name: PULSEGUARD_API
              value: "https://api.tokiflow.co"
            - name: CRONJOB_NAME
              value: "your-cronjob"
            - name: NAMESPACE
              valueFrom:
                fieldRef:
                  fieldPath: metadata.namespace
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: MAIN_CONTAINER_NAME
              value: "main"
            - name: CAPTURE_OUTPUT
              value: "true"
            resources:
              limits:
                cpu: 100m
                memory: 128Mi
              requests:
                cpu: 50m
                memory: 64Mi
```

## How It Works

1. **Job Starts**: Sidecar sends `start` ping to Tokiflow
2. **Job Runs**: Main container executes your job
3. **Sidecar Waits**: Monitors main container status
4. **Job Completes**: Sidecar detects exit code
5. **Final Ping**: Sends `success` or `fail` with duration and exit code
6. **Optional**: Captures last 10KB of logs if `CAPTURE_OUTPUT=true`

## Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PULSEGUARD_TOKEN` | ✅ Yes | - | Monitor token from dashboard |
| `PULSEGUARD_API` | No | `https://api.tokiflow.co` | API endpoint |
| `CRONJOB_NAME` | No | `unknown-cronjob` | CronJob name for identification |
| `NAMESPACE` | No | `default` | Kubernetes namespace |
| `POD_NAME` | No | Auto-detected | Pod name |
| `MAIN_CONTAINER_NAME` | No | `main` | Name of main container to monitor |
| `CAPTURE_OUTPUT` | No | `false` | Capture job output |
| `MAX_OUTPUT_BYTES` | No | `10240` | Maximum output size (bytes) |

### Helm Values

See `values.yaml` for all configuration options.

## Building the Sidecar Image

### Local Build

```bash
cd integrations/kubernetes/sidecar

# Build
docker build -t tokiflow/k8s-sidecar:1.0.0 .

# Push to your registry
docker tag tokiflow/k8s-sidecar:1.0.0 your-registry/tokiflow-sidecar:1.0.0
docker push your-registry/tokiflow-sidecar:1.0.0
```

### Build with Go

```bash
cd integrations/kubernetes/sidecar

# Build binary
go build -o tokiflow-sidecar .

# Test locally
export PULSEGUARD_TOKEN=tf_your_token
export PULSEGUARD_API=http://localhost:3000
./tokiflow-sidecar
```

## Examples

See `examples/` directory for:
- `basic-cronjob-with-sidecar.yaml` - Complete example with RBAC
- `helm-example-values.yaml` - Helm chart configuration examples

## Troubleshooting

### Sidecar Not Sending Pings

1. Check token is correct:
   ```bash
   kubectl get secret tokiflow-token -o yaml
   ```

2. Check sidecar logs:
   ```bash
   kubectl logs <pod-name> -c tokiflow-sidecar
   ```

3. Verify network connectivity:
   ```bash
   kubectl exec <pod-name> -c tokiflow-sidecar -- curl https://api.tokiflow.co
   ```

### Permission Errors

Ensure RBAC is properly configured:
```bash
kubectl describe serviceaccount tokiflow-monitor
kubectl describe role tokiflow-monitor
kubectl describe rolebinding tokiflow-monitor
```

### Output Not Captured

- Ensure `CAPTURE_OUTPUT=true` in sidecar env
- Check main container has logs: `kubectl logs <pod> -c main`
- Verify sidecar has permission to read logs

## Security Considerations

- **Minimal permissions**: Sidecar only needs pod read and log access
- **Non-root user**: Sidecar runs as UID 1000
- **Secret management**: Token stored in Kubernetes Secret
- **Network isolation**: Only connects to Tokiflow API
- **Output redaction**: Sensitive data automatically redacted

## Advanced Usage

### Multiple CronJobs

Monitor multiple CronJobs by installing the chart multiple times:

```bash
helm install backup-monitor tokiflow/tokiflow-monitor -f backup-values.yaml
helm install sync-monitor tokiflow/tokiflow-monitor -f sync-values.yaml
```

### Custom API Endpoint (Self-Hosted)

```yaml
tokiflow:
  apiUrl: "https://tokiflow.yourcompany.com"
  token: "tf_your_token"
```

### Different Schedules

```yaml
cronjob:
  schedule: "*/15 * * * *"  # Every 15 minutes
  # or
  schedule: "0 */6 * * *"   # Every 6 hours
  # or
  schedule: "0 0 * * 0"     # Weekly on Sunday
```

## Support

- **Documentation**: https://docs.tokiflow.co/kubernetes
- **Issues**: https://github.com/tokiflow/tokiflow/issues
- **Email**: support@tokiflow.co

## License

Copyright © 2025 Tokiflow. All rights reserved.





