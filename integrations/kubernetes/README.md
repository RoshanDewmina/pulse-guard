# Saturn Kubernetes Integration

Automatically monitor Kubernetes CronJobs with Saturn. No code changes required!

## Features

- 🔄 **Auto-Discovery**: Automatically detects and monitors CronJobs
- 🏷️ **Annotation-Based**: Simple opt-in via Kubernetes annotations
- ⚡ **Zero Overhead**: Lightweight agent with minimal resource usage
- 🔒 **Secure**: Follows Kubernetes RBAC best practices
- 📦 **Helm Chart**: Easy installation and configuration
- 🎯 **Sidecar Pattern**: Optional sidecar for advanced use cases

## Quick Start

### 1. Install via Helm

```bash
# Add Saturn Helm repository
helm repo add saturn https://charts.saturn.co
helm repo update

# Install the agent
helm install saturn-agent saturn/saturn-agent \
  --set saturn.apiKey="sk_live_your_api_key_here" \
  --namespace saturn-system \
  --create-namespace
```

### 2. Enable Monitoring for a CronJob

Add the `saturn.co/enabled` annotation to your CronJob:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: daily-backup
  annotations:
    saturn.co/enabled: "true"
    saturn.co/grace-sec: "300"  # Optional: grace period in seconds
    saturn.co/tags: "production,backup"  # Optional: custom tags
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: myapp/backup:latest
            # Your job configuration...
```

### 3. Verify

Check that the monitor was created:

```bash
kubectl get cronjob daily-backup -o yaml | grep saturn.co/monitor-id
```

You should see an annotation like:
```yaml
annotations:
  saturn.co/monitor-id: "mon_abc123xyz"
```

That's it! Your CronJob is now monitored by Saturn.

## Installation Options

### Helm (Recommended)

**Basic Installation:**
```bash
helm install saturn-agent saturn/saturn-agent \
  --set saturn.apiKey="sk_live_..." \
  --namespace saturn-system \
  --create-namespace
```

**With Custom Configuration:**
```bash
helm install saturn-agent saturn/saturn-agent \
  --namespace saturn-system \
  --create-namespace \
  --values custom-values.yaml
```

**custom-values.yaml:**
```yaml
saturn:
  apiKey: "sk_live_..."
  endpoint: "https://saturn.co"

agent:
  namespace: "production"  # Only watch this namespace
  syncPeriod: "5m"
  verbosity: 2

resources:
  limits:
    cpu: 200m
    memory: 256Mi
  requests:
    cpu: 100m
    memory: 128Mi
```

### Using Existing Secret

If you already have a secret with your API key:

```bash
kubectl create secret generic saturn-api-key \
  --from-literal=api-key="sk_live_..." \
  --namespace saturn-system

helm install saturn-agent saturn/saturn-agent \
  --set saturn.existingSecret=saturn-api-key \
  --namespace saturn-system \
  --create-namespace
```

### Raw Kubernetes Manifests

See [manifests/](./manifests/) directory for raw YAML files.

## Configuration

### Annotations

Annotate your CronJobs to control Saturn monitoring:

| Annotation | Required | Default | Description |
|------------|----------|---------|-------------|
| `saturn.co/enabled` | Yes | - | Set to `"true"` to enable monitoring |
| `saturn.co/monitor-id` | No | Auto-generated | Monitor ID (set automatically by agent) |
| `saturn.co/grace-sec` | No | `300` | Grace period before marking as missed (seconds) |
| `saturn.co/tags` | No | - | Comma-separated tags for organization |

**Example:**
```yaml
metadata:
  annotations:
    saturn.co/enabled: "true"
    saturn.co/grace-sec: "600"  # 10 minutes
    saturn.co/tags: "production,critical,database"
```

### Agent Configuration

Configure the agent via Helm values:

```yaml
agent:
  # Watch specific namespace (empty = all namespaces)
  namespace: "production"
  
  # How often to perform full reconciliation
  syncPeriod: "5m"
  
  # Log verbosity (0-10, higher = more verbose)
  verbosity: 2
