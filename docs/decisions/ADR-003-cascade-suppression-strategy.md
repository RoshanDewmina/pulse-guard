# ADR-003: Cascade Suppression Strategy

**Status:** Accepted  
**Date:** 2025-10-13  
**Decision Makers:** Engineering Team, SRE Team  
**Related:** PR5 - Dependencies & Cascade Handling

## Context

When monitors have dependencies (e.g., "API Health Check" depends on "Database Backup"), a failure in an upstream monitor often causes downstream monitors to fail as well. This leads to:
- **Alert fatigue**: Multiple alerts for a single root cause
- **Wasted time**: Engineers investigate downstream failures when the real issue is upstream
- **Confusion**: Difficult to identify the actual root cause among many alerts
- **Operational overhead**: More incidents to triage, acknowledge, and resolve

### Example Scenario

```
Database Server (upstream)
    ↓
Database Backup (depends on Database Server)
    ↓
API Health Check (depends on Database Backup)
    ↓
Daily Report Generator (depends on API Health Check)
```

If the Database Server fails:
1. Database Backup fails (can't connect)
2. API Health Check fails (no recent backup data)
3. Daily Report Generator fails (API unavailable)

**Result**: 4 incidents created, 4 alerts fired, but only 1 root cause.

## Decision

We will implement **intelligent cascade suppression** with the following strategy:

### 1. Dependency Model Enhancement

Add `cascadeReason` field to `MonitorDependency`:
```prisma
model MonitorDependency {
  id             String   @id
  monitorId      String   // Dependent monitor
  dependsOnId    String   // Dependency
  required       Boolean  @default(true)
  cascadeReason  String?  // Reason for suppression
  // ...
}
```

**Purpose**: Track why a monitor's incident was suppressed for audit/debugging.

### 2. Cascade Suppression Rules

**When a monitor fails:**
1. Check all **required** dependencies (upstream monitors)
2. Look back **60 minutes** for upstream incidents
3. If upstream has `OPEN` or `ACKED` incident of type `FAIL`, `MISSED`, or `LATE`:
   - **Suppress the downstream incident**
   - Create a `LOW` severity suppressed incident (for tracking)
   - Store suppression reason and upstream incident ID

**Suppressed Incident Properties:**
```typescript
{
  kind: 'FAIL',
  severity: 'LOW',
  summary: '[SUPPRESSED] Upstream dependency failure: Database Server (FAIL)',
  suppressUntil: Date.now() + 24h,
  details: {
    suppressed: true,
    reason: '...',
    upstreamIncidentId: 'xyz',
  }
}
```

**Key Point**: Suppressed incidents don't trigger alerts but are logged for visibility.

### 3. Composite Alerts

**When an upstream monitor fails:**
1. Find all downstream monitors affected
2. If ≥1 downstream monitors exist:
   - Create a **HIGH** severity composite alert on the upstream monitor
   - List all affected downstream monitors in the incident

**Composite Incident Properties:**
```typescript
{
  kind: 'FAIL',
  severity: 'HIGH',
  summary: 'Cascading failure: Database Server failure affected 3 downstream monitors',
  details: {
    composite: true,
    affectedMonitors: [
      { id: '...', name: 'Database Backup' },
      { id: '...', name: 'API Health Check' },
      { id: '...', name: 'Daily Report' },
    ],
    affectedCount: 3,
  }
}
```

**Benefit**: Single alert clearly identifies root cause AND impact scope.

### 4. Auto-Resolution

When an upstream incident is resolved, automatically resolve all suppressed downstream incidents that reference it.

```typescript
await resolveSuppressedIncidents(monitorId, upstreamIncidentId);
```

### 5. Circular Dependency Detection

Prevent infinite loops by detecting circular dependencies:
```typescript
async function detectCircularDependency(monitorId: string): Promise<boolean> {
  // DFS with recursion stack to detect cycles
}
```

**Enforcement**: Warn users when attempting to create circular dependencies.

## Alternatives Considered

### A. No Suppression (Status Quo)
- **Pros**: Simple, every failure creates an incident
- **Cons**: Alert fatigue, difficult to identify root cause
- **Verdict**: Rejected - not scalable for complex systems

### B. Suppress All Downstream Incidents
- **Pros**: Clean alert queue, focus on root cause
- **Cons**: Loss of visibility into which monitors were affected
- **Verdict**: Rejected - we need visibility for impact assessment

### C. Deferred Alerting (Wait N minutes before alerting)
- **Pros**: Upstream failure may resolve before downstream alerts fire
- **Cons**: Delays incident detection, complex timing logic
- **Verdict**: Rejected - prefer immediate suppression with visibility

### D. User-Configurable Suppression Rules
- **Pros**: Flexible, users define their own rules
- **Cons**: Complex UI, high cognitive load, error-prone
- **Verdict**: Rejected for v1 - can be added later as advanced feature

### E. Probabilistic Suppression (ML-based)
- **Pros**: Can learn patterns over time
- **Cons**: Black box, requires training data, unpredictable
- **Verdict**: Rejected - rule-based approach is more transparent

## Implementation Details

### Cascade Check Flow

```typescript
// On monitor failure:
1. checkCascadeSuppression(monitorId)
   ↓
2. Find dependencies with required=true
   ↓
3. Query upstream incidents (last 60 min, status=OPEN/ACKED)
   ↓
4. If upstream incident exists:
   → Create suppressed incident (LOW severity)
   → Skip normal alert pipeline
   Else:
   → Create normal incident
   → Check if downstream monitors exist
   → If yes: Create composite alert
```

### Database Queries

**Cascade Check (per incident):**
```sql
SELECT m.*, i.*
FROM monitor_dependencies d
JOIN monitors m ON d.depends_on_id = m.id
LEFT JOIN incidents i ON i.monitor_id = m.id
WHERE d.monitor_id = ?
  AND d.required = true
  AND i.status IN ('OPEN', 'ACKED')
  AND i.kind IN ('FAIL', 'MISSED', 'LATE')
  AND i.opened_at >= NOW() - INTERVAL '60 minutes'
ORDER BY i.opened_at DESC
LIMIT 1;
```

**Find Affected Downstream:**
```sql
SELECT m.id, m.name, d.required
FROM monitor_dependencies d
JOIN monitors m ON d.monitor_id = m.id
WHERE d.depends_on_id = ?;
```

**Performance**: Both queries use indexed foreign keys, typically <5ms.

### Lookback Window Rationale

**60 minutes** was chosen because:
- Typical incident response time: 15-60 minutes
- Balances sensitivity (catching cascades) vs specificity (avoiding false suppression)
- Can be made configurable per org in future

## Consequences

### Positive

1. **Reduced Alert Fatigue**
   - Only root cause monitors trigger full alerts
   - Teams can focus on actual issues

2. **Faster Incident Response**
   - Composite alerts immediately show impact scope
   - No need to manually trace dependencies

3. **Better Visibility**
   - Suppressed incidents logged for audit trail
   - Dependency graph visualizes relationships

4. **Automatic Cleanup**
   - Resolving upstream auto-resolves downstream
   - No manual cleanup needed

5. **Transparent Logic**
   - Rule-based, easy to understand and debug
   - Clear suppression reasons in incident details

### Negative

1. **Potential for Over-Suppression**
   - If dependency relationship is misconfigured, legitimate incidents may be suppressed
   - **Mitigation**: Suppressed incidents are still logged; users can review them

2. **Additional Complexity**
   - More code paths, more potential bugs
   - **Mitigation**: Comprehensive tests, ADR documentation

3. **Database Load**
   - Extra queries per incident
   - **Mitigation**: Queries are indexed, fast (<5ms), async

4. **Edge Cases**
   - Concurrent failures may race
   - Circular dependencies must be prevented
   - **Mitigation**: Transaction isolation, circular detection

### Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| False suppression | High | Low | Log suppressed incidents, easy to review |
| Performance degradation | Medium | Low | Indexed queries, async processing |
| Circular dependencies crash | High | Low | Pre-check with DFS cycle detection |
| 60min window too narrow | Medium | Medium | Make configurable in future |
| Users don't understand suppression | Medium | Medium | Clear UI messaging, documentation |

## Monitoring & Metrics

Track the following metrics to evaluate effectiveness:

1. **Suppression Rate**: `suppressed_incidents / total_incidents`
   - Target: 20-40% for systems with dependencies
   - Concern if: >60% (over-suppression) or <5% (rules too strict)

2. **Composite Alert Rate**: `composite_alerts / upstream_failures`
   - Target: >80% for monitors with downstream deps
   - Indicates how often cascades are detected

3. **False Suppression Rate**: User-reported incidents that were incorrectly suppressed
   - Target: <2%
   - Requires user feedback mechanism

4. **Incident Resolution Time**: Before/after cascade suppression
   - Hypothesis: Should decrease by 20-30%

## Rollout Plan

### Phase 1: Schema & Backend (Week 1)
- [x] Add `cascadeReason` field
- [x] Implement cascade suppression service
- [x] Integrate into ping API
- [x] Add circular dependency detection

### Phase 2: UI & Visualization (Week 2)
- [x] Dependency graph component
- [x] Dependencies page
- [ ] Suppressed incidents filter in dashboard
- [ ] Composite alert UI enhancements

### Phase 3: Testing & Monitoring (Week 3)
- [ ] Unit tests for all suppression logic
- [ ] Integration tests for cascade scenarios
- [ ] Monitor suppression metrics
- [ ] Documentation for end users

### Phase 4: Gradual Rollout (Week 4)
- [ ] Enable for opt-in beta customers
- [ ] Collect feedback
- [ ] Tune lookback window if needed
- [ ] General availability

## Future Enhancements

1. **Configurable Lookback Window**: Per-org or per-dependency setting
2. **Dependency Templates**: Pre-defined patterns (e.g., "3-tier web app")
3. **Smart Suppression**: ML-based confidence scoring
4. **Dependency Health Dashboard**: Aggregate view of all cascades
5. **Webhook Notifications**: Alert when cascades are detected
6. **Time-Based Dependencies**: "Monitor A must run before Monitor B within 2 hours"

## References

- [Datadog Composite Monitors](https://docs.datadoghq.com/monitors/types/composite/)
- [PagerDuty Event Intelligence](https://support.pagerduty.com/docs/event-intelligence)
- [Google SRE Book - Cascading Failures](https://sre.google/sre-book/addressing-cascading-failures/)
- [Netflix Chaos Engineering - Dependency Failures](https://netflixtechblog.com/tagged/chaos-engineering)

## Approval

- [x] Engineering Lead
- [x] SRE Team
- [x] Product Manager

**Approved:** 2025-10-13  
**Implementation PR:** #PR5

