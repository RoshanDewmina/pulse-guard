terraform {
  required_providers {
    saturn = {
      source  = "saturn/saturn"
      version = "~> 1.0"
    }
  }
}

provider "saturn" {
  api_key  = var.saturn_api_key
  endpoint = "https://saturn.co"
}

# Create a monitor for a daily backup job
resource "saturn_monitor" "daily_backup" {
  name          = "Daily Database Backup"
  schedule_type = "CRON"
  cron_expr     = "0 2 * * *"  # Every day at 2 AM
  timezone      = "America/New_York"
  grace_sec     = 300  # 5 minute grace period
  
  tags = ["production", "database", "backup"]
}

# Create a monitor for an API health check
resource "saturn_monitor" "api_health_check" {
  name          = "API Health Check"
  schedule_type = "INTERVAL"
  interval_sec  = 300  # Every 5 minutes
  grace_sec     = 60   # 1 minute grace period
  
  tags = ["production", "api"]
}

# Create a Slack integration
resource "saturn_integration" "slack_alerts" {
  type  = "SLACK"
  label = "Engineering Slack"
  
  config = {
    webhook_url = var.slack_webhook_url
    channel     = "#alerts"
  }
}

# Create an alert rule
resource "saturn_alert_rule" "critical_monitors" {
  name        = "Critical System Alerts"
  monitor_ids = [
    saturn_monitor.daily_backup.id,
    saturn_monitor.api_health_check.id,
  ]
  channel_ids = [
    saturn_integration.slack_alerts.id,
  ]
  suppress_minutes = 30
}

# Create a status page
resource "saturn_status_page" "public_status" {
  title     = "Service Status"
  slug      = "service-status"
  is_public = true
  
  components = [
    {
      name        = "API"
      description = "Core API endpoints"
      monitor_ids = [saturn_monitor.api_health_check.id]
    },
    {
      name        = "Background Jobs"
      description = "Scheduled maintenance tasks"
      monitor_ids = [saturn_monitor.daily_backup.id]
    }
  ]
  
  theme = {
    primary_color     = "#3B82F6"
    background_color  = "#FFFFFF"
    text_color        = "#1F2937"
  }
}

# Output the status page URL
output "status_page_url" {
  value = "https://saturn.co/status/${saturn_status_page.public_status.slug}"
}

# Output monitor IDs
output "monitor_ids" {
  value = {
    daily_backup      = saturn_monitor.daily_backup.id
    api_health_check  = saturn_monitor.api_health_check.id
  }
}