```

### RBAC

The agent requires the following permissions:

```yaml
rules:
- apiGroups: ["batch"]
  resources: ["cronjobs"]
  verbs: ["get", "list", "watch", "update", "patch"]
- apiGroups: ["batch"]
  resources: ["jobs"]
  verbs: ["get", "list", "watch"]
```

These are created automatically when `rbac.create: true` (default).

## Advanced Usage

### Sidecar Pattern

For more control, use the sidecar pattern:

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: advanced-job
  annotations:
    saturn.co/enabled: "true"
spec:
  schedule: "*/15 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          initContainers:
          # Send start ping
          - name: saturn-start
            image: curlimages/curl:latest
            command:
            - sh
            - -c
            - |
              MONITOR_TOKEN=$(cat /saturn/token)
              curl -X POST "https://saturn.co/api/ping/${MONITOR_TOKEN}?state=start"
            volumeMounts:
            - name: saturn-token
              mountPath: /saturn
              readOnly: true
          
          containers:
          # Your main container
          - name: main
            image: myapp:latest
            command: ["/app/run.sh"]
          
          # Send completion ping
          - name: saturn-complete
            image: curlimages/curl:latest
            command:
            - sh
            - -c
            - |
              # Wait for main container
              while [ ! -f /shared/done ]; do sleep 1; done
              
              MONITOR_TOKEN=$(cat /saturn/token)
              EXIT_CODE=$(cat /shared/exit-code)
              DURATION=$(cat /shared/duration-ms)
              
              if [ $EXIT_CODE -eq 0 ]; then
                STATE="success"
              else
                STATE="fail"
              fi
              
              curl -X POST "https://saturn.co/api/ping/${MONITOR_TOKEN}?state=${STATE}&exitCode=${EXIT_CODE}&durationMs=${DURATION}"
            volumeMounts:
            - name: saturn-token
              mountPath: /saturn
              readOnly: true
            - name: shared
              mountPath: /shared
          
          volumes:
          - name: saturn-token
            secret:
              secretName: saturn-monitor-token-advanced-job
          - name: shared
            emptyDir: {}
```

See [sidecar/](./sidecar/) directory for more examples.

### Multi-Cluster Setup

Deploy the agent in each cluster:

```bash
# Cluster 1
kubectl config use-context cluster1
helm install saturn-agent saturn/saturn-agent \
  --set saturn.apiKey="sk_live_..." \
  --set agent.namespace="production" \
  --namespace saturn-system \
  --create-namespace

# Cluster 2
kubectl config use-context cluster2
helm install saturn-agent saturn/saturn-agent \
  --set saturn.apiKey="sk_live_..." \
  --set agent.namespace="production" \
  --namespace saturn-system \
  --create-namespace
```

Tag monitors to identify which cluster they're from:
```yaml
annotations:
  saturn.co/tags: "cluster:us-east-1,production"
```

### Namespace Isolation

Watch only specific namespaces:

```bash
# Watch only production namespace
helm install saturn-agent-prod saturn/saturn-agent \
  --set saturn.apiKey="sk_live_..." \
  --set agent.namespace="production" \
  --namespace saturn-system

# Watch only staging namespace (separate deployment)
helm install saturn-agent-staging saturn/saturn-agent \
  --set saturn.apiKey="sk_live_..." \
  --set agent.namespace="staging" \
  --namespace saturn-system
```

## Troubleshooting

### Agent Logs

```bash
kubectl logs -n saturn-system deployment/saturn-agent -f
```

### Check Agent Status

```bash
kubectl get pods -n saturn-system
kubectl describe pod -n saturn-system -l app.kubernetes.io/name=saturn-agent
```

### Verify RBAC

```bash
kubectl auth can-i get cronjobs --as=system:serviceaccount:saturn-system:saturn-agent -A
kubectl auth can-i update cronjobs --as=system:serviceaccount:saturn-system:saturn-agent -A
```

