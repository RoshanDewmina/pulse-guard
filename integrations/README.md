# Saturn Integrations

This directory contains integrations for the Saturn monitoring platform, allowing you to monitor various systems and platforms.

## Available Integrations

### 1. Kubernetes Sidecar Container

A lightweight Go-based sidecar container that can be deployed alongside Kubernetes CronJobs to monitor their execution.

**Location**: `k8s-sidecar/`

**Features**:
- Monitors Kubernetes Job status
- Sends pings to Saturn API
- Captures job output and logs
- Handles different job states (success, failed, running, pending)
- Rate limiting and error handling

**Usage**:
```bash
# Build the container
cd k8s-sidecar
docker build -t saturn-sh/k8s-sidecar:latest .

# Run with environment variables
docker run -e SATURN_MONITOR_TOKEN=your-token \
           -e JOB_NAME=my-job \
           -e NAMESPACE=default \
           saturn-sh/k8s-sidecar:latest
```

### 2. Kubernetes Helm Chart

A Helm chart for easily deploying monitored CronJobs in Kubernetes.

**Location**: `k8s-helm-chart/`

**Features**:
- Deploys CronJob with Saturn sidecar
- Configurable job schedules and resources
- RBAC permissions for monitoring
- Security contexts and best practices

**Usage**:
```bash
# Add the chart repository (when published)
helm repo add saturn https://charts.saturn.sh
helm repo update

# Install a monitored CronJob
helm install my-monitored-job saturn/saturn-monitor \
  --set saturn.token=your-token \
  --set job.schedule="0 2 * * *" \
  --set container.image.repository=my-app \
  --set container.image.tag=latest
```

### 3. WordPress Plugin

A WordPress plugin that monitors WordPress cron jobs and sends status updates to Saturn.

**Location**: `wordpress-plugin/`

**Features**:
- Monitors WordPress cron status
- Detects disabled or stuck cron jobs
- Configurable check intervals
- Admin interface for configuration
- Test connection functionality

**Installation**:
1. Upload the plugin files to `/wp-content/plugins/saturn-monitor/`
2. Activate the plugin through the WordPress admin
3. Configure your Saturn monitor token in Settings > Saturn Monitor

## Integration Status

### ✅ Implemented
- Kubernetes sidecar container (Go)
- Kubernetes Helm chart
- WordPress plugin

### 🚧 Coming Soon
- Terraform provider
- GitHub Actions integration
- GitLab CI integration
- Docker Compose integration

## Development

### Prerequisites
- Go 1.21+ (for Kubernetes sidecar)
- Docker (for container builds)
- Helm 3.x (for Kubernetes chart)
- WordPress 5.0+ (for WordPress plugin)

### Building

#### Kubernetes Sidecar
```bash
cd k8s-sidecar
go mod tidy
go build -o sidecar main.go
```

#### Helm Chart
```bash
cd k8s-helm-chart
helm lint .
helm package .
```

### Testing

#### Kubernetes Sidecar
```bash
cd k8s-sidecar
go test ./...
```

#### WordPress Plugin
1. Install in WordPress development environment
2. Configure with test Saturn token
3. Test cron monitoring functionality

## Configuration

### Environment Variables

#### Kubernetes Sidecar
- `SATURN_URL`: Saturn API URL (default: https://api.saturn.sh)
- `SATURN_MONITOR_TOKEN`: Your monitor token (required)
- `JOB_NAME`: Kubernetes Job name (required)
- `NAMESPACE`: Kubernetes namespace (default: default)
- `CHECK_INTERVAL`: Check interval in seconds (default: 30)
- `TIMEOUT`: Request timeout in seconds (default: 300)

#### WordPress Plugin
- Configure through WordPress admin interface
- Settings stored in WordPress options table
- No environment variables required

## API Integration

All integrations use the Saturn API `/api/ping` endpoint:

```json
{
  "token": "your-monitor-token",
  "status": "success|failed|warning",
  "durationMs": 1500,
  "exitCode": 0,
  "output": "Job completed successfully",
  "timestamp": "2023-01-01T00:00:00Z"
}
```

## Security Considerations

- Monitor tokens should be stored securely
- Use Kubernetes secrets for sensitive data
- Enable RBAC for Kubernetes integrations
- Regular security updates for dependencies

## Support

For issues and questions:
- GitHub Issues: https://github.com/saturn-sh/pulse-guard/issues
- Documentation: https://docs.saturn.sh
- Support: support@saturn.sh