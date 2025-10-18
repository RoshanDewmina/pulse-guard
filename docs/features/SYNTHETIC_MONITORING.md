# Synthetic Monitoring

Test multi-step user journeys and workflows with browser automation.

## Overview

Synthetic monitoring uses Playwright to simulate real user interactions with your web application. Create tests that click buttons, fill forms, and verify expected outcomes - all running automatically on a schedule.

## Features

- ✅ Multi-step browser automation
- ✅ Visual test builder
- ✅ Screenshot capture on failure
- ✅ Response time tracking
- ✅ Assertion support
- ✅ Custom JavaScript execution
- ✅ Configurable timeouts and intervals

## Step Types

### 1. Navigate
Navigate to a URL.

```typescript
{
  type: 'NAVIGATE',
  url: 'https://example.com/login',
  waitTime: 5000
}
```

### 2. Click
Click an element on the page.

```typescript
{
  type: 'CLICK',
  selector: '#login-button',
  optional: false
}
```

### 3. Fill
Fill in a form input.

```typescript
{
  type: 'FILL',
  selector: '#email',
  value: 'test@example.com'
}
```

### 4. Select
Select an option from a dropdown.

```typescript
{
  type: 'SELECT',
  selector: '#country',
  value: 'US'
}
```

### 5. Wait
Wait for a specific time or element.

```typescript
{
  type: 'WAIT',
  waitTime: 3000 // or selector: '#loading-complete'
}
```

### 6. Screenshot
Capture a screenshot.

```typescript
{
  type: 'SCREENSHOT',
  label: 'After login'
}
```

### 7. Assertion
Verify page content or state.

```typescript
{
  type: 'ASSERTION',
  assertionType: 'TEXT_CONTAINS',
  selector: '.welcome-message',
  expectedValue: 'Welcome back!'
}
```

### 8. Custom Script
Execute custom JavaScript.

```typescript
{
  type: 'CUSTOM_SCRIPT',
  script: 'return document.title;'
}
```

## Creating a Monitor

### Via UI

1. Navigate to **Synthetic Monitors** → **Create Monitor**
2. Fill in basic information:
   - **Name**: Descriptive name for the test
   - **Starting URL**: Where the test begins
   - **Description**: What this test verifies
3. Configure settings:
   - **Interval**: How often to run (default: 5 minutes)
   - **Timeout**: Maximum execution time (default: 30 seconds)
4. Build your test steps using the step builder
5. Click **Create Monitor**

### Via API

```bash
POST /api/synthetic
```

**Body:**
```json
{
  "name": "Login Flow Test",
  "url": "https://example.com",
  "description": "Verifies user login functionality",
  "isEnabled": true,
  "intervalMinutes": 5,
  "timeout": 30000,
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "steps": [
    {
      "order": 0,
      "type": "NAVIGATE",
      "label": "Navigate to login",
      "url": "https://example.com/login"
    },
    {
      "order": 1,
      "type": "FILL",
      "label": "Enter email",
      "selector": "#email",
      "value": "test@example.com"
    },
    {
      "order": 2,
      "type": "FILL",
      "label": "Enter password",
      "selector": "#password",
      "value": "test123"
    },
    {
      "order": 3,
      "type": "CLICK",
      "label": "Click login button",
      "selector": "button[type=submit]"
    },
    {
      "order": 4,
      "type": "ASSERTION",
      "label": "Verify login success",
      "assertionType": "URL_CONTAINS",
      "expectedValue": "/dashboard"
    }
  ]
}
```

## Example Use Cases

### 1. User Registration Flow

```
1. Navigate to /signup
2. Fill username field
3. Fill email field
4. Fill password field
5. Click "Sign Up" button
6. Assert success message appears
```

### 2. E-commerce Checkout

```
1. Navigate to product page
2. Click "Add to Cart"
3. Navigate to /cart
4. Click "Checkout"
5. Fill shipping information
6. Select payment method
7. Assert order confirmation
```

### 3. API Health Check

```
1. Navigate to /api/health
2. Assert response contains "healthy"
3. Screenshot result
```

## Viewing Results

### Run History

Each monitor execution creates a `SyntheticRun` record with:

- **Status**: SUCCESS, FAILED, TIMEOUT, CANCELLED
- **Duration**: Total execution time
- **Started/Completed**: Timestamps
- **Error Message**: If failed

### Step Results

Each step captures:

- **Status**: SUCCESS, FAILED, SKIPPED
- **Duration**: Step execution time
- **Error**: Failure reason
- **Screenshot URL**: If captured or on failure

## Configuration Options

### Browser Settings

```json
{
  "viewport": {
    "width": 1920,
    "height": 1080
  },
  "userAgent": "Mozilla/5.0...",
  "headers": {
    "Authorization": "Bearer token"
  },
  "cookies": [
    {
      "name": "session",
      "value": "abc123",
      "domain": "example.com"
    }
  ]
}
```

### Timeouts

- **Monitor Timeout**: Maximum time for entire test (default: 30s)
- **Step Timeout**: Maximum time per step (default: 5s)
- **Wait Time**: Custom wait between steps

## Best Practices

1. **Keep Tests Focused**: Test one user journey per monitor
2. **Use Descriptive Labels**: Clear step names aid debugging
3. **Add Screenshots**: Capture key moments for verification
4. **Handle Dynamic Content**: Use appropriate wait times
5. **Test Regularly**: 5-minute intervals for critical paths
6. **Use Assertions**: Verify expected outcomes explicitly

## Troubleshooting

### Common Issues

**Timeout Errors**
- Increase monitor timeout
- Add wait steps before interactions
- Check for slow page loads

**Element Not Found**
- Verify selector accuracy
- Wait for dynamic content to load
- Check for iframe contexts

**Assertion Failures**
- Review expected vs actual values
- Check for timing issues
- Verify page content hasn't changed

## Database Schema

```prisma
model SyntheticMonitor {
  id              String
  name            String
  url             String
  isEnabled       Boolean
  intervalMinutes Int
  timeout         Int
  SyntheticStep   SyntheticStep[]
  SyntheticRun    SyntheticRun[]
}

model SyntheticRun {
  id                  String
  status              SyntheticRunStatus
  startedAt           DateTime
  completedAt         DateTime?
  durationMs          Int?
  SyntheticStepResult SyntheticStepResult[]
}
```

## Related Features

- [Monitors](../MONITORS.md) - Basic uptime monitoring
- [Incidents](../INCIDENTS.md) - Alert management
- [SLA Reports](./SLA_REPORTS.md) - Performance reporting