### Common Issues

**Issue: CronJob not monitored**

Check if the annotation is present:
```bash
kubectl get cronjob <name> -o yaml | grep saturn.co
```

Ensure the annotation is `saturn.co/enabled: "true"` (string, not boolean).

**Issue: Permission denied**

Ensure RBAC is properly configured:
```bash
helm upgrade saturn-agent saturn/saturn-agent \
  --set rbac.create=true \
  --reuse-values
```

**Issue: API key invalid**

Verify the secret:
```bash
kubectl get secret -n saturn-system saturn-agent -o jsonpath='{.data.api-key}' | base64 -d
```

## Uninstallation

```bash
# Remove the agent
helm uninstall saturn-agent --namespace saturn-system

# (Optional) Remove the namespace
kubectl delete namespace saturn-system
```

**Note:** Monitors in Saturn will remain. Delete them manually if needed:
```bash
# Via Saturn CLI
saturn monitors delete --tag kubernetes

# Or via Dashboard
https://saturn.co/app/monitors
```

## Development

### Building the Agent

```bash
cd agent/
go build -o saturn-k8s-agent .
```

### Running Locally

```bash
# Ensure you have kubeconfig set up
export SATURN_API_KEY="sk_live_..."
./saturn-k8s-agent --kubeconfig ~/.kube/config --namespace default
```

### Testing

```bash
go test ./...
```

### Building Docker Image

```bash
docker build -t saturn/k8s-agent:latest .
docker push saturn/k8s-agent:latest
```

## Examples

See [examples/](./examples/) directory for:
- Basic CronJob with annotations
- Advanced sidecar pattern
- Multi-container jobs
- Output capture
- Custom error handling

## Architecture

```
┌─────────────────────────────────────────────────┐
│           Kubernetes Cluster                     │
│                                                  │
│  ┌─────────────┐          ┌──────────────┐     │
│  │  CronJob    │          │ Saturn Agent │     │
│  │  (annotated)│          │  Deployment  │     │
│  └──────┬──────┘          └───────┬──────┘     │
│         │                         │             │
│         │  1. Watch              │             │
│         │◄────────────────────────┘             │
│         │                                       │
│         │  2. Create/Update Monitor             │
│         └────────────────────────┐              │
│                                  │              │
└──────────────────────────────────┼──────────────┘
                                   │
                                   │ 3. API Call
                                   ▼
                          ┌─────────────────┐
                          │  Saturn API     │
                          │  (saturn.co)    │
                          └─────────────────┘
```

**Flow:**
1. Agent watches CronJobs with `saturn.co/enabled` annotation
2. When detected, agent creates/updates monitor in Saturn
3. Agent stores monitor ID back to CronJob annotation
4. CronJob sends pings to Saturn using monitor token

## Security

### Best Practices

1. **Use Namespace-Scoped Deployment**: Limit agent to specific namespaces
2. **Rotate API Keys**: Regularly rotate Saturn API keys
3. **Use Secrets Management**: Never commit API keys to git
4. **Enable Pod Security**: Use pod security standards/policies
5. **Resource Limits**: Always set resource limits for the agent

### Sealed Secrets

For GitOps workflows, use sealed secrets:

```bash
# Create secret
kubectl create secret generic saturn-api-key \
  --from-literal=api-key="sk_live_..." \
  --dry-run=client -o yaml | \
  kubeseal --controller-name=sealed-secrets -o yaml > sealed-secret.yaml

# Commit sealed-secret.yaml to git
git add sealed-secret.yaml
```

## License

MIT License - see LICENSE for details

## Support

- 📧 Email: support@saturn.co
- 💬 Slack: [Saturn Community](https://saturn.co/slack)
- 📖 Docs: https://docs.saturn.co/kubernetes
- 🐛 Issues: https://github.com/saturn/k8s-agent/issues

---

**Built with ❤️ by the Saturn team**
