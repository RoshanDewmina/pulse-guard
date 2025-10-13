/**
 * Health Score Calculation
 * 
 * Formula: 0.4 * Uptime% + 0.3 * SuccessRate% + 0.3 * PerformanceScore%
 * 
 * - Uptime: Percentage of expected runs that occurred
 * - SuccessRate: Percentage of runs that succeeded
 * - PerformanceScore: Based on duration consistency (100 - stddev/mean * 100)
 */

export interface HealthScoreInput {
  totalExpectedRuns: number;
  totalActualRuns: number;
  successfulRuns: number;
  durationMean?: number | null;
  durationM2?: number | null;
  durationCount: number;
}

export interface HealthScoreResult {
  score: number;
  uptime: number;
  successRate: number;
  performanceScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  color: string;
}

export function calculateHealthScore(input: HealthScoreInput): HealthScoreResult {
  // Calculate uptime (0-100)
  const uptime = input.totalExpectedRuns > 0 
    ? (input.totalActualRuns / input.totalExpectedRuns) * 100
    : 100;

  // Calculate success rate (0-100)
  const successRate = input.totalActualRuns > 0
    ? (input.successfulRuns / input.totalActualRuns) * 100
    : 100;

  // Calculate performance score based on duration variance (0-100)
  let performanceScore = 100;
  
  if (input.durationCount >= 10 && input.durationMean && input.durationM2) {
    // Calculate coefficient of variation (stddev / mean)
    const variance = input.durationM2 / input.durationCount;
    const stddev = Math.sqrt(variance);
    const coefficientOfVariation = input.durationMean > 0 ? stddev / input.durationMean : 0;
    
    // Lower CV = better performance (more consistent)
    // CV > 1 means high variance, CV < 0.3 means low variance
    performanceScore = Math.max(0, Math.min(100, 100 - (coefficientOfVariation * 100)));
  }

  // Calculate weighted health score
  const score = Math.round(
    0.4 * uptime +
    0.3 * successRate +
    0.3 * performanceScore
  );

  // Determine grade and color
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let color: string;

  if (score >= 90) {
    grade = 'A';
    color = 'text-green-600';
  } else if (score >= 80) {
    grade = 'B';
    color = 'text-blue-600';
  } else if (score >= 70) {
    grade = 'C';
    color = 'text-yellow-600';
  } else if (score >= 60) {
    grade = 'D';
    color = 'text-orange-600';
  } else {
    grade = 'F';
    color = 'text-red-600';
  }

  return {
    score,
    uptime: Math.round(uptime * 10) / 10,
    successRate: Math.round(successRate * 10) / 10,
    performanceScore: Math.round(performanceScore * 10) / 10,
    grade,
    color,
  };
}

/**
 * Calculate expected runs based on schedule
 * Used for uptime calculation
 */
export function calculateExpectedRuns(
  scheduleType: 'INTERVAL' | 'CRON',
  intervalSec: number | null,
  createdAt: Date,
  now: Date = new Date()
): number {
  const ageMs = now.getTime() - createdAt.getTime();
  
  if (scheduleType === 'INTERVAL' && intervalSec) {
    // Simple: age / interval
    return Math.floor(ageMs / (intervalSec * 1000));
  } else if (scheduleType === 'CRON') {
    // Approximation: assume daily average of 1-24 runs
    // More accurate implementation would parse cron expression
    const ageDays = ageMs / (24 * 60 * 60 * 1000);
    return Math.floor(ageDays); // Conservative estimate: 1 run per day
  }
  
  return 0;
}

/**
 * Get MTBF (Mean Time Between Failures) in hours
 */
export function calculateMTBF(
  incidents: Array<{ openedAt: Date }>,
  monitorAge: number // in milliseconds
): number {
  if (incidents.length === 0) {
    return monitorAge / (1000 * 60 * 60); // Return total uptime in hours
  }
  
  // Calculate average time between failures
  const mtbfMs = monitorAge / incidents.length;
  return Math.round((mtbfMs / (1000 * 60 * 60)) * 10) / 10;
}

/**
 * Get MTTR (Mean Time To Resolution) in minutes
 */
export function calculateMTTR(
  incidents: Array<{ openedAt: Date; resolvedAt: Date | null }>
): number {
  const resolvedIncidents = incidents.filter(inc => inc.resolvedAt);
  
  if (resolvedIncidents.length === 0) {
    return 0;
  }
  
  const totalResolutionTime = resolvedIncidents.reduce((sum, inc) => {
    const resolutionTimeMs = inc.resolvedAt!.getTime() - inc.openedAt.getTime();
    return sum + resolutionTimeMs;
  }, 0);
  
  const avgResolutionTimeMs = totalResolutionTime / resolvedIncidents.length;
  return Math.round((avgResolutionTimeMs / (1000 * 60)) * 10) / 10;
}
