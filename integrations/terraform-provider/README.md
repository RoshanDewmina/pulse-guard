# Terraform Provider for Saturn

Infrastructure-as-Code for Saturn monitoring platform. Manage monitors, integrations, alert rules, and status pages with Terraform.

## Features

- 🖥️ **Monitor Management**: Create and configure monitors for cron jobs and scheduled tasks
- 🔔 **Alert Rules**: Define alert routing and notification logic
- 🔗 **Integrations**: Configure Slack, email, webhooks, and more
- 📊 **Status Pages**: Manage public-facing status pages
- 🔄 **Import Existing Resources**: Import existing Saturn resources into Terraform
- 🧪 **Fully Tested**: Comprehensive acceptance tests

## Requirements

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [Go](https://golang.org/doc/install) >= 1.21 (for development)
- Saturn account and API key

## Installation

### Via Terraform Registry (Recommended)

```hcl
terraform {
  required_providers {
    saturn = {
      source  = "saturn/saturn"
      version = "~> 1.0"
    }
  }
}

provider "saturn" {
  api_key = var.saturn_api_key
}
```

### Via Local Build (Development)

```bash
git clone https://github.com/saturn/terraform-provider-saturn
cd terraform-provider-saturn
go build -o terraform-provider-saturn
mkdir -p ~/.terraform.d/plugins/saturn.co/saturn/saturn/1.0.0/$(go env GOOS)_$(go env GOARCH)
mv terraform-provider-saturn ~/.terraform.d/plugins/saturn.co/saturn/saturn/1.0.0/$(go env GOOS)_$(go env GOARCH)/
```

## Authentication

The provider requires an API key for authentication. You can obtain one from your Saturn dashboard at https://saturn.co/app/settings/api-keys.

### Option 1: Provider Configuration
```hcl
provider "saturn" {
  api_key = "sk_live_your_api_key_here"
}
```

### Option 2: Environment Variable (Recommended)
```bash
export SATURN_API_KEY="sk_live_your_api_key_here"
terraform plan
```

### Option 3: Terraform Variables
```hcl
variable "saturn_api_key" {
  description = "Saturn API Key"
  type        = string
  sensitive   = true
}

provider "saturn" {
  api_key = var.saturn_api_key
}
```

Then set via:
```bash
export TF_VAR_saturn_api_key="sk_live_your_api_key_here"
# or
terraform plan -var="saturn_api_key=sk_live_your_api_key_here"
```

## Usage Examples

### Basic Monitor

```hcl
resource "saturn_monitor" "daily_backup" {
  name          = "Daily Database Backup"
  schedule_type = "CRON"
  cron_expr     = "0 2 * * *"  # 2 AM daily
  timezone      = "UTC"
  grace_sec     = 300  # 5 minutes
}
```

### Interval-Based Monitor

```hcl
resource "saturn_monitor" "api_health" {
  name          = "API Health Check"
  schedule_type = "INTERVAL"
  interval_sec  = 300  # Every 5 minutes
  grace_sec     = 60
  
  tags = ["production", "api"]
}
```

### Slack Integration

```hcl
resource "saturn_integration" "slack" {
  type  = "SLACK"
  label = "Engineering Alerts"
  
  config = {
    webhook_url = "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
    channel     = "#alerts"
  }
}
```

### Alert Rule

```hcl
resource "saturn_alert_rule" "critical" {
  name        = "Critical Monitors"
  monitor_ids = [
    saturn_monitor.daily_backup.id,
    saturn_monitor.api_health.id,
  ]
  channel_ids = [
    saturn_integration.slack.id,
  ]
  suppress_minutes = 30
  only_when_all_fail = false
}
```

### Status Page

```hcl
resource "saturn_status_page" "public" {
  title     = "Service Status"
  slug      = "status"
  is_public = true
  
  components = [
    {
      name        = "API"
      description = "Core API Services"
      monitor_ids = [saturn_monitor.api_health.id]
    }
  ]
  
  theme = {
    primary_color    = "#10B981"
    background_color = "#FFFFFF"
    text_color       = "#1F2937"
  }
}
```

## Resource Documentation

### `saturn_monitor`

Manages a monitor for tracking scheduled jobs.

#### Arguments

- `name` (Required, String) - Monitor name
- `schedule_type` (Required, String) - Either `INTERVAL` or `CRON`
- `interval_sec` (Optional, Int) - Interval in seconds (required if `schedule_type` is `INTERVAL`)
- `cron_expr` (Optional, String) - Cron expression (required if `schedule_type` is `CRON`)
- `timezone` (Optional, String) - Timezone for cron schedules (default: `UTC`)
- `grace_sec` (Optional, Int) - Grace period before marking as missed (default: `300`)
- `tags` (Optional, List[String]) - Tags for organization

#### Attributes

- `id` (String) - Monitor ID
- `token` (String) - Ping token for this monitor

#### Import

```bash
terraform import saturn_monitor.example mon_1234567890
```

### `saturn_integration`

Manages notification channels.

#### Arguments

- `type` (Required, String) - Integration type: `EMAIL`, `SLACK`, `DISCORD`, `WEBHOOK`, `PAGERDUTY`
- `label` (Required, String) - Human-readable label
- `config` (Required, Map) - Type-specific configuration

#### Type-Specific Config

**EMAIL:**
```hcl
config = {
  email = "alerts@example.com"
}
```

**SLACK:**
```hcl
config = {
  webhook_url = "https://hooks.slack.com/..."
  channel     = "#alerts"
}
```

**WEBHOOK:**
```hcl
config = {
  url    = "https://api.example.com/webhook"
  method = "POST"
}
```

### `saturn_alert_rule`

Manages alert routing rules.

#### Arguments

- `name` (Required, String) - Rule name
- `monitor_ids` (Required, List[String]) - Monitors to watch (empty = all monitors)
- `channel_ids` (Required, List[String]) - Channels to notify
- `suppress_minutes` (Optional, Int) - Suppress duplicate alerts for N minutes
- `only_when_all_fail` (Optional, Bool) - Only alert when all monitors fail (default: `false`)

### `saturn_status_page`

Manages public status pages.

#### Arguments

- `title` (Required, String) - Page title
- `slug` (Required, String) - URL slug (must be unique)
- `is_public` (Optional, Bool) - Public visibility (default: `true`)
- `custom_domain` (Optional, String) - Custom domain (e.g., `status.example.com`)
- `components` (Optional, List[Object]) - Component definitions
- `theme` (Optional, Object) - Theme customization

#### Component Object

```hcl
{
  name        = "API"
  description = "Core API endpoints"
  monitor_ids = ["mon_123", "mon_456"]
}
```

#### Theme Object

```hcl
{
  primary_color    = "#10B981"
  background_color = "#FFFFFF"
  text_color       = "#1F2937"
  logo_url         = "https://example.com/logo.png"
}
```

## Data Sources

### `saturn_monitor`

Retrieve information about an existing monitor.

```hcl
data "saturn_monitor" "existing" {
  id = "mon_1234567890"
}

output "monitor_name" {
  value = data.saturn_monitor.existing.name
}
```

## Advanced Examples

### Multi-Environment Setup

```hcl
locals {
  environments = ["staging", "production"]
}

resource "saturn_monitor" "api_health" {
  for_each = toset(local.environments)
  
  name          = "${each.key}-api-health"
  schedule_type = "INTERVAL"
  interval_sec  = each.key == "production" ? 60 : 300
  grace_sec     = 60
  
  tags = [each.key, "api"]
}
```

### Modular Configuration

**modules/monitoring/main.tf:**
```hcl
variable "monitors" {
  type = map(object({
    schedule_type = string
    cron_expr     = optional(string)
    interval_sec  = optional(number)
    grace_sec     = number
  }))
}

resource "saturn_monitor" "monitors" {
  for_each = var.monitors
  
  name          = each.key
  schedule_type = each.value.schedule_type
  cron_expr     = each.value.cron_expr
  interval_sec  = each.value.interval_sec
  grace_sec     = each.value.grace_sec
}
```

**main.tf:**
```hcl
module "monitoring" {
  source = "./modules/monitoring"
  
  monitors = {
    "daily-backup" = {
      schedule_type = "CRON"
      cron_expr     = "0 2 * * *"
      grace_sec     = 300
    }
    "api-health" = {
      schedule_type = "INTERVAL"
      interval_sec  = 300
      grace_sec     = 60
    }
  }
}
```

## Development

### Building the Provider

```bash
go build -o terraform-provider-saturn
```

### Running Tests

```bash
# Unit tests
go test ./...

# Acceptance tests (requires Saturn account)
export SATURN_API_KEY="sk_test_..."
export TF_ACC=1
go test ./... -v -timeout 120m
```

### Debugging

Set `TF_LOG=DEBUG` for verbose Terraform logging:

```bash
export TF_LOG=DEBUG
export TF_LOG_PATH=./terraform.log
terraform plan
```

## Troubleshooting

### Authentication Errors

```
Error: Failed to configure Saturn provider: API key not found
```

**Solution:** Ensure `SATURN_API_KEY` is set or provided in the provider block.

### Rate Limiting

```
Error: API request failed with status 429: Too Many Requests
```

**Solution:** Reduce Terraform concurrency or wait before retrying:

```bash
terraform plan -parallelism=1
```

### Import Errors

```
Error: Cannot import non-existent remote object
```

**Solution:** Verify the resource ID exists in Saturn:

```bash
curl -H "Authorization: Bearer $SATURN_API_KEY" \
  https://saturn.co/api/monitors/mon_123
```

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Adding New Resources

1. Create resource file: `internal/provider/resource_name_resource.go`
2. Implement CRUD methods
3. Add to provider's `Resources()` function
4. Add tests in `resource_name_resource_test.go`
5. Document in `docs/resources/name.md`

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

- 📧 Email: support@saturn.co
- 💬 Slack: [Saturn Community](https://saturn.co/slack)
- 📖 Docs: https://docs.saturn.co/terraform
- 🐛 Issues: https://github.com/saturn/terraform-provider-saturn/issues

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history.

---

**Built with ❤️ by the Saturn team**

