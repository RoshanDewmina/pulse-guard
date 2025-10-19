# SMS Integration (Twilio)

The SMS integration allows you to receive incident notifications via text message using Twilio's messaging service.

## Features

- **Instant Notifications**: Receive alerts immediately on your phone
- **Multiple Recipients**: Send to multiple phone numbers
- **Rate Limiting**: Built-in protection against spam
- **Concise Format**: Optimized for mobile viewing
- **Status Updates**: Different messages for different incident states

## Setup

### 1. Twilio Account Setup

1. Sign up for a [Twilio account](https://www.twilio.com)
2. Verify your phone number
3. Purchase a phone number for sending SMS
4. Get your Account SID and Auth Token from the Twilio Console

### 2. Configure Environment Variables

Add these to your Saturn environment:

```bash
# Enable SMS integration
TWILIO_ENABLED=true

# Twilio credentials
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token

# Phone number to send from (E.164 format)
TWILIO_FROM_NUMBER=+15551234567
```

### 3. Configure in Saturn

1. Go to **Settings** > **Alert Channels**
2. Click **Add Channel**
3. Select **SMS**
4. Enter a label (e.g., "On-Call Alerts")
5. Add phone numbers in E.164 format (e.g., +1234567890)
6. Click **Save**

## Message Format

### Incident Opened
```
🚨 INCIDENT OPENED
Monitor: Database Backup
Type: MISSED
Job did not run on time

View: https://app.saturn.sh/app/incidents/inc-123
```

### Incident Acknowledged
```
👀 INCIDENT ACKNOWLEDGED
Monitor: Database Backup

View: https://app.saturn.sh/app/incidents/inc-123
```

### Incident Resolved
```
✅ INCIDENT RESOLVED
Monitor: Database Backup

View: https://app.saturn.sh/app/incidents/inc-123
```

## Phone Number Format

All phone numbers must be in E.164 format:
- **US**: +1234567890
- **UK**: +44123456789
- **International**: +[country code][number]

### Examples
- United States: +15551234567
- United Kingdom: +447911123456
- Canada: +14165551234
- Australia: +61412345678

## Rate Limiting

To prevent spam and control costs, SMS messages are rate limited:

- **10 messages per hour per organization**
- Rate limit resets every hour
- Exceeded limits are logged but not sent
- No additional charges for blocked messages

## Configuration Options

### Channel Settings
- **Label**: Display name for the channel
- **Recipients**: List of phone numbers (E.164 format)
- **Default**: Mark as default channel for new monitors
- **Enabled**: Toggle channel on/off

### Message Settings
- **Truncation**: Messages longer than 900 characters are truncated
- **Links**: Shortened URLs to save space
- **Emojis**: Used to indicate message type

## Troubleshooting

### Common Issues

#### SMS Not Sending
- Verify Twilio credentials are correct
- Check if `TWILIO_ENABLED=true` is set
- Ensure phone numbers are in E.164 format
- Verify Twilio account has sufficient balance

#### Invalid Phone Numbers
- Ensure numbers include country code
- Remove spaces, dashes, and parentheses
- Use + prefix for international numbers
- Verify numbers are valid and active

#### Rate Limiting
- Check if organization has exceeded 10 messages/hour
- Wait for rate limit to reset
- Consider using multiple channels for different teams

### Error Messages

| Error | Solution |
|-------|----------|
| "Twilio credentials not configured" | Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN |
| "TWILIO_FROM_NUMBER not configured" | Set TWILIO_FROM_NUMBER environment variable |
| "Invalid phone number" | Check E.164 format |
| "Rate limit exceeded" | Wait for rate limit reset |
| "All SMS messages failed" | Check Twilio account and credentials |

## Best Practices

### Phone Number Management
- Use dedicated phone numbers for different teams
- Keep a backup contact method
- Regularly verify phone numbers are active
- Use group messaging for team alerts

### Message Optimization
- Keep monitor names concise
- Use clear, actionable language
- Include essential information only
- Test messages on different devices

### Cost Management
- Monitor SMS usage regularly
- Use rate limiting to control costs
- Consider email for non-critical alerts
- Set up billing alerts in Twilio

## Security Considerations

- Phone numbers are sensitive personal information
- Store phone numbers securely
- Use encrypted storage for Twilio credentials
- Regularly audit SMS access and usage
- Implement proper access controls

## Twilio Configuration

### Required Twilio Settings
- **Account SID**: Found in Twilio Console
- **Auth Token**: Found in Twilio Console
- **Phone Number**: Must be SMS-capable
- **Webhook URL**: Not required for outbound SMS

### Optional Twilio Features
- **Messaging Service**: For better deliverability
- **Short Codes**: For high-volume messaging
- **International Numbers**: For global teams

## API Reference

### SMS Payload
```json
{
  "token": "monitor_token",
  "status": "success|failed|warning",
  "durationMs": 1500,
  "exitCode": 0,
  "output": "Job completed successfully",
  "timestamp": "2023-01-01T00:00:00Z"
}
```

### Twilio API Call
```javascript
client.messages.create({
  body: message,
  from: fromNumber,
  to: recipient
});
```

## Cost Considerations

### Twilio Pricing (US)
- **SMS to US**: ~$0.0075 per message
- **SMS International**: Varies by country
- **Phone Number**: ~$1.00/month

### Cost Optimization
- Use rate limiting to prevent spam
- Consider email for non-critical alerts
- Monitor usage with Twilio Console
- Set up billing alerts

## Support

For issues with the SMS integration:
- Check the [Troubleshooting](#troubleshooting) section
- Review Saturn application logs
- Check Twilio Console for delivery status
- Contact support at support@saturn.sh
