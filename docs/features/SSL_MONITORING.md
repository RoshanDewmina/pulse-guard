# SSL Certificate Monitoring

Monitor SSL certificate expiration and validity for your web services.

## Overview

SSL monitoring automatically checks your SSL/TLS certificates for expiration dates, validity, and security issues. Get alerted before certificates expire to prevent service disruptions.

## Features

- ✅ Automatic certificate validation
- ✅ Expiration date tracking
- ✅ Custom alert thresholds
- ✅ Certificate chain validation
- ✅ Self-signed certificate detection
- ✅ Manual check triggers
- ✅ Detailed certificate information

## Configuration

### Enabling SSL Monitoring

1. Navigate to **Monitors** → Select your monitor → **SSL**
2. Toggle **Enable SSL Monitoring** on
3. Configure alert thresholds (default: 30, 14, 7 days)
4. Click **Save Changes**

### Alert Thresholds

Set multiple thresholds to receive alerts at different intervals:

- **30 days** - Early warning
- **14 days** - Reminder
- **7 days** - Urgent

You can add custom thresholds by clicking **+ Add Threshold**.

## Monitoring Details

### What We Check

- **Certificate Validity**: Confirms the certificate is valid and trusted
- **Expiration Date**: Tracks when the certificate expires
- **Issuer**: Shows who issued the certificate
- **Subject**: Shows what the certificate is for
- **Chain Validity**: Ensures the full certificate chain is valid
- **Self-Signed Detection**: Identifies self-signed certificates

### Check Frequency

- Automatic checks run every 6 hours
- Manual checks can be triggered anytime
- Failed checks automatically retry

## Incident Creation

An incident is automatically created when:

- Certificate expires in X days (based on your thresholds)
- Certificate has expired
- Certificate validation fails
- Certificate chain is invalid

## API Integration

### Get SSL Certificate Status

```bash
GET /api/monitors/{monitorId}/ssl
```

**Response:**
```json
{
  "certificate": {
    "id": "cert_123",
    "domain": "example.com",
    "issuer": "Let's Encrypt",
    "expiresAt": "2025-12-31T23:59:59Z",
    "daysUntilExpiry": 45,
    "isValid": true,
    "isSelfSigned": false,
    "chainValid": true
  }
}
```

### Update SSL Settings

```bash
PATCH /api/monitors/{monitorId}/ssl
```

**Body:**
```json
{
  "checkSsl": true,
  "sslAlertThresholds": [60, 30, 14, 7]
}
```

### Trigger Manual Check

```bash
POST /api/monitors/{monitorId}/ssl/check
```

## Database Schema

```prisma
model SslCertificate {
  id              String   @id
  monitorId       String
  domain          String
  issuer          String?
  subject         String?
  issuedAt        DateTime?
  expiresAt       DateTime
  daysUntilExpiry Int
  isValid         Boolean
  isSelfSigned    Boolean
  chainValid      Boolean
  validationError String?
  serialNumber    String?
  fingerprint     String?
  lastCheckedAt   DateTime
}
```

## Troubleshooting

### Certificate Not Detected

- Ensure your monitor URL uses HTTPS
- Check that the domain is accessible
- Verify firewall rules allow outbound connections

### Validation Errors

Common errors and solutions:

- **"Certificate expired"** - Certificate needs renewal
- **"Chain invalid"** - Intermediate certificates missing
- **"Self-signed"** - Certificate not issued by trusted CA

## Best Practices

1. **Set Multiple Thresholds**: Get advance warnings at 60, 30, and 7 days
2. **Monitor Production**: Enable for all production services
3. **Test Alerts**: Trigger a manual check to verify notifications work
4. **Document Renewal Process**: Keep certificate renewal procedures up to date

## Related Features

- [Domain Monitoring](./DOMAIN_MONITORING.md) - Monitor domain expiration
- [Incidents](../INCIDENTS.md) - Managing incidents and alerts
- [Notifications](../NOTIFICATIONS.md) - Configuring alert channels

