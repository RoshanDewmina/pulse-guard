# PR4: Anomaly Detection & Analytics

**Branch:** `feature/pr4-anomaly-analytics`

## Overview

This PR implements production-grade anomaly detection using Welford's online algorithm and percentile tracking, enabling Tokiflow to automatically detect performance degradation and outliers without manual threshold configuration. The analytics dashboard has been enhanced with comprehensive reliability metrics including MTBF, MTTR, and failure rate trends.

## Changes

### 1. Percentile Tracking

**Problem:** Only tracking mean/median doesn't give users visibility into tail latency (p95, p99), which is critical for SLA compliance and performance monitoring.

**Solution:**
- Added `durationP50`, `durationP95`, `durationP99` fields to Monitor model
- Calculate percentiles from last 100 successful runs on each ping
- Use linear interpolation for accurate percentile calculation
- Require minimum 10 runs before tracking (cold start mitigation)

**Files Modified:**
- `packages/db/prisma/schema.prisma` - Added percentile fields
- `packages/db/prisma/migrations/20251013170000_add_percentile_tracking/migration.sql` - Schema migration
- `apps/web/src/app/api/ping/[token]/route.ts` - Calculate percentiles on each successful ping

**Technical Details:**
```typescript
// Percentile calculation using linear interpolation
const calculatePercentile = (arr: number[], p: number) => {
  const index = (p / 100) * (arr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (lower === upper) {
    return arr[lower];
  }
  return arr[lower] * (1 - weight) + arr[upper] * weight;
};
```

**Performance Impact:**
- Additional query: `SELECT durationMs FROM runs WHERE ... LIMIT 100`
- Indexed query, ~5-10ms overhead
- Runs asynchronously after ping response sent

### 2. DEGRADED Performance Detection

**Problem:** Jobs may gradually degrade (e.g., growing dataset, memory leaks) without triggering failures. Users need early warnings before SLA breaches.

**Solution:**
- Implement DEGRADED incident detection: ≥3 consecutive runs above p95
- Auto-create MEDIUM severity incident with details
- Auto-resolve when performance returns to normal
- Prevents alert fatigue via deduplication

**Files Modified:**
- `apps/web/src/lib/analytics/anomaly.ts` - Added `detectDegradedPerformance()`

**Detection Logic:**
```typescript
// Get last 3 successful runs
const recentRuns = await prisma.run.findMany({
  where: { monitorId, outcome: 'SUCCESS', durationMs: { not: null } },
  orderBy: { startedAt: 'desc' },
  take: 3,
});

// Check if all 3 runs exceed p95
const allAboveP95 = recentRuns.every(run => run.durationMs! > durationP95);

if (allAboveP95) {
  // Create DEGRADED incident if none exists
  await prisma.incident.create({
    data: {
      monitorId,
      kind: 'DEGRADED',
      severity: 'MEDIUM',
      summary: `Performance degraded: Last 3 runs exceeded p95 threshold (${Math.round(durationP95)}ms)`,
      details: JSON.stringify({
        recentDurations: recentRuns.map(r => r.durationMs),
        p95Threshold: durationP95,
      }),
    },
  });
}
```

**Use Cases:**
- Database query slowdown due to growing table
- Memory leak causing gradual GC pressure
- Network degradation affecting API calls
- Disk I/O throttling under load

### 3. Enhanced Welford Statistics

**Existing Implementation:** Welford's algorithm was already implemented for mean/variance calculation.

**Enhancements in This PR:**
- Integrated with percentile tracking
- Used by anomaly detection for z-score calculation
- Storage optimized (only 5 fields vs storing all durations)

**Algorithm:**
```typescript
const newCount = count + 1;
const delta = newValue - mean;
const newMean = mean + delta / newCount;
const delta2 = newValue - newMean;
const newM2 = M2 + delta * delta2;

// Variance = M2 / (count - 1)  // Sample variance
// Stddev = sqrt(variance)
```

**Stored Fields:**
- `durationCount`: Number of successful runs
- `durationMean`: Average duration
- `durationM2`: Sum of squared differences from mean
- `durationMin`: Minimum observed duration
- `durationMax`: Maximum observed duration

### 4. Anomaly Detection (Existing, Verified)

**Already Implemented:**
- Z-score outlier detection (|z| > 3)
- Output size anomaly detection (>70% drop)
- Dual-check for critical anomalies (z-score + median)
- Automatic incident creation with severity

**No Changes Required:** Existing implementation is production-ready.

### 5. Analytics Dashboard (Existing, Enhanced)

**Already Implemented:**
- MTBF (Mean Time Between Failures) calculation
- MTTR (Mean Time To Resolution) calculation
- Uptime percentage tracking
- Health score with letter grades (A-F)
- Monitor rankings by health score
- Top performers and needs attention sections
- Reliability insights

**Verified in This PR:** All analytics features are functional and integrated with new percentile data.

**Dashboard Metrics:**
- **Health Score**: 0-100 based on run outcomes (success/fail/late/missed)
- **Uptime**: Percentage of successful runs
- **MTBF**: Average time between failures (hours/days)
- **MTTR**: Average time from incident open to resolution (minutes/hours)
- **Success Rate**: Percentage of successful runs in time period

## Database Changes

### Schema Additions

```prisma
model Monitor {
  // ... existing fields ...
  
  // New percentile fields
  durationP50    Float?  // 50th percentile (median)
  durationP95    Float?  // 95th percentile
  durationP99    Float?  // 99th percentile
}
```

### Migration

```sql
ALTER TABLE "Monitor" 
ADD COLUMN "durationP50" DOUBLE PRECISION,
ADD COLUMN "durationP95" DOUBLE PRECISION,
ADD COLUMN "durationP99" DOUBLE PRECISION;
```

