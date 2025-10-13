# ADR-002: Anomaly Detection Algorithm

**Status:** Accepted  
**Date:** 2025-10-13  
**Decision Makers:** Engineering Team  
**Related:** PR4 - Anomaly Detection & Analytics

## Context

Tokiflow needs to automatically detect performance anomalies in scheduled jobs beyond simple success/failure monitoring. Jobs may:
- Experience sudden duration spikes (e.g., database lock, network issues)
- Gradually degrade over time (e.g., growing data, memory leaks)
- Have intermittent slowdowns that don't cause failures

We need a lightweight, incremental algorithm that:
1. Works with minimal memory footprint (no need to store all historical durations)
2. Detects both sudden spikes (outliers) and gradual degradation
3. Requires minimal computational overhead per ping
4. Avoids false positives from natural variance

## Decision

We will implement a dual-detection strategy:

### 1. Welford's Online Algorithm for Statistics

**Choice:** Use [Welford's online algorithm](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm) to incrementally compute mean and variance.

**Rationale:**
- **Memory efficient**: Only stores 5 values (count, mean, M2, min, max) instead of all historical durations
- **Numerically stable**: Avoids catastrophic cancellation in variance calculation
- **Incremental**: Updates on each ping without recomputing from scratch
- **Industry standard**: Used by Prometheus, Grafana, and other monitoring tools

**Implementation:**
```typescript
const newCount = count + 1;
const delta = newValue - mean;
const newMean = mean + delta / newCount;
const delta2 = newValue - newMean;
const newM2 = M2 + delta * delta2;
const variance = newM2 / (newCount - 1);  // Sample variance
const stddev = sqrt(variance);
```

**Storage:**
- `durationCount`: Number of successful runs
- `durationMean`: Average duration (milliseconds)
- `durationM2`: Sum of squared differences from mean (for variance calculation)
- `durationMin`: Minimum observed duration
- `durationMax`: Maximum observed duration

### 2. Percentile Tracking (Approximate)

**Choice:** Calculate p50, p95, p99 from a rolling window of the last 100 successful runs.

**Rationale:**
- **Simple and accurate enough**: Small window provides recent baseline
- **Doesn't require specialized data structures**: No need for t-digest or HdrHistogram
- **Query performance**: Only fetches 100 records, sorted on indexed `startedAt` field
- **Trade-off**: Slightly less accurate than streaming percentiles, but sufficient for our use case

**Implementation:**
```typescript
const recentRuns = await prisma.run.findMany({
  where: { monitorId, outcome: 'SUCCESS', durationMs: { not: null } },
  select: { durationMs: true },
  orderBy: { startedAt: 'desc' },
  take: 100,
});

const durations = recentRuns.map(r => r.durationMs!).sort((a, b) => a - b);
const p95 = calculatePercentile(durations, 95);
```

**Storage:**
- `durationP50`: 50th percentile (median)
- `durationP95`: 95th percentile
- `durationP99`: 99th percentile

### 3. Anomaly Detection Rules

**Rule 1: Outlier Detection (z-score)**
- **Trigger**: `|z-score| > 3` where `z = (duration - mean) / stddev`
- **Severity**: `WARNING`
- **Minimum data**: 10 successful runs
- **Incident type**: `ANOMALY`

**Rule 2: Critical Outlier (z-score + median)**
- **Trigger**: `z-score > 3 AND duration > median * 1.5`
- **Severity**: `CRITICAL`
- **Rationale**: Dual check reduces false positives

**Rule 3: Degraded Performance**
- **Trigger**: ≥3 consecutive successful runs above p95
- **Severity**: `MEDIUM`
- **Incident type**: `DEGRADED`
- **Auto-resolve**: When next run is below p95

**Rule 4: Upper Bound Check**
- **Trigger**: `duration > mean + (3 * stddev)`
- **Severity**: `WARNING`
- **Rationale**: Alternative check for systems with low variance

### 4. Output Size Anomaly (Supplemental)

**Rule**: Output size drops >70% compared to 7-run average
- **Severity**: `WARNING`
- **Use case**: Detect partial job failures (e.g., incomplete backups, truncated logs)

## Alternatives Considered

### A. T-Digest / HdrHistogram
- **Pros**: Accurate streaming percentiles, memory-efficient
- **Cons**: Requires external library, more complex to implement, overkill for our scale
- **Verdict**: Rejected - Not needed for <1M pings/minute per monitor

### B. Fixed Percentile Buckets (Prometheus-style)
- **Pros**: Fast lookups, constant memory
- **Cons**: Less accurate, requires predefined buckets, harder to visualize
- **Verdict**: Rejected - Our approach is more flexible

### C. Exponentially Weighted Moving Average (EWMA)
- **Pros**: Gives more weight to recent data
- **Cons**: Doesn't provide percentiles, less intuitive for users
- **Verdict**: Rejected - Percentiles are more actionable

### D. Machine Learning (Isolation Forest, LSTM)
- **Pros**: Can detect complex patterns
- **Cons**: Computationally expensive, requires training data, black box for users
- **Verdict**: Rejected - Overkill and not real-time

## Consequences

### Positive
- **Automatic detection**: Users don't need to set up custom thresholds
- **Low overhead**: <5ms per ping for statistics update
- **Self-tuning**: Adapts to each monitor's baseline automatically
- **Actionable alerts**: Clear z-score and percentile thresholds
- **Memory efficient**: Only stores 5 numbers + 100 recent durations (for percentiles)

### Negative
- **Cold start**: Requires 10 runs before anomaly detection activates
- **Approximate percentiles**: Last 100 runs may miss long-term trends
- **Fixed thresholds**: z-score=3 and p95 may not suit all workloads
- **DB queries**: Fetching 100 runs on each ping adds latency (~5-10ms)

### Mitigations
- **Cold start**: Acceptable - most monitors run frequently enough
- **Percentile accuracy**: Trade-off for simplicity; users can view full history in dashboard
- **Fixed thresholds**: Can be made configurable per monitor in future
- **DB queries**: 
  - Query is indexed and cached
  - Runs asynchronously (non-blocking for ping response)
  - Consider Redis cache for high-frequency monitors (future optimization)

## Implementation Notes

### Database Indexes
```sql
CREATE INDEX idx_runs_monitor_outcome_started 
  ON runs(monitor_id, outcome, started_at DESC);
```

### When to Update Statistics
- **Welford stats**: On every successful ping
- **Percentiles**: On every successful ping (recalculated from last 100)
- **Anomaly check**: After run is recorded (async, non-blocking)

### Deduplication
- Check for existing ANOMALY/DEGRADED incidents in last hour before creating new ones
- Use `dedupeHash` to prevent spam

### Performance Budget
- Statistics update: <2ms
- Percentile calculation: <10ms
- Anomaly detection: <20ms (async)
- Total: <35ms overhead per successful ping (non-blocking)

## References

- [Welford's Online Algorithm](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm)
- [Calculating Percentiles on Streaming Data](https://www.stevenengelhardt.com/data/calculating-percentiles-on-streaming-data/)
- [Outlier Detection with Z-Score](https://en.wikipedia.org/wiki/Standard_score#Interpretation)
- [HdrHistogram](http://hdrhistogram.org/) - Considered but not needed for our scale
- [Prometheus Rate vs Irate](https://prometheus.io/docs/prometheus/latest/querying/functions/#rate) - Inspiration for EWMA alternative

## Future Enhancements

1. **Configurable thresholds**: Allow users to set custom z-score thresholds per monitor
2. **Seasonal detection**: Detect daily/weekly patterns and adjust baselines
3. **Redis caching**: Cache last 100 runs for high-frequency monitors
4. **Streaming percentiles**: Migrate to t-digest for more accurate p95/p99
5. **Anomaly severity scoring**: Weighted score based on multiple factors
6. **User feedback**: Allow users to mark false positives to tune detection

## Approval

- [x] Engineering Lead
- [x] Product Manager
- [x] SRE Team

**Approved:** 2025-10-13  
**Implementation PR:** #PR4

