import { prisma } from '@tokiflow/db';
import { getWelfordStats, calculateZScore, isOutlier, calculateMedian } from './welford';

type MonitorStats = {
  durationCount: number;
  durationMean: number | null;
  durationM2: number | null;
  durationMedian: number | null;
  durationMin: number | null;
  durationMax: number | null;
};

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  type?: 'duration' | 'output_size';
  severity?: 'warning' | 'critical';
  expected?: number;
  actual: number;
  zScore?: number;
  threshold?: number;
  message?: string;
}

/**
 * Detect if a run's duration is anomalous
 * 
 * Rules:
 * 1. Requires minimum 10 successful runs
 * 2. Duration > median * 1.5 AND z-score > 3 (critical)
 * 3. Duration > mean + (3 * stddev) (warning)
 */
export async function detectDurationAnomaly(
  monitor: MonitorStats,
  durationMs: number
): Promise<AnomalyDetectionResult> {
  const { durationCount, durationMean, durationM2, durationMedian, durationMin, durationMax } = monitor;

  // Need at least 10 runs for reliable anomaly detection
  if (durationCount < 10) {
    return { isAnomaly: false, actual: durationMs };
  }

  const stats = getWelfordStats(durationCount, durationMean, durationM2, durationMin, durationMax);

  if (!stats.mean || !stats.stddev) {
    return { isAnomaly: false, actual: durationMs };
  }

  // Rule 1: Check z-score (how many standard deviations from mean)
  const zScore = calculateZScore(durationMs, stats.mean, stats.stddev);
  const isZScoreOutlier = zScore !== null && Math.abs(zScore) > 3;

  // Rule 2: Check if duration is significantly higher than median
  const isMedianOutlier = durationMedian !== null && durationMs > durationMedian * 1.5;

  // Critical anomaly: Both z-score and median checks fail
  if (isZScoreOutlier && isMedianOutlier) {
    return {
      isAnomaly: true,
      type: 'duration',
      severity: 'critical',
      expected: Math.round(stats.mean),
      actual: durationMs,
      zScore: zScore!,
      threshold: 3.0,
      message: `Job took ${durationMs}ms (${Math.abs(zScore!).toFixed(1)}σ from mean). Expected ~${Math.round(stats.mean)}ms.`,
    };
  }

  // Warning: Just z-score check fails
  if (isZScoreOutlier) {
    return {
      isAnomaly: true,
      type: 'duration',
      severity: 'warning',
      expected: Math.round(stats.mean),
      actual: durationMs,
      zScore: zScore!,
      threshold: 3.0,
      message: `Job took ${durationMs}ms, which is ${Math.abs(zScore!).toFixed(1)} standard deviations from mean (${Math.round(stats.mean)}ms).`,
    };
  }

  // Rule 3: Check slow degradation (mean + 3*stddev)
  const upperBound = stats.mean + (3 * stats.stddev);
  if (durationMs > upperBound) {
    return {
      isAnomaly: true,
      type: 'duration',
      severity: 'warning',
      expected: Math.round(stats.mean),
      actual: durationMs,
      message: `Job took ${durationMs}ms, significantly higher than expected range (${Math.round(upperBound)}ms threshold).`,
    };
  }

  return { isAnomaly: false, actual: durationMs };
}

/**
 * Detect if output size dropped significantly
 * 
 * Rule: Size drops >70% vs 7-run average
 */
export async function detectOutputSizeAnomaly(
  monitorId: string,
  sizeBytes: number | null
): Promise<AnomalyDetectionResult> {
  if (sizeBytes === null) {
    return { isAnomaly: false, actual: 0 };
  }

  // Get last 7 runs with output
  const recentRuns = await prisma.run.findMany({
    where: {
      monitorId,
      sizeBytes: { not: null },
    },
    select: {
      sizeBytes: true,
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: 7,
  });

  if (recentRuns.length < 3) {
    // Need at least 3 runs for comparison
    return { isAnomaly: false, actual: sizeBytes };
  }

  const sizes = recentRuns.map(r => r.sizeBytes!).filter(s => s > 0);
  if (sizes.length < 3) {
    return { isAnomaly: false, actual: sizeBytes };
  }

  const avgSize = sizes.reduce((a, b) => a + b, 0) / sizes.length;

  // Check if current size is <30% of average (70% drop)
  const dropPercentage = ((avgSize - sizeBytes) / avgSize) * 100;
  
  if (dropPercentage > 70) {
    return {
      isAnomaly: true,
      type: 'output_size',
      severity: 'warning',
      expected: Math.round(avgSize),
      actual: sizeBytes,
      message: `Output size dropped ${dropPercentage.toFixed(0)}% (${sizeBytes} bytes vs expected ${Math.round(avgSize)} bytes). May indicate partial failure.`,
    };
  }

  return { isAnomaly: false, actual: sizeBytes };
}

/**
 * Create an anomaly incident
 */
export async function createAnomalyIncident(
  monitorId: string,
  runId: string,
  anomaly: AnomalyDetectionResult
): Promise<void> {
  const dedupeHash = `anomaly-${monitorId}-${anomaly.type}-${Date.now()}`;

  // Check for recent anomaly incident to avoid spam
  const recentIncident = await prisma.incident.findFirst({
    where: {
      monitorId,
      kind: 'ANOMALY',
      status: {
        in: ['OPEN', 'ACKED'],
      },
      openedAt: {
        gte: new Date(Date.now() - 3600000), // Last hour
      },
    },
  });

  if (recentIncident) {
    // Update existing incident with new details
    await prisma.incident.update({
      where: { id: recentIncident.id },
      data: {
        summary: anomaly.message || 'Performance anomaly detected',
        details: JSON.stringify({
          type: anomaly.type,
          severity: anomaly.severity,
          expected: anomaly.expected,
          actual: anomaly.actual,
          zScore: anomaly.zScore,
          runId,
          timestamp: new Date(),
        }),
      },
    });
    return;
  }

  // Create new anomaly incident
  await prisma.incident.create({
    data: {
          id: crypto.randomUUID(),
        monitorId,
      kind: 'ANOMALY',
      summary: anomaly.message || 'Performance anomaly detected',
      details: JSON.stringify({
        type: anomaly.type,
        severity: anomaly.severity,
        expected: anomaly.expected,
        actual: anomaly.actual,
        zScore: anomaly.zScore,
        runId,
        timestamp: new Date(),
      }),
      dedupeHash,
    },
  });
}

/**
 * Main anomaly detection function
 * Call this after recording a successful run
 */
export async function checkForAnomalies(
  monitorId: string,
  runId: string,
  durationMs: number | null,
  sizeBytes: number | null
): Promise<void> {
  // Fetch monitor with statistics
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
  });

  if (!monitor) return;

  const anomalies: AnomalyDetectionResult[] = [];

  // Check duration anomaly
  if (durationMs !== null && durationMs > 0) {
    const durationAnomaly = await detectDurationAnomaly(monitor, durationMs);
    if (durationAnomaly.isAnomaly) {
      anomalies.push(durationAnomaly);
    }
  }

  // Check output size anomaly
  if (sizeBytes !== null && sizeBytes > 0) {
    const sizeAnomaly = await detectOutputSizeAnomaly(monitorId, sizeBytes);
    if (sizeAnomaly.isAnomaly) {
      anomalies.push(sizeAnomaly);
    }
  }

  // Create incidents for any detected anomalies
  for (const anomaly of anomalies) {
    await createAnomalyIncident(monitorId, runId, anomaly);
  }
}




