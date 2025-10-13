/**
 * Monitor Health Score Calculation
 * 
 * Score: 0-100 based on recent performance
 * - Base: 100
 * - -5 for each failure (last 7 days)
 * - -10 for each missed run
 * - -3 for each late run
 * - +2 for each on-time success (capped at 100)
 */

import { prisma } from '@tokiflow/db';

export interface HealthScoreResult {
  score: number;
  breakdown: {
    base: number;
    successes: number;
    failures: number;
    missed: number;
    late: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

/**
 * Calculate health score for a monitor
 * 
 * @param monitorId - Monitor ID
 * @param days - Number of days to look back (default 7)
 * @returns Health score with breakdown
 */
export async function calculateHealthScore(
  monitorId: string,
  days: number = 7
): Promise<HealthScoreResult> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Get all runs in the time period
  const runs = await prisma.run.findMany({
    where: {
      monitorId,
      startedAt: {
        gte: since,
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
  });

  let score = 100;
  const breakdown = {
    base: 100,
    successes: 0,
    failures: 0,
    missed: 0,
    late: 0,
  };

  for (const run of runs) {
    switch (run.outcome) {
      case 'SUCCESS':
        // Add 2 points for on-time success (capped at 100)
        breakdown.successes += 2;
        break;
      case 'FAIL':
        breakdown.failures -= 5;
        score -= 5;
        break;
      case 'MISSED':
        breakdown.missed -= 10;
        score -= 10;
        break;
      case 'LATE':
        breakdown.late -= 3;
        score -= 3;
        break;
    }
  }

  // Add success bonus (but cap at 100)
  score = Math.min(100, score + breakdown.successes);
  
  // Ensure minimum of 0
  score = Math.max(0, score);

  // Determine grade and status
  let grade: 'A' | 'B' | 'C' | 'D' | 'F';
  let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

  if (score >= 90) {
    grade = 'A';
    status = 'excellent';
  } else if (score >= 80) {
    grade = 'B';
    status = 'good';
  } else if (score >= 70) {
    grade = 'C';
    status = 'fair';
  } else if (score >= 60) {
    grade = 'D';
    status = 'poor';
  } else {
    grade = 'F';
    status = 'critical';
  }

  return {
    score: Math.round(score),
    breakdown,
    grade,
    status,
  };
}

/**
 * Calculate uptime percentage
 * 
 * @param monitorId - Monitor ID
 * @param days - Number of days to look back
 * @returns Uptime percentage (0-100)
 */
export async function calculateUptime(
  monitorId: string,
  days: number = 7
): Promise<number> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const runs = await prisma.run.findMany({
    where: {
      monitorId,
      startedAt: {
        gte: since,
      },
      outcome: {
        in: ['SUCCESS', 'FAIL', 'LATE', 'MISSED'],
      },
    },
  });

  if (runs.length === 0) return 100;

  const successfulRuns = runs.filter(r => 
    r.outcome === 'SUCCESS' || r.outcome === 'LATE'
  ).length;

  return (successfulRuns / runs.length) * 100;
}

/**
 * Calculate MTBF (Mean Time Between Failures)
 * 
 * @param monitorId - Monitor ID
 * @returns MTBF in seconds, or null if no failures
 */
export async function calculateMTBF(monitorId: string): Promise<number | null> {
  const failures = await prisma.run.findMany({
    where: {
      monitorId,
      outcome: {
        in: ['FAIL', 'MISSED'],
      },
    },
    orderBy: {
      startedAt: 'asc',
    },
    select: {
      startedAt: true,
    },
  });

  if (failures.length < 2) return null;

  let totalTimeBetweenFailures = 0;
  for (let i = 1; i < failures.length; i++) {
    const timeDiff = failures[i].startedAt.getTime() - failures[i - 1].startedAt.getTime();
    totalTimeBetweenFailures += timeDiff;
  }

  return totalTimeBetweenFailures / (failures.length - 1) / 1000; // Convert to seconds
}

/**
 * Calculate MTTR (Mean Time To Repair)
 * 
 * @param monitorId - Monitor ID
 * @returns MTTR in seconds, or null if no resolved incidents
 */
export async function calculateMTTR(monitorId: string): Promise<number | null> {
  const incidents = await prisma.incident.findMany({
    where: {
      monitorId,
      status: 'RESOLVED',
      resolvedAt: { not: null },
    },
    select: {
      openedAt: true,
      resolvedAt: true,
    },
  });

  if (incidents.length === 0) return null;

  let totalRepairTime = 0;
  for (const incident of incidents) {
    if (incident.resolvedAt) {
      const repairTime = incident.resolvedAt.getTime() - incident.openedAt.getTime();
      totalRepairTime += repairTime;
    }
  }

  return totalRepairTime / incidents.length / 1000; // Convert to seconds
}

/**
 * Get health score color class
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
}

/**
 * Get health score background color
 */
export function getHealthScoreBgColor(score: number): string {
  if (score >= 90) return 'bg-green-100';
  if (score >= 80) return 'bg-blue-100';
  if (score >= 70) return 'bg-yellow-100';
  if (score >= 60) return 'bg-orange-100';
  return 'bg-red-100';
}





