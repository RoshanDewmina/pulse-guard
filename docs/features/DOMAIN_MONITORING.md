# Domain Expiration Monitoring

Monitor domain registration expiration dates to prevent domain loss.

## Overview

Domain monitoring tracks when your domains are set to expire and alerts you in advance. Prevent accidental domain expiration that could lead to service disruption or domain loss.

## Features

- ✅ Automatic WHOIS lookups
- ✅ Expiration date tracking
- ✅ Custom alert thresholds
- ✅ Registrar information
- ✅ Nameserver tracking
- ✅ Auto-renew status detection
- ✅ Manual check triggers

## Configuration

### Enabling Domain Monitoring

1. Navigate to **Monitors** → Select your monitor → **Domain**
2. Toggle **Enable Domain Monitoring** on
3. Configure alert thresholds (default: 60, 30, 14 days)
4. Click **Save Changes**

### Alert Thresholds

Set multiple thresholds for advance warnings:

- **60 days** - Early planning
- **30 days** - Renewal reminder
- **14 days** - Urgent action needed

Add custom thresholds as needed.

## Monitoring Details

### What We Check

- **Expiration Date**: When the domain registration expires
- **Registrar**: Who the domain is registered with
- **Registered Date**: When initially registered
- **Auto-Renew Status**: Whether auto-renewal is enabled
- **Nameservers**: Current DNS nameservers
- **Domain Status**: Registration status codes

### Check Frequency

- Automatic checks run every 24 hours
- Manual checks can be triggered anytime
- WHOIS queries respect rate limits

## Domain Status Codes

Common WHOIS status codes:

- **clientTransferProhibited**: Transfer locked (good security)
- **clientUpdateProhibited**: Updates locked
- **clientDeleteProhibited**: Deletion locked
- **active**: Domain is active and in use
- **pendingDelete**: Domain scheduled for deletion
- **redemptionPeriod**: Grace period after expiration

## Incident Creation

An incident is automatically created when:

- Domain expires in X days (based on thresholds)
- Domain has expired
- Domain status changes to critical state
- WHOIS lookup fails repeatedly

## API Integration

### Get Domain Status

```bash
GET /api/monitors/{monitorId}/domain
```

**Response:**
```json
{
  "domain": {
    "id": "domain_123",
    "domain": "example.com",
    "registrar": "GoDaddy",
    "registeredAt": "2020-01-15T00:00:00Z",
    "expiresAt": "2026-01-15T00:00:00Z",
    "daysUntilExpiry": 365,
    "autoRenew": true,
    "nameservers": [
      "ns1.example.com",
      "ns2.example.com"
    ],
    "status": [
      "clientTransferProhibited",
      "clientUpdateProhibited"
    ],
    "lastCheckedAt": "2025-01-15T12:00:00Z"
  }
}
```

### Update Domain Settings

```bash
PATCH /api/monitors/{monitorId}/domain
```

**Body:**
```json
{
  "checkDomain": true,
  "domainAlertThresholds": [90, 60, 30, 14]
}
```

### Trigger Manual Check

```bash
POST /api/monitors/{monitorId}/domain/check
```

## Database Schema

```prisma
model DomainExpiration {
  id              String   @id
  monitorId       String
  domain          String
  registrar       String?
  registeredAt    DateTime?
  expiresAt       DateTime
  daysUntilExpiry Int
  autoRenew       Boolean?
  nameservers     String[]
  status          String[]
  whoisServer     String?
  lastCheckedAt   DateTime
}
```

## Troubleshooting

### WHOIS Lookup Fails

- Some TLDs have rate limits
- Privacy protection may hide details
- New TLDs may have different formats
- Try manual check after waiting

### Incorrect Expiration Date

- Verify domain spelling
- Check if domain uses privacy protection
- Some registrars report different dates
- Confirm with registrar directly

### Missing Auto-Renew Status

- Not all WHOIS servers provide this
- Check with your registrar dashboard
- Manual verification recommended

## Best Practices

1. **Monitor All Domains**: Don't forget subdomains and redirects
2. **Set Long Thresholds**: 90-day advance warning recommended
3. **Enable Auto-Renew**: At registrar level
4. **Lock Domains**: Use clientTransferProhibited status
5. **Document Registrar Access**: Keep credentials secure and accessible
6. **Verify Contact Info**: Ensure registrar can reach you

## Common Scenarios

### Domain About to Expire

1. Receive alert at 60 days
2. Review auto-renew status
3. Verify payment method current
4. Renew manually if needed
5. Confirm renewal completed

### Transfer Domain

1. Disable monitoring temporarily
2. Unlock domain at current registrar
3. Get authorization code
4. Initiate transfer at new registrar
5. Re-enable monitoring
6. Verify new expiration date

### Domain Privacy Protection

If WHOIS shows privacy protection:

- Expiration date may still be visible
- Contact info will be masked
- This doesn't affect monitoring
- Verify settings with registrar

## Supported TLDs

Monitoring supports all major TLDs:

- Generic: .com, .net, .org, .info, .biz
- Country: .us, .uk, .ca, .de, .au, etc.
- New: .io, .ai, .app, .dev, etc.

Some TLDs have special considerations:

- **.io**: British Indian Ocean Territory registry
- **.ly**: Libya - subject to country regulations
- **.tv**: Tuvalu - can be expensive to renew

## Integration with SSL Monitoring

Domain and SSL monitoring work together:

- Both expiration dates tracked
- Coordinated renewal reminders
- Combined incident alerting
- Single dashboard view

## Related Features

- [SSL Monitoring](./SSL_MONITORING.md) - Certificate expiration
- [Monitors](../MONITORS.md) - Basic uptime monitoring
- [Incidents](../INCIDENTS.md) - Alert management
- [Notifications](../NOTIFICATIONS.md) - Alert channels