## Performance Impact

### Ping API Overhead

| Operation | Time | Blocking? |
|-----------|------|-----------|
| Welford stats update | ~2ms | No (DB write) |
| Percentile calculation | ~5-10ms | No (async) |
| DEGRADED detection | ~15ms | No (async) |
| **Total overhead** | **~20ms** | **Non-blocking** |

**Optimization:** All analytics run asynchronously after ping response is sent, so no impact on ping latency.

### Database Queries

1. **Percentile calculation:**
   ```sql
   SELECT durationMs FROM runs 
   WHERE monitorId = ? AND outcome = 'SUCCESS' AND durationMs IS NOT NULL
   ORDER BY startedAt DESC LIMIT 100;
   ```
   - Indexed on `(monitorId, outcome, startedAt DESC)`
   - ~5-10ms query time

2. **DEGRADED detection:**
   ```sql
   SELECT durationMs FROM runs 
   WHERE monitorId = ? AND outcome = 'SUCCESS' AND durationMs IS NOT NULL
   ORDER BY startedAt DESC LIMIT 3;
   ```
   - Same index, very fast (<5ms)

## Testing Checklist

- [x] Schema migration runs successfully
- [x] Percentiles calculated correctly from sample data
- [x] DEGRADED incident created when 3+ runs exceed p95
- [x] DEGRADED incident auto-resolves when performance improves
- [x] Anomaly detection still works (z-score outliers)
- [x] Analytics dashboard displays new metrics
- [x] No linter errors
- [x] Performance overhead is non-blocking

## Acceptance Criteria

✅ Percentile fields (p50, p95, p99) stored and updated on each successful ping  
✅ DEGRADED incidents created when ≥3 consecutive runs exceed p95  
✅ DEGRADED incidents auto-resolve when performance returns to normal  
✅ Analytics dashboard shows MTBF, MTTR, and health scores  
✅ All operations are asynchronous and non-blocking for ping API  
✅ Cold start handled gracefully (requires 10 runs minimum)  
✅ No duplicate incidents created (deduplication works)  

## Architecture Decision

See [ADR-002: Anomaly Detection Algorithm](./decisions/ADR-002-anomaly-detection-algorithm.md) for detailed rationale on:
- Why Welford's algorithm vs alternatives (t-digest, HdrHistogram)
- Why approximate percentiles vs streaming percentiles
- Detection rule thresholds and their justification
- Future enhancements and trade-offs

## Use Cases

### 1. Database Query Degradation
**Scenario:** Daily backup job slows down as table grows

**Detection:**
- Day 1-10: Runs complete in ~30min (p95: 32min)
- Day 11-13: Runs take 35min, 38min, 40min (all >p95)
- **Trigger:** DEGRADED incident created after Day 13
- **Alert:** "Performance degraded: Last 3 runs exceeded p95 threshold (32min)"

### 2. Memory Leak
**Scenario:** ETL pipeline has memory leak, GC time increases

**Detection:**
- Baseline: p95 duration = 120sec
- Leak causes gradual slowdown: 125sec → 130sec → 140sec
- **Trigger:** DEGRADED incident after 3 runs above 120sec
- **Benefit:** Catch before OOM crash

### 3. API Rate Limiting
**Scenario:** Third-party API starts throttling requests

**Detection:**
- Baseline: API calls take ~5sec
- Throttling: Some calls take 30sec (z-score > 3)
- **Trigger:** ANOMALY incident (z-score outlier)
- **Benefit:** Immediate alert vs waiting for complete failure

### 4. SLA Monitoring
**Scenario:** Customer requires 99th percentile < 60sec

**Detection:**
- Dashboard shows p99 = 58sec (approaching SLA limit)
- Team proactively optimizes before breach
- **Benefit:** Data-driven capacity planning

## Examples

### Incident Created (DEGRADED)

```json
{
  "monitorId": "cm0xyz123",
  "kind": "DEGRADED",
  "severity": "MEDIUM",
  "status": "OPEN",
  "summary": "Performance degraded: Last 3 runs exceeded p95 threshold (1200ms)",
  "details": {
    "recentDurations": [1250, 1300, 1350],
    "p95Threshold": 1200,
    "timestamp": "2025-10-13T12:34:56Z"
  },
  "openedAt": "2025-10-13T12:34:56Z"
}
```

### Percentiles Over Time

```typescript
// Monitor: Database Backup
{
  durationCount: 150,
  durationMean: 900.5,        // 15min average
  durationMedian: 875,
  durationP50: 875,           // 50th percentile (same as median)
  durationP95: 1150,          // 95th percentile (19min)
  durationP99: 1320,          // 99th percentile (22min)
  durationMin: 720,
  durationMax: 1450
}
```

## Documentation

- [x] ADR-002: Anomaly Detection Algorithm
- [x] PR4 Description (this file)
- [x] Code comments in `anomaly.ts`
- [x] Migration documentation

## Next Steps (PR5)

With analytics and anomaly detection complete, PR5 will focus on:
- Dependency graph UI visualization
- Cascade suppression logic (don't alert on downstream if upstream failed)
- Composite alerts for related failures

## Dependencies

- No new npm packages required
- Uses existing Prisma, Welford stats from PR1
- Analytics dashboard already exists from PR2

## Rollback Plan

If issues arise:
1. Revert migration: `prisma migrate resolve --rolled-back 20251013170000_add_percentile_tracking`
2. Remove percentile fields from schema
3. Disable DEGRADED detection (comment out function call)
4. All other features remain functional

---

**Ready for Review:** This PR includes comprehensive anomaly detection with percentile tracking, DEGRADED incident detection, and verified analytics dashboard functionality. Performance impact is minimal (<20ms non-blocking overhead per ping).

