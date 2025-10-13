import { prisma } from '@tokiflow/db';

/**
 * Cascade Suppression Service
 * 
 * Prevents alert fatigue by suppressing incidents for downstream monitors
 * when their upstream dependencies have failed.
 */

export interface CascadeCheckResult {
  shouldSuppress: boolean;
  reason?: string;
  affectedUpstream?: {
    id: string;
    name: string;
    incidentId: string;
  };
}

/**
 * Check if an incident should be suppressed due to upstream dependency failures
 * 
 * @param monitorId - The monitor that may have an incident
 * @param lookbackMinutes - How far back to look for upstream incidents (default 60)
 * @returns Cascade check result with suppression decision
 */
export async function checkCascadeSuppression(
  monitorId: string,
  lookbackMinutes: number = 60
): Promise<CascadeCheckResult> {
  const lookbackTime = new Date(Date.now() - lookbackMinutes * 60 * 1000);

  // Get all dependencies for this monitor
  const dependencies = await prisma.monitorDependency.findMany({
    where: {
      monitorId,
      required: true, // Only check required dependencies
    },
    include: {
      dependsOn: {
        include: {
          incidents: {
            where: {
              status: { in: ['OPEN', 'ACKED'] },
              kind: { in: ['FAIL', 'MISSED', 'LATE'] },
              openedAt: { gte: lookbackTime },
            },
            orderBy: {
              openedAt: 'desc',
            },
            take: 1,
          },
        },
      },
    },
  });

  // Check each dependency for active incidents
  for (const dep of dependencies) {
    const upstreamMonitor = dep.dependsOn;
    
    if (upstreamMonitor.incidents.length > 0) {
      const upstreamIncident = upstreamMonitor.incidents[0];
      
      return {
        shouldSuppress: true,
        reason: `Suppressed due to upstream dependency failure: ${upstreamMonitor.name} (${upstreamIncident.kind})`,
        affectedUpstream: {
          id: upstreamMonitor.id,
          name: upstreamMonitor.name,
          incidentId: upstreamIncident.id,
        },
      };
    }
  }

  return {
    shouldSuppress: false,
  };
}

/**
 * Create a suppressed incident (low severity, for tracking purposes)
 * 
 * @param monitorId - Monitor ID
 * @param kind - Incident kind
 * @param suppressionReason - Why the incident was suppressed
 * @param upstreamIncidentId - ID of the upstream incident causing suppression
 */
export async function createSuppressedIncident(
  monitorId: string,
  kind: 'FAIL' | 'MISSED' | 'LATE',
  suppressionReason: string,
  upstreamIncidentId?: string
): Promise<void> {
  await prisma.incident.create({
    data: {
      monitorId,
      kind,
      severity: 'LOW',
      summary: `[SUPPRESSED] ${suppressionReason}`,
      details: JSON.stringify({
        suppressed: true,
        reason: suppressionReason,
        upstreamIncidentId,
        timestamp: new Date(),
      }),
      // Don't trigger alerts for suppressed incidents
      suppressUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // Suppress for 24h
    },
  });
}

/**
 * Find all downstream monitors affected by an upstream failure
 * 
 * @param monitorId - The upstream monitor that failed
 * @returns List of affected downstream monitors
 */
export async function findAffectedDownstream(monitorId: string): Promise<
  Array<{
    id: string;
    name: string;
    required: boolean;
  }>
> {
  const downstreamDeps = await prisma.monitorDependency.findMany({
    where: {
      dependsOnId: monitorId,
    },
    include: {
      monitor: true,
    },
  });

  return downstreamDeps.map((dep) => ({
    id: dep.monitor.id,
    name: dep.monitor.name,
    required: dep.required,
  }));
}

/**
 * Create a composite alert for related failures across a dependency chain
 * 
 * @param rootMonitorId - The root cause monitor (upstream)
 * @param affectedMonitors - List of affected downstream monitors
 */
