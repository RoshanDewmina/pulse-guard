# Saturn - Slack App Directory Listing

## Short Description (80 chars max)

Cron monitoring with anomaly detection. Get alerts for failed or slow jobs.

## Long Description

Saturn monitors your cron jobs and scheduled tasks, alerting your team in Slack when jobs fail, run late, or behave abnormally.

### Features

- **Real-time alerts** for MISSED, LATE, FAIL, and ANOMALY incidents
- **Rich Block Kit messages** with incident details and action buttons
- **Threaded updates** to reduce channel noise
- **Slash commands** for quick status checks (/saturn status)
- **Interactive buttons** to acknowledge or suppress incidents
- **Multiple channel routing** based on severity

### Perfect for

- DevOps teams running critical cron jobs
- Kubernetes users with CronJob workloads
- WordPress agencies managing scheduled tasks
- Anyone who needs reliable cron monitoring

### How It Works

1. Install Saturn app to your Slack workspace
2. Choose channels for alerts
3. Connect your Saturn account
4. Configure routing rules (optional)
5. Get notified when jobs fail or run abnormally

### Privacy & Security

- Saturn only sends job status and performance data to Slack
- No access to Slack messages or private channels
- Data encrypted in transit (TLS 1.3)
- Compliant with SOC 2, GDPR

## Required Scopes

- `chat:write` - Send alert messages
- `chat:write.public` - Post to any public channel
- `channels:read` - List channels for configuration
- `users:read` - Display user names in alerts
- `commands` - Enable /saturn commands

## Optional Scopes

- `chat:write.customize` - Custom bot name/icon (future)

## Support

- **Documentation**: docs.saturn.example.com/alerts/slack
- **Email**: support@saturn.example.com
- **Status**: status.saturn.example.com

## Screenshots

1. **Alert message** - Rich Block Kit incident alert with details
2. **Threaded updates** - Acknowledgment and resolution in thread
3. **Slash command** - /saturn status showing current health
4. **Channel routing** - Configure severity-based routing
5. **Interactive buttons** - One-click acknowledge/suppress

