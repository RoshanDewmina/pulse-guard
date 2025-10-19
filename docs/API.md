# 🔌 PulseGuard API Documentation

Complete API reference for PulseGuard's REST API, including authentication, endpoints, and examples.

## 📋 Table of Contents

- [Authentication](#-authentication)
- [Rate Limiting](#-rate-limiting)
- [Error Handling](#-error-handling)
- [Endpoints](#-endpoints)
- [Webhooks](#-webhooks)
- [SDKs & Examples](#-sdks--examples)

---

## 🔐 Authentication

PulseGuard uses API keys for authentication. Include your API key in the `Authorization` header.

```bash
curl -H "Authorization: Bearer YOUR_API_KEY" \
     https://your-domain.com/api/monitors
```

### Getting Your API Key

1. Navigate to **Settings** → **API Keys**
2. Click **Create New API Key**
3. Give it a descriptive name
4. Copy the generated key (it won't be shown again)

### API Key Permissions

API keys inherit the permissions of the user who created them:
- **Owner/Admin**: Full access to all endpoints
- **Member**: Read-only access to monitors and basic data
- **Viewer**: Limited read-only access

---

## ⚡ Rate Limiting

API requests are rate-limited to prevent abuse:

- **Free Plan**: 100 requests/hour
- **Pro Plan**: 1,000 requests/hour
- **Business Plan**: 10,000 requests/hour
- **Enterprise Plan**: 100,000 requests/hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
```

---

## ❌ Error Handling

All API errors follow a consistent format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Rate Limited |
| 500 | Internal Server Error |

---

## 🛠️ Endpoints

### Monitors

#### List Monitors
```http
GET /api/monitors?orgId=ORG_ID&limit=50&offset=0
```

**Query Parameters:**
- `orgId` (required): Organization ID
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `type` (optional): Filter by monitor type (`HTTP_CHECK`, `HEARTBEAT`)
- `status` (optional): Filter by status (`UP`, `DOWN`, `PAUSED`)

**Response:**
```json
{
  "monitors": [
    {
      "id": "mon_123",
      "name": "API Health Check",
      "type": "HTTP_CHECK",
      "url": "https://api.example.com/health",
      "status": "UP",
      "uptime": 99.9,
      "lastCheck": "2024-01-15T10:30:00Z",
      "nextCheck": "2024-01-15T10:35:00Z",
      "interval": 300,
      "tags": ["production", "api"]
    }
  ],
  "total": 1,
  "hasMore": false
}
```

#### Create Monitor
```http
POST /api/monitors
```

**Request Body:**
```json
{
  "orgId": "org_123",
  "name": "API Health Check",
  "type": "HTTP_CHECK",
  "url": "https://api.example.com/health",
  "interval": 300,
  "httpMethod": "GET",
  "expectedStatusCode": 200,
  "responseTimeSla": 5000,
  "httpHeaders": {
    "Authorization": "Bearer token123"
  },
  "responseAssertions": [
    {
      "type": "status_code",
      "expected": 200
    },
    {
      "type": "response_time",
      "max": 5000
    }
  ],
  "tags": ["production", "api"]
}
```

#### Update Monitor
```http
PATCH /api/monitors/{monitorId}
```

#### Delete Monitor
```http
DELETE /api/monitors/{monitorId}
```

#### Test Monitor
```http
POST /api/monitors/{monitorId}/test
```

### HTTP Monitoring

#### Update HTTP Configuration
```http
PATCH /api/monitors/{monitorId}/http
```

**Request Body:**
```json
{
  "httpMethod": "POST",
  "httpHeaders": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123"
  },
  "httpBody": "{\"test\": \"data\"}",
  "expectedStatusCode": 201,
  "responseTimeSla": 5000,
  "responseAssertions": [
    {
      "type": "status_code",
      "expected": 201
    },
    {
      "type": "response_time",
      "max": 5000
    },
    {
      "type": "response_body",
      "contains": "success"
    }
  ]
}
```

#### Test HTTP Configuration
```http
POST /api/monitors/{monitorId}/http/test
```

**Request Body:**
```json
{
  "url": "https://api.example.com/test",
  "method": "GET",
  "headers": {
    "User-Agent": "PulseGuard-Test"
  },
  "timeout": 10000
}
```

### Tags

#### List Tags
```http
GET /api/tags?orgId=ORG_ID
```

#### Create Tag
```http
POST /api/tags
```

**Request Body:**
```json
{
  "orgId": "org_123",
  "name": "production"
}
```

#### Delete Tag
```http
DELETE /api/tags/{tagId}
```

### Maintenance Windows

#### List Maintenance Windows
```http
GET /api/maintenance-windows?orgId=ORG_ID&monitorId=MONITOR_ID
```

#### Create Maintenance Window
```http
POST /api/maintenance-windows
```

**Request Body:**
```json
{
  "orgId": "org_123",
  "name": "Database Maintenance",
  "description": "Scheduled database maintenance",
  "startAt": "2024-01-20T02:00:00Z",
  "endAt": "2024-01-20T04:00:00Z"
}
```

#### Check Maintenance Status
```http
GET /api/maintenance-windows/check?monitorId=MONITOR_ID
```

**Response:**
```json
{
  "inMaintenance": true,
  "maintenanceWindows": [
    {
      "id": "mw_123",
      "name": "Database Maintenance",
      "startAt": "2024-01-20T02:00:00Z",
      "endAt": "2024-01-20T04:00:00Z"
    }
  ]
}
```

### MFA (Multi-Factor Authentication)

#### Enroll in MFA
```http
POST /api/mfa/enroll
```

**Response:**
```json
{
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "manualEntryKey": "JBSWY3DPEHPK3PXP"
}
```

#### Verify MFA Code
```http
POST /api/mfa/verify
```

**Request Body:**
```json
{
  "code": "123456",
  "isBackupCode": false
}
```

#### Disable MFA
```http
POST /api/mfa/disable
```

**Request Body:**
```json
{
  "code": "123456",
  "isBackupCode": false
}
```

#### Regenerate Backup Codes
```http
POST /api/mfa/regenerate-codes
```

**Request Body:**
```json
{
  "code": "123456"
}
```

### SAML Configuration

#### Get SAML Configuration
```http
GET /api/saml/config?orgId=ORG_ID
```

#### Create/Update SAML Configuration
```http
POST /api/saml/config
```

**Request Body:**
```json
{
  "orgId": "org_123",
  "name": "Enterprise SAML",
  "idpUrl": "https://idp.company.com/sso/saml",
  "idpCert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "spCert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "spKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "spEntityId": "urn:company:sp",
  "acsUrl": "https://app.company.com/api/auth/callback/saml",
  "sloUrl": "https://app.company.com/api/auth/signout/saml",
  "nameIdFormat": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  "attributeMapping": {
    "email": "email",
    "name": "name",
    "firstName": "given_name",
    "lastName": "family_name"
  },
  "isEnabled": true
}
```

#### Test SAML Configuration
```http
POST /api/saml/test
```

**Request Body:**
```json
{
  "orgId": "org_123",
  "idpUrl": "https://idp.company.com/sso/saml",
  "idpCert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "spCert": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
  "spKey": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----",
  "spEntityId": "urn:company:sp",
  "acsUrl": "https://app.company.com/api/auth/callback/saml"
}
```

### Audit Logs

#### Get Audit Logs
```http
GET /api/audit-logs?orgId=ORG_ID&action=USER_CREATED&userId=USER_ID&startDate=2024-01-01&endDate=2024-01-31&format=json&limit=50&offset=0
```

**Query Parameters:**
- `orgId` (required): Organization ID
- `action` (optional): Filter by action type
- `userId` (optional): Filter by user ID
- `startDate` (optional): Start date (ISO 8601)
- `endDate` (optional): End date (ISO 8601)
- `format` (optional): Response format (`json` or `csv`)
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "logs": [
    {
      "id": "log_123",
      "action": "USER_CREATED",
      "userId": "user_123",
      "orgId": "org_123",
      "targetId": "user_456",
      "meta": {
        "email": "newuser@company.com",
        "role": "MEMBER"
      },
      "createdAt": "2024-01-15T10:30:00Z",
      "User": {
        "id": "user_123",
        "name": "John Doe",
        "email": "john@company.com"
      }
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0,
  "hasMore": false
}
```

---

## 🔗 Webhooks

PulseGuard can send webhooks for various events. Configure webhooks in your organization settings.

### Webhook Events

| Event | Description |
|-------|-------------|
| `monitor.down` | Monitor goes down |
| `monitor.up` | Monitor comes back up |
| `incident.created` | New incident created |
| `incident.resolved` | Incident resolved |
| `maintenance.started` | Maintenance window started |
| `maintenance.ended` | Maintenance window ended |

### Webhook Payload

```json
{
  "event": "monitor.down",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "monitor": {
      "id": "mon_123",
      "name": "API Health Check",
      "url": "https://api.example.com/health",
      "type": "HTTP_CHECK"
    },
    "incident": {
      "id": "inc_123",
      "severity": "high",
      "message": "API Health Check is down"
    },
    "organization": {
      "id": "org_123",
      "name": "Acme Corp"
    }
  }
}
```

### Webhook Security

Webhooks include a signature header for verification:

```bash
X-PulseGuard-Signature: sha256=abc123def456...
```

Verify the signature using your webhook secret:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return signature === `sha256=${expectedSignature}`;
}
```

---

## 📚 SDKs & Examples

### JavaScript/Node.js

```javascript
const PulseGuard = require('@pulseguard/sdk');

const client = new PulseGuard({
  apiKey: 'your-api-key',
  baseUrl: 'https://your-domain.com'
});

// Create a monitor
const monitor = await client.monitors.create({
  orgId: 'org_123',
  name: 'API Health Check',
  type: 'HTTP_CHECK',
  url: 'https://api.example.com/health',
  interval: 300
});

// List monitors
const monitors = await client.monitors.list({
  orgId: 'org_123',
  limit: 50
});

// Test a monitor
const result = await client.monitors.test('mon_123');
```

### Python

```python
import pulseguard

client = pulseguard.Client(
    api_key='your-api-key',
    base_url='https://your-domain.com'
)

# Create a monitor
monitor = client.monitors.create(
    org_id='org_123',
    name='API Health Check',
    type='HTTP_CHECK',
    url='https://api.example.com/health',
    interval=300
)

# List monitors
monitors = client.monitors.list(
    org_id='org_123',
    limit=50
)

# Test a monitor
result = client.monitors.test('mon_123')
```

### cURL Examples

#### Create a Monitor
```bash
curl -X POST https://your-domain.com/api/monitors \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "org_123",
    "name": "API Health Check",
    "type": "HTTP_CHECK",
    "url": "https://api.example.com/health",
    "interval": 300
  }'
```

#### Test a Monitor
```bash
curl -X POST https://your-domain.com/api/monitors/mon_123/test \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

#### Get Audit Logs
```bash
curl -X GET "https://your-domain.com/api/audit-logs?orgId=org_123&format=csv" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  --output audit-logs.csv
```

---

## 🔧 Advanced Usage

### Pagination

Most list endpoints support pagination:

```javascript
let offset = 0;
const limit = 50;
let hasMore = true;

while (hasMore) {
  const response = await client.monitors.list({
    orgId: 'org_123',
    limit,
    offset
  });
  
  // Process monitors
  response.monitors.forEach(monitor => {
    console.log(monitor.name);
  });
  
  hasMore = response.hasMore;
  offset += limit;
}
```

### Error Handling

```javascript
try {
  const monitor = await client.monitors.create(data);
} catch (error) {
  if (error.status === 429) {
    // Rate limited
    const retryAfter = error.headers['retry-after'];
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
  } else if (error.status === 400) {
    // Bad request
    console.error('Validation error:', error.details);
  } else {
    // Other error
    console.error('API error:', error.message);
  }
}
```

### Webhook Handling

```javascript
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.raw({ type: 'application/json' }));

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-pulseguard-signature'];
  const payload = req.body;
  
  // Verify signature
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');
  
  if (signature !== `sha256=${expectedSignature}`) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = JSON.parse(payload);
  
  switch (event.event) {
    case 'monitor.down':
      console.log('Monitor is down:', event.data.monitor.name);
      break;
    case 'monitor.up':
      console.log('Monitor is up:', event.data.monitor.name);
      break;
  }
  
  res.status(200).send('OK');
});
```

---

## 📞 Support

- **Documentation**: [docs.pulseguard.com](https://docs.pulseguard.com)
- **API Status**: [status.pulseguard.com](https://status.pulseguard.com)
- **Support Email**: api-support@pulseguard.com
- **GitHub Issues**: [github.com/pulseguard/pulseguard/issues](https://github.com/pulseguard/pulseguard/issues)

---

**Last Updated**: January 2024  
**API Version**: v1
