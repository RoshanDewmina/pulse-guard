# ADR-001: Per-Monitor BullMQ Missed Detection

## Status
Accepted

## Context
The original implementation used a global 60-second scanner that checked all monitors for missed runs. While functional, this approach had several limitations:

1. **Latency**: Monitors could be flagged as MISSED up to 60 seconds after the grace period expired
2. **Inefficiency**: All monitors were scanned every 60 seconds, regardless of their schedule
3. **Scalability**: With thousands of monitors, the scanner could become a bottleneck
4. **Precision**: Grace periods shorter than the scan interval couldn't be honored accurately

## Decision
We have implemented a **per-monitor delayed job system** using BullMQ where:

1. Each successful ping schedules a unique check-missed job for that specific monitor
2. The job is scheduled to run at `nextExpectedAt + gracePeriod`
3. Job ID format: `check-missed-{monitorId}-{nextExpectedAt.timestamp}`
4. Previous check-missed jobs for the same monitor are removed when a new ping arrives
5. The global scanner remains as a fallback safety net but is optional

### Architecture

```
Ping API (/api/ping/:token)
    ↓
Calculate nextDueAt
    ↓
Schedule BullMQ Job
    delay: (nextDueAt + grace) - now
    jobId: check-missed-{monitorId}-{timestamp}
    ↓
[Wait for delay]
    ↓
Check-Missed Worker
    ↓
Verify no recent ping exists
    ↓
Create MISSED incident + alert
```

### Implementation Details

**Queue Configuration:**
- Queue Name: `check-missed`
- Concurrency: 10 workers
- Rate Limit: 100 jobs/second
- Job Options:
  - `removeOnComplete: true` (cleanup successful checks)
  - `removeOnFail: false` (keep failed jobs for debugging)

**Cascade Suppression:**
The check-missed worker implements smart cascade handling:
- Checks for upstream dependency failures before creating incidents
- If upstream failed, creates incident with lower severity (MEDIUM vs HIGH)
- Adds `cascadeReason: "upstream-{monitorId}"` for tracking
- Skips alert dispatch for cascaded failures (reduces noise)

**Maintenance Windows:**
The worker respects maintenance windows:
- Checks for active maintenance windows before flagging MISSED
- Supports both monitor-specific and org-wide maintenance
- No incidents created during maintenance periods

## Consequences

### Positive
- **Precise timing**: Incidents created exactly when grace period expires
- **Efficient**: Only processes monitors that need checking
- **Scalable**: Distributes load across time as monitors report
- **Flexible**: Per-monitor grace periods honored accurately
- **Resilient**: Jobs persist in Redis if worker temporarily down

### Negative
- **Redis dependency**: Requires stable Redis for delayed jobs
- **Job cleanup**: Need to ensure old jobs are cleaned up properly
- **Complexity**: More moving parts than simple scanner

### Mitigations
- Keep global scanner as fallback (runs every 5 minutes instead of 60s)
- Monitor BullMQ queue health via metrics
- Implement job TTL to auto-cleanup old jobs (24 hours)
- Add alerts for queue lag > 5 minutes

## Migration Path
1. Deploy new code with check-missed worker enabled
2. Monitor both systems in parallel for 7 days
3. Verify incident detection accuracy (no false positives/negatives)
4. Disable global scanner or reduce frequency to 5 minutes
5. Monitor queue metrics and adjust concurrency if needed

## Related
- Implementation: `apps/worker/src/jobs/check-missed.ts`
- Queue setup: `apps/worker/src/queues.ts`
- Ping API: `apps/web/src/app/api/ping/[token]/route.ts`
- Schema: `packages/db/prisma/schema.prisma` (Incident, Run models)

## Date
2025-10-13

## Authors
- Staff+ Engineering Team

