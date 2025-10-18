# Post-Mortems

Document and learn from incidents with structured post-mortem reports.

## Overview

Post-mortems (also called incident retrospectives) help teams learn from failures and improve systems. Create detailed documentation of what happened, why it happened, and how to prevent it in the future.

## Features

- ✅ Structured incident documentation
- ✅ Timeline builder
- ✅ Action item tracking
- ✅ Root cause analysis
- ✅ Impact assessment
- ✅ Pre-filled templates
- ✅ Markdown export
- ✅ Status workflow

## Creating a Post-Mortem

### Via UI

1. Navigate to **Post-Mortems** → **Create Post-Mortem**
2. Select incident to document
3. Choose a template (optional):
   - Database Outage
   - API Downtime
   - Security Incident
   - Deployment Failure
   - Third-Party Service Failure
4. Fill in sections:
   - **Title**: Brief description
   - **Summary**: One-paragraph overview
   - **Impact**: Who/what was affected
   - **Root Cause**: Why it happened
5. Build timeline of events
6. Add action items with owners
7. Save as draft or publish

### Via API

```bash
POST /api/postmortems
```

**Body:**
```json
{
  "incidentId": "inc_123",
  "title": "Database Connection Pool Exhaustion",
  "summary": "Service experienced 15 minutes of downtime due to database connection pool exhaustion during traffic spike.",
  "impact": "All API endpoints returned 500 errors. Approximately 1,200 users affected.",
  "rootCause": "Connection pool size was insufficient for peak traffic. No auto-scaling configured.",
  "timeline": [
    {
      "time": "14:35",
      "description": "Traffic spike detected - 3x normal load"
    },
    {
      "time": "14:38",
      "description": "Database connections exhausted, errors begin"
    },
    {
      "time": "14:40",
      "description": "On-call engineer paged"
    },
    {
      "time": "14:45",
      "description": "Connection pool size increased manually"
    },
    {
      "time": "14:50",
      "description": "Service fully restored"
    }
  ],
  "actionItems": [
    {
      "description": "Implement connection pool monitoring with alerts",
      "owner": "engineering@example.com",
      "status": "TODO",
      "priority": "HIGH"
    },
    {
      "description": "Add auto-scaling for database connections",
      "owner": "devops@example.com",
      "status": "TODO",
      "priority": "HIGH"
    },
    {
      "description": "Review capacity planning procedures",
      "owner": "architecture@example.com",
      "status": "TODO",
      "priority": "MEDIUM"
    }
  ],
  "contributors": ["alice@example.com", "bob@example.com"],
  "status": "DRAFT"
}
```

## Post-Mortem Structure

### Essential Sections

1. **Title**
   - Clear, concise description
   - Include date/time
   - Example: "[Database] Production Outage - Jan 15, 2025"

2. **Summary**
   - One paragraph overview
   - What happened
   - Duration and impact
   - Resolution summary

3. **Impact**
   - Users affected (count/percentage)
   - Services impacted
   - Revenue/business impact
   - Duration of impact

4. **Root Cause**
   - Technical cause
   - Contributing factors
   - Why it wasn't caught earlier
   - Lessons learned

### Timeline

Chronological sequence of events:

```
14:35 - Traffic spike detected
14:38 - Errors begin appearing
14:40 - On-call engineer paged
14:42 - Root cause identified
14:45 - Mitigation applied
14:50 - Service restored
15:30 - Post-incident review held
```

### Action Items

Concrete steps to prevent recurrence:

- **Description**: What needs to be done
- **Owner**: Who's responsible
- **Status**: TODO, IN_PROGRESS, DONE
- **Priority**: HIGH, MEDIUM, LOW
- **Due Date**: Target completion

## Templates

### 1. Database Outage

Pre-filled template for database issues:
- Common timeline events
- Typical root causes
- Standard action items (monitoring, scaling, backups)

### 2. API Downtime

Template for API service disruptions:
- Deployment-related causes
- Load/performance issues
- Configuration problems

### 3. Security Incident

Template for security events:
- Vulnerability discovery
- Exploitation timeline
- Security response
- Audit and compliance actions

### 4. Deployment Failure

Template for deployment issues:
- Rollout timeline
- Rollback procedures
- Testing gaps
- CI/CD improvements

### 5. Third-Party Service Failure

Template for external dependency issues:
- Vendor communication
- Fallback procedures
- Circuit breaker patterns
- Alternative providers

## Status Workflow

### DRAFT
- Work in progress
- Not visible to all team members
- Can be edited freely

### IN_REVIEW
- Ready for team review
- Gathering feedback
- Refining action items

### PUBLISHED
- Final version
- Visible to all stakeholders
- Locked for editing (except action item status)

### ARCHIVED
- Historical reference
- Action items completed
- No longer active

## Blameless Culture

Post-mortems should be blameless:

✅ **Do:**
- Focus on systems and processes
- Identify contributing factors
- Learn from mistakes
- Improve resilience

❌ **Don't:**
- Blame individuals
- Punish human error
- Hide information
- Skip follow-up

## Best Practices

1. **Write Within 24 Hours**: Capture details while fresh
2. **Include All Perspectives**: Get input from all involved
3. **Be Specific**: Concrete timelines and facts
4. **Focus on Prevention**: Action items that prevent recurrence
5. **Follow Through**: Track action items to completion
6. **Review Regularly**: Check past post-mortems for patterns

## Exporting

### Markdown Export

```bash
GET /api/postmortems/{id}/export
```

Returns Markdown-formatted post-mortem for documentation systems.

**Example Output:**
```markdown
# [Database] Production Outage - Jan 15, 2025

## Summary
Service experienced 15 minutes of downtime...

## Impact
- 1,200 users affected
- All API endpoints unavailable
- Duration: 15 minutes

## Root Cause
Database connection pool exhaustion...

## Timeline
- 14:35 - Traffic spike detected
- 14:38 - Errors begin
...

## Action Items
- [ ] Implement connection pool monitoring (HIGH)
- [ ] Add auto-scaling (HIGH)
...
```

## Database Schema

```prisma
model PostMortem {
  id           String           @id
  incidentId   String
  title        String
  summary      String
  impact       String?
  rootCause    String?
  timeline     Json // Array of timeline events
  actionItems  Json // Array of action items
  contributors String[]
  status       PostMortemStatus
  publishedAt  DateTime?
  createdAt    DateTime
  createdBy    String
}
```

## API Reference

### List Post-Mortems

```bash
GET /api/postmortems
```

### Get Post-Mortem

```bash
GET /api/postmortems/{id}
```

### Create Post-Mortem

```bash
POST /api/postmortems
```

### Update Post-Mortem

```bash
PATCH /api/postmortems/{id}
```

### Delete Post-Mortem

```bash
DELETE /api/postmortems/{id}
```

### Export Post-Mortem

```bash
GET /api/postmortems/{id}/export
```

## Related Features

- [Incidents](../INCIDENTS.md) - Incident management
- [SLA Reports](./SLA_REPORTS.md) - Performance metrics
- [Monitors](../MONITORS.md) - Uptime monitoring

