# SLA Reports

Generate comprehensive service level agreement reports with uptime, MTTR, and performance metrics.

## Overview

SLA Reports provide detailed analytics about your service reliability and performance over time. Track uptime percentages, incident patterns, and response times to meet your SLA commitments.

## Features

- ✅ Automatic report generation
- ✅ Uptime percentage tracking
- ✅ MTTR (Mean Time To Repair)
- ✅ MTBF (Mean Time Between Failures)
- ✅ Response time percentiles (avg, P95, P99)
- ✅ Incident count tracking
- ✅ HTML export
- ✅ Scheduled reports (daily/weekly/monthly)

## Report Types

### Daily Reports
Generated automatically at midnight. Covers the previous 24 hours.

### Weekly Reports  
Generated every Monday at 1am. Covers the previous 7 days.

### Monthly Reports
Generated on the 1st of each month at 2am. Covers the previous month.

### Custom Reports
Generate reports for any date range on demand.

## Metrics Explained

### Uptime Percentage

```
Uptime % = (Successful Checks / Total Checks) × 100
```

**SLA Tiers:**
- **99.9%** (Three Nines) = 43.8 minutes downtime/month
- **99.95%** (Three and a half Nines) = 21.9 minutes downtime/month
- **99.99%** (Four Nines) = 4.38 minutes downtime/month

### MTTR (Mean Time To Repair)

Average time to resolve incidents.

```
MTTR = Total Resolution Time / Number of Incidents
```

**Example:** 3 incidents taking 10, 20, and 30 minutes to resolve:
```
MTTR = (10 + 20 + 30) / 3 = 20 minutes
```

### MTBF (Mean Time Between Failures)

Average time between incidents.

```
MTBF = Total Uptime / Number of Incidents
```

**Lower is better:** Shorter MTTR means faster recovery

**Higher is better:** Longer MTBF means fewer failures

### Response Time Percentiles

- **Average**: Mean response time across all checks
- **P95**: 95% of requests were faster than this
- **P99**: 99% of requests were faster than this

## Generating Reports

### Via UI

1. Navigate to **SLA Reports** → **Generate Report**
2. Configure report:
   - **Name**: Report identifier
   - **Period**: DAILY, WEEKLY, MONTHLY, or CUSTOM
   - **Monitor**: Specific monitor or all monitors
   - **Date Range**: For custom reports
3. Click **Generate Report**
4. Report processes in background (usually 10-30 seconds)
5. View results when complete

### Via API

```bash
POST /api/reports
```

**Body:**
```json
{
  "name": "Monthly SLA Report - January 2025",
  "period": "MONTHLY",
  "monitorId": "monitor_123", // Optional
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-01-31T23:59:59Z"
}
```

**Response:**
```json
{
  "report": {
    "id": "report_456",
    "name": "Monthly SLA Report - January 2025",
    "period": "MONTHLY",
    "uptimePercentage": 99.97,
    "totalChecks": 8640,
    "successfulChecks": 8637,
    "failedChecks": 3,
    "totalDowntimeMs": 1800000,
    "mttr": 600000,
    "mtbf": 2880000,
    "incidentCount": 2,
    "averageResponseTime": 245,
    "p95ResponseTime": 450,
    "p99ResponseTime": 890,
    "pdfUrl": "https://s3.../report.html"
  }
}
```

## Scheduled Reports

Reports are automatically generated on schedule:

### Configuration

Currently configured in the worker's `scheduled-reports.ts` job:

- **Daily**: Midnight (00:00)
- **Weekly**: Mondays at 1:00 AM
- **Monthly**: 1st day of month at 2:00 AM

### Email Delivery (Future)

Scheduled reports can be configured to email stakeholders automatically:

```json
{
  "schedule": "WEEKLY",
  "recipients": ["team@example.com"],
  "includeCharts": true
}
```

## Report Contents

### Summary Section
- Report period and date range
- Monitor name (if specific)
- Generation timestamp
- Overall uptime percentage

### Key Metrics
- **Uptime**: Percentage and trend
- **Total Checks**: Number of health checks
- **Downtime**: Total minutes offline
- **Incidents**: Count and details

### Reliability Metrics
- **MTTR**: Average incident resolution time
- **MTBF**: Average time between incidents
- **Incident Frequency**: Incidents per day/week/month

### Performance Metrics
- **Average Response Time**: Mean latency
- **P95 Response Time**: 95th percentile
- **P99 Response Time**: 99th percentile
- **Response Time Trend**: Chart over time

### Incident Breakdown
- List of all incidents in period
- Duration and impact
- Resolution times
- Incident types

## Exporting Reports

### HTML Export

All reports are saved as HTML files in S3:

```bash
GET /api/reports/{reportId}
```

Returns presigned URL to download the HTML report.

### Markdown Export (Coming Soon)

Export reports in Markdown format for documentation.

## Visualization

Reports include interactive charts (when viewed in UI):

1. **Uptime Chart**: Line chart showing uptime over time
2. **Response Time Chart**: Multi-line chart (avg, P95, P99)
3. **Incident Chart**: Bar chart of incidents by day

## Best Practices

1. **Regular Reviews**: Schedule weekly SLA review meetings
2. **Set Targets**: Define uptime and performance targets
3. **Track Trends**: Compare reports month-over-month
4. **Share Widely**: Distribute reports to stakeholders
5. **Action on Insights**: Use data to prioritize improvements

## Troubleshooting

### Report Generation Fails

- Check that monitors have sufficient data
- Verify date range is valid
- Ensure worker is running
- Check BullMQ queue status

### Missing Data

- Confirm monitors were active during period
- Check for database connectivity issues
- Verify runs are being recorded

### Incorrect Metrics

- Validate monitor configuration
- Check incident resolution timestamps
- Ensure timezone settings are correct

## Database Schema

```prisma
model SlaReport {
  id                  String
  orgId               String
  monitorId           String?
  name                String
  period              ReportPeriod
  startDate           DateTime
  endDate             DateTime
  uptimePercentage    Float
  totalChecks         Int
  successfulChecks    Int
  failedChecks        Int
  totalDowntimeMs     Int
  mttr                Int?
  mtbf                Int?
  incidentCount       Int
  averageResponseTime Float?
  p95ResponseTime     Float?
  p99ResponseTime     Float?
  pdfUrl              String?
}
```

## API Reference

### List Reports

```bash
GET /api/reports
```

### Get Report

```bash
GET /api/reports/{reportId}
```

### Generate Report

```bash
POST /api/reports
```

### Delete Report

```bash
DELETE /api/reports/{reportId}
```

## Related Features

- [Monitors](../MONITORS.md) - Uptime monitoring basics
- [Incidents](../INCIDENTS.md) - Incident management
- [Analytics](../ANALYTICS.md) - Real-time dashboards

