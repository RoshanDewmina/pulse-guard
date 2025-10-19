# Microsoft Teams Integration

The Microsoft Teams integration allows you to receive incident notifications directly in your Teams channels using Adaptive Cards.

## Features

- **Rich Notifications**: Beautiful Adaptive Cards with incident details
- **Interactive Actions**: Direct links to view incidents and monitors
- **Status Updates**: Separate notifications for opened, acknowledged, and resolved incidents
- **Customizable Appearance**: Different colors and emojis based on incident severity
- **Detailed Information**: Monitor name, organization, timestamps, and more

## Setup

### 1. Create a Teams Webhook

1. In your Microsoft Teams channel, click the **...** menu
2. Select **Connectors**
3. Find **Incoming Webhook** and click **Configure**
4. Give it a name (e.g., "Saturn Alerts")
5. Optionally upload an icon
6. Click **Create**
7. Copy the webhook URL

### 2. Configure in Saturn

1. Go to **Settings** > **Alert Channels**
2. Click **Add Channel**
3. Select **Microsoft Teams**
4. Enter a label (e.g., "Dev Team Alerts")
5. Paste your webhook URL
6. Click **Save**

## Message Format

### Incident Opened
```
🚫 Incident Opened: Database Backup
Monitor: Database Backup
Organization: Acme Corp
Type: MISSED
Status: OPEN
Opened: Jan 15, 2024 2:30 PM
```

### Incident Acknowledged
```
👀 Incident Acknowledged: Database Backup
Monitor: Database Backup
Organization: Acme Corp
Status: ACKED
Acknowledged: Jan 15, 2024 2:35 PM
```

### Incident Resolved
```
✅ Incident Resolved: Database Backup
Monitor: Database Backup
Organization: Acme Corp
Status: RESOLVED
Resolved: Jan 15, 2024 3:00 PM
```

## Adaptive Card Features

### Visual Elements
- **Color-coded headers**: Red for open incidents, orange for acknowledged, green for resolved
- **Status emojis**: Different emojis for each incident type
- **Fact sets**: Organized information display
- **Action buttons**: Direct links to Saturn dashboard

### Incident Types
- **MISSED** 🚫: Job didn't run on time
- **LATE** ⏰: Job ran but was delayed
- **FAIL** ❌: Job failed with error
- **ANOMALY** ⚠️: Performance anomaly detected

### Interactive Actions
- **View Incident**: Opens the incident in Saturn dashboard
- **View Monitor**: Opens the monitor details page

## Configuration Options

### Webhook URL
- Must be a valid Microsoft Teams webhook URL
- Format: `https://outlook.office.com/webhook/...`

### Channel Settings
- **Label**: Display name for the channel
- **Default**: Mark as default channel for new monitors
- **Enabled**: Toggle channel on/off

## Troubleshooting

### Common Issues

#### Webhook Not Working
- Verify the webhook URL is correct
- Check that the webhook hasn't expired
- Ensure the Teams channel is still active

#### Messages Not Appearing
- Check if the integration is enabled in Saturn
- Verify the monitor has the Teams channel assigned
- Check Saturn logs for error messages

#### Formatting Issues
- Ensure your Teams client supports Adaptive Cards
- Update to the latest Teams version
- Check for any custom Teams policies

### Error Messages

| Error | Solution |
|-------|----------|
| "Invalid webhook URL" | Verify the URL format and validity |
| "Teams webhook failed: 400" | Check webhook configuration |
| "Teams webhook failed: 401" | Webhook may have expired, create new one |

## Best Practices

### Channel Organization
- Create separate channels for different teams/environments
- Use descriptive channel names (e.g., "Production Alerts", "Dev Team")
- Consider using private channels for sensitive alerts

### Notification Management
- Set up multiple channels for different severity levels
- Use channel mentions (@channel) for critical incidents
- Configure quiet hours if needed

### Message Customization
- Use clear, descriptive monitor names
- Include relevant context in incident summaries
- Set up proper escalation procedures

## Security Considerations

- Webhook URLs contain sensitive information
- Store webhook URLs securely
- Regularly rotate webhook URLs
- Use private channels for sensitive data
- Monitor webhook usage and access

## API Reference

### Webhook Payload
```json
{
  "type": "message",
  "attachments": [
    {
      "contentType": "application/vnd.microsoft.card.adaptive",
      "content": {
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "type": "AdaptiveCard",
        "version": "1.4",
        "body": [...],
        "actions": [...]
      }
    }
  ]
}
```

### Environment Variables
- `TEAMS_ENABLED`: Enable/disable Teams integration
- `NEXT_PUBLIC_APP_URL`: Base URL for action buttons

## Support

For issues with the Teams integration:
- Check the [Troubleshooting](#troubleshooting) section
- Review Saturn application logs
- Contact support at support@saturn.sh