export async function createCompositeAlert(
  rootMonitorId: string,
  affectedMonitors: Array<{ id: string; name: string }>
): Promise<void> {
  const rootMonitor = await prisma.monitor.findUnique({
    where: { id: rootMonitorId },
  });

  if (!rootMonitor) return;

  // Create a special composite incident
  const affectedNames = affectedMonitors.map((m) => m.name).join(', ');
  
  await prisma.incident.create({
    data: {
      monitorId: rootMonitorId,
      kind: 'FAIL',
      severity: 'HIGH',
      summary: `Cascading failure: ${rootMonitor.name} failure affected ${affectedMonitors.length} downstream monitor(s)`,
      details: JSON.stringify({
        composite: true,
        rootMonitor: {
          id: rootMonitor.id,
          name: rootMonitor.name,
        },
        affectedMonitors: affectedMonitors.map((m) => ({
          id: m.id,
          name: m.name,
        })),
        affectedCount: affectedMonitors.length,
        timestamp: new Date(),
      }),
    },
  });
}

/**
 * Resolve suppressed incidents when upstream is fixed
 * 
 * @param monitorId - Monitor ID
 * @param upstreamIncidentId - The upstream incident that was resolved
 */
export async function resolveSuppressedIncidents(
  monitorId: string,
  upstreamIncidentId: string
): Promise<void> {
  await prisma.incident.updateMany({
    where: {
      monitorId,
      status: { in: ['OPEN', 'ACKED'] },
      details: {
        string_contains: upstreamIncidentId,
      },
    },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
    },
  });
}

/**
 * Get the dependency chain for a monitor (breadth-first traversal)
 * 
 * @param monitorId - Starting monitor ID
 * @param maxDepth - Maximum depth to traverse (default 5)
 * @returns Array of monitors in dependency order
 */
export async function getDependencyChain(
  monitorId: string,
  maxDepth: number = 5
): Promise<
  Array<{
    id: string;
    name: string;
    depth: number;
    path: string[];
  }>
> {
  const visited = new Set<string>();
  const queue: Array<{ id: string; depth: number; path: string[] }> = [
    { id: monitorId, depth: 0, path: [monitorId] },
  ];
  const result: Array<{ id: string; name: string; depth: number; path: string[] }> = [];

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.id) || current.depth > maxDepth) {
      continue;
    }

    visited.add(current.id);

    // Get monitor details
    const monitor = await prisma.monitor.findUnique({
      where: { id: current.id },
      include: {
        dependencies: {
          include: {
            dependsOn: true,
          },
        },
      },
    });

    if (!monitor) continue;

    result.push({
      id: monitor.id,
      name: monitor.name,
      depth: current.depth,
      path: current.path,
    });

    // Add dependencies to queue
    for (const dep of monitor.dependencies) {
      if (!visited.has(dep.dependsOn.id)) {
        queue.push({
          id: dep.dependsOn.id,
          depth: current.depth + 1,
          path: [...current.path, dep.dependsOn.id],
        });
      }
    }
  }

  return result;
}

/**
 * Detect circular dependencies in the dependency graph
 * 
 * @param monitorId - Starting monitor ID
 * @returns True if circular dependency detected, false otherwise
 */
export async function detectCircularDependency(monitorId: string): Promise<boolean> {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  async function dfs(currentId: string): Promise<boolean> {
    visited.add(currentId);
    recursionStack.add(currentId);

    const deps = await prisma.monitorDependency.findMany({
      where: { monitorId: currentId },
      select: { dependsOnId: true },
    });

    for (const dep of deps) {
      if (!visited.has(dep.dependsOnId)) {
        if (await dfs(dep.dependsOnId)) {
          return true;
        }
      } else if (recursionStack.has(dep.dependsOnId)) {
        // Circular dependency detected
        return true;
      }
    }

    recursionStack.delete(currentId);
    return false;
  }

  return await dfs(monitorId);
}

