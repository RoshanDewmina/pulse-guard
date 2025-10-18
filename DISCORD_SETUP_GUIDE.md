# Discord Integration Setup Guide

This guide walks you through setting up the Discord integration for Saturn Monitor.

## Prerequisites

- A Discord server where you have **Manage Webhooks** permission
- Access to your Saturn Monitor dashboard

## Overview

Discord integration uses webhooks to send rich embed messages to your Discord channels when incidents occur. No bot or OAuth is required - just a webhook URL!

## Step 1: Create a Discord Webhook

### Option A: Server Settings (Recommended)

1. Open your Discord server
2. Click on **Server Settings** (gear icon)
3. Go to **Integrations**
4. Click **"Create Webhook"** or **"View Webhooks"**
5. Click **"New Webhook"**
6. Configure the webhook:
   - **Name**: `Saturn Monitor` (or your preferred name)
   - **Channel**: Select the channel where you want to receive alerts
   - Optionally upload an avatar image
7. Click **"Copy Webhook URL"**
8. Click **"Save"**

### Option B: Channel Settings

1. Right-click on the channel where you want to receive alerts
2. Click **"Edit Channel"**
3. Go to **"Integrations"**
4. Click **"Create Webhook"**
5. Configure the webhook as above
6. Click **"Copy Webhook URL"**
7. Click **"Save Changes"**

## Step 2: Add Webhook to Saturn Monitor

1. Go to your Saturn Monitor dashboard
2. Navigate to **Integrations**
3. Find the **Discord** integration card
4. Click **"Quick Setup"** or **"Setup"**
5. Paste your Discord webhook URL
   - It should look like: `https://discord.com/api/webhooks/123456789012345678/abcdefg...`
6. Optionally add a friendly label (e.g., "#alerts channel")
7. Click **"Save Webhook"**

## Step 3: Configure Alerts

1. Go to **Settings** → **Alerts** or your monitor configuration
2. Your Discord channel should now be available
3. Assign the Discord channel to monitors that should send alerts
4. Configure alert rules as needed

## Step 4: Test the Integration

### Trigger a Test Alert

You can test the integration by:

1. **Manual Test**: Create a monitor with a short interval and let it miss
2. **API Test**: Use the API to create a test incident
3. **Real Monitor**: Wait for an actual incident to occur

### What You'll See in Discord

When an incident occurs, you'll receive a rich embed message with:

- **Colored sidebar** - Red (FAIL), Orange (MISSED), Yellow (LATE), Purple (ANOMALY)
- **Incident summary** - Clear description of what happened
- **Monitor details** - Name, status, kind
- **Timestamps** - Last run, next due, duration
- **Details** - Additional context if available
- **Emoji indicators** - Visual cues for incident type

### Example Alert

```
🔴 FAIL — API Health Check

Incident opened at 12/18/2024, 3:45 PM

📊 Monitor: API Health Check
🔖 Kind: FAIL
📍 Status: OPEN
⏰ Last Run: 12/18/2024, 3:45 PM
⏭️ Next Due: 12/18/2024, 3:50 PM
⏱️ Duration: 1234ms
📝 Details: HTTP 500 Internal Server Error

Saturn Monitoring
```

## Features

### Rich Embeds
- Color-coded alerts based on incident type
- Structured information with labeled fields
- Timestamps and durations
- Monitor context and recent activity

### Multiple Channels
- Configure multiple Discord webhooks for different teams
- Route different monitors to different channels
- Flexible alert distribution

### Instant Notifications
- Real-time alerts when incidents occur
- No polling or delays
- Direct webhook delivery

## Webhook URL Format

Discord webhook URLs must match one of these formats:
- `https://discord.com/api/webhooks/[webhook-id]/[webhook-token]`
- `https://discordapp.com/api/webhooks/[webhook-id]/[webhook-token]`

Invalid URLs will be rejected during setup.

## Rate Limits

Discord webhooks have rate limits:
- **5 requests per 2 seconds** per webhook
- **30 requests per minute** per webhook

Saturn Monitor's Discord worker includes:
- Built-in rate limiting (10 messages per second)
- Automatic retry logic
- Queue management

For high-volume alerting, consider:
- Using multiple webhooks
- Consolidating alerts
- Adjusting alert thresholds

## Managing Webhooks

### Update Webhook URL

1. Go to **Integrations**
2. Click **"Quick Setup"** on the Discord card
3. Enter the new webhook URL
4. Click **"Save Webhook"**
5. The existing Discord channel will be updated

### Delete Discord Integration

1. Go to **Settings** → **Alerts**
2. Find your Discord channel
3. Click the delete/remove button
4. Confirm deletion

Or delete the webhook in Discord:
1. Server Settings → Integrations
2. Find the Saturn Monitor webhook
3. Click **"Delete Webhook"**

### Change Alert Channel

To move alerts to a different Discord channel:
1. Create a new webhook in the desired channel
2. Update the webhook URL in Saturn Monitor
3. The integration will now send to the new channel

## Troubleshooting

### Webhook URL Rejected
**Error**: "Invalid Discord webhook URL"

**Solutions**:
- Verify the URL starts with `https://discord.com/api/webhooks/` or `https://discordapp.com/api/webhooks/`
- Ensure you copied the complete URL including the token
- Check for extra spaces or characters
- Regenerate the webhook if it was deleted

### Alerts Not Appearing
**Error**: Messages not showing in Discord

**Checklist**:
1. Verify the webhook is still active in Discord
2. Check the webhook wasn't deleted or regenerated
3. Verify the Discord channel exists
4. Check worker logs for delivery errors
5. Ensure monitors are assigned to the Discord alert channel
6. Confirm incidents are being created

### Rate Limit Errors
**Error**: "Rate limited by Discord"

**Solutions**:
- Reduce alert frequency
- Use multiple webhooks for different monitors
- Consolidate similar alerts
- Adjust monitor intervals
- Check for alert loops

### Webhook Deleted
**Error**: "Webhook not found"

**Solutions**:
1. Create a new webhook in Discord
2. Update the webhook URL in Saturn Monitor
3. Verify the new webhook is working

## Security Notes

### Webhook Token Security
- Webhook URLs contain sensitive tokens
- Anyone with the URL can send messages to your channel
- Keep webhook URLs confidential
- Don't commit webhook URLs to version control
- Rotate webhooks if compromised

### Regenerating Webhooks
If a webhook is compromised:
1. Delete the old webhook in Discord
2. Create a new webhook
3. Update Saturn Monitor with the new URL

### Permissions
Webhooks inherit the channel's permissions:
- Only users who can view the channel see the messages
- Webhook messages respect channel permissions
- Use private channels for sensitive alerts

## Advanced Configuration

### Multiple Discord Channels

You can set up multiple Discord integrations:

1. Create webhooks in different channels
2. Add each webhook to Saturn Monitor separately
3. Configure different monitors to use different channels

Example setup:
- `#critical-alerts` - Production failures
- `#monitoring` - All incidents  
- `#team-backend` - Backend service alerts
- `#team-frontend` - Frontend alerts

### Custom Labels

Use descriptive labels to organize your Discord channels:
- "Critical - #ops-alerts"
- "Staging - #dev-notifications"
- "Database Team - #db-monitoring"

### Integration with Roles

To mention roles in alerts:
1. Note: Direct role mentions are not supported with basic webhooks
2. Consider using Discord bot integration for advanced features (future enhancement)
3. Current workaround: Include role IDs in monitor names or details

## API Reference

### Discord Webhook Endpoint

`POST /api/discord/webhook`

**Request Body**:
```json
{
  "orgId": "org_xxxxx",
  "webhookUrl": "https://discord.com/api/webhooks/...",
  "label": "Optional friendly name"
}
```

**Response**:
```json
{
  "channel": {
    "id": "channel_xxxxx",
    "type": "DISCORD",
    "label": "Discord - #alerts",
    "configJson": {
      "webhookUrl": "https://discord.com/api/webhooks/..."
    }
  },
  "created": true
}
```

### Delete Discord Channel

`DELETE /api/discord/webhook?orgId=org_xxxxx&channelId=channel_xxxxx`

**Response**:
```json
{
  "success": true
}
```

## Discord Webhook Documentation

For more information about Discord webhooks:
- [Discord Webhooks Guide](https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks)
- [Discord API Documentation](https://discord.com/developers/docs/resources/webhook)

## Need Help?

If you encounter issues:
- Check the Discord webhook is active and not deleted
- Review the webhook URL format
- Check application logs for detailed errors
- Verify the Discord channel still exists
- Contact support at support@saturnmonitor.com


