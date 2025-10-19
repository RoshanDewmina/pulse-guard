import { prisma } from '@tokiflow/db';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';
import type { ReportPeriod } from '@tokiflow/db';

export interface SlaReportData {
  orgId: string;
  monitorId?: string;
  name: string;
  period: ReportPeriod;
  startDate: Date;
  endDate: Date;
  generatedBy?: string;
  uptimePercentage: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  totalDowntimeMs: number;
  mttr?: number; // Mean Time To Recovery (ms)
  mtbf?: number; // Mean Time Between Failures (ms)
  incidentCount: number;
  averageResponseTime?: number;
  p95ResponseTime?: number;
  p99ResponseTime?: number;
  data: {
    monitors?: MonitorSummary[];
    incidents: IncidentSummary[];
    dailyStats: DailyStats[];
    hourlyDistribution: HourlyDistribution[];
  };
}

export interface MonitorSummary {
  id: string;
  name: string;
  uptimePercentage: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime?: number;
  incidents: number;
}

export interface IncidentSummary {
  id: string;
  monitorName: string;
  kind: string;
  openedAt: Date;
  resolvedAt?: Date;
  durationMs?: number;
  summary: string;
}

export interface DailyStats {
  date: string;
  uptimePercentage: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  incidents: number;
  averageResponseTime?: number;
}

export interface HourlyDistribution {
  hour: number;
  successfulChecks: number;
  failedChecks: number;
  averageResponseTime?: number;
}

/**
 * Generate date range based on period
 */
export function getDateRangeForPeriod(
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
  offset = 0
): { startDate: Date; endDate: Date } {
  const now = new Date();

  switch (period) {
    case 'DAILY': {
      const targetDate = subDays(now, offset);
      return {
        startDate: startOfDay(targetDate),
        endDate: endOfDay(targetDate),
      };
    }
    case 'WEEKLY': {
      const targetDate = subWeeks(now, offset);
      return {
        startDate: startOfWeek(targetDate, { weekStartsOn: 1 }), // Monday
        endDate: endOfWeek(targetDate, { weekStartsOn: 1 }),
      };
    }
    case 'MONTHLY': {
      const targetDate = subMonths(now, offset);
      return {
        startDate: startOfMonth(targetDate),
        endDate: endOfMonth(targetDate),
      };
    }
    case 'QUARTERLY': {
      const targetDate = subQuarters(now, offset);
      return {
        startDate: startOfQuarter(targetDate),
        endDate: endOfQuarter(targetDate),
      };
    }
    case 'YEARLY': {
      const targetDate = subYears(now, offset);
      return {
        startDate: startOfYear(targetDate),
        endDate: endOfYear(targetDate),
      };
    }
    default:
      throw new Error(`Unsupported period: ${period}`);
  }
}

/**
 * Generate SLA report for an organization
 */
export async function generateSlaReport(
  orgId: string,
  monitorId: string | undefined,
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM',
  startDate?: Date,
  endDate?: Date,
  generatedBy?: string
): Promise<SlaReportData> {
  // Determine date range
  let reportStartDate: Date;
  let reportEndDate: Date;

  if (period === 'CUSTOM') {
    if (!startDate || !endDate) {
      throw new Error('Start and end dates are required for CUSTOM period');
    }
    reportStartDate = startDate;
    reportEndDate = endDate;
  } else {
    const range = getDateRangeForPeriod(period);
    reportStartDate = range.startDate;
    reportEndDate = range.endDate;
  }

  // Fetch runs for the period
  const runs = await prisma.run.findMany({
    where: {
      startedAt: {
        gte: reportStartDate,
        lte: reportEndDate,
      },
      Monitor: {
        orgId,
        ...(monitorId && { id: monitorId }),
      },
    },
    include: {
      Monitor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      startedAt: 'asc',
    },
  });

  // Fetch incidents for the period
  const incidents = await prisma.incident.findMany({
    where: {
      openedAt: {
        gte: reportStartDate,
        lte: reportEndDate,
      },
      Monitor: {
        orgId,
        ...(monitorId && { id: monitorId }),
      },
    },
    include: {
      Monitor: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      openedAt: 'desc',
    },
  });

  // Calculate basic stats
  const totalChecks = runs.length;
  const successfulChecks = runs.filter((r) => r.outcome === 'SUCCESS').length;
  const failedChecks = totalChecks - successfulChecks;
  const uptimePercentage = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 100;

  // Calculate downtime
  let totalDowntimeMs = 0;
  for (const incident of incidents) {
    if (incident.resolvedAt) {
      const duration = incident.resolvedAt.getTime() - incident.openedAt.getTime();
      totalDowntimeMs += duration;
    } else {
      // Still open - count from opened to report end
      const duration = reportEndDate.getTime() - incident.openedAt.getTime();
      totalDowntimeMs += Math.max(0, duration);
    }
  }

  // Calculate MTTR (Mean Time To Recovery)
  const resolvedIncidents = incidents.filter((i) => i.resolvedAt);
  const mttr = resolvedIncidents.length > 0
    ? resolvedIncidents.reduce((sum, i) => sum + (i.resolvedAt!.getTime() - i.openedAt.getTime()), 0) / resolvedIncidents.length
    : undefined;

  // Calculate MTBF (Mean Time Between Failures)
  const mtbf = incidents.length > 1
    ? (reportEndDate.getTime() - reportStartDate.getTime() - totalDowntimeMs) / (incidents.length - 1)
    : undefined;

  // Calculate response times
  const runsWithDuration = runs.filter((r) => r.durationMs !== null);
  const averageResponseTime = runsWithDuration.length > 0
    ? runsWithDuration.reduce((sum, r) => sum + r.durationMs!, 0) / runsWithDuration.length
    : undefined;

  // Calculate percentiles
  const sortedDurations = runsWithDuration
    .map((r) => r.durationMs!)
    .sort((a, b) => a - b);
  
  const p95ResponseTime = sortedDurations.length > 0
    ? sortedDurations[Math.floor(sortedDurations.length * 0.95)]
    : undefined;
  
  const p99ResponseTime = sortedDurations.length > 0
    ? sortedDurations[Math.floor(sortedDurations.length * 0.99)]
    : undefined;

  // Generate monitor summaries (if no specific monitor)
  let monitorSummaries: MonitorSummary[] | undefined;
  if (!monitorId) {
    const monitorGroups = runs.reduce((acc, run) => {
      const monId = run.Monitor.id;
      if (!acc[monId]) {
        acc[monId] = {
          id: monId,
          name: run.Monitor.name,
          runs: [],
          incidents: incidents.filter((i) => i.Monitor.id === monId),
        };
      }
      acc[monId].runs.push(run);
      return acc;
    }, {} as Record<string, { id: string; name: string; runs: typeof runs; incidents: typeof incidents }>);

    monitorSummaries = Object.values(monitorGroups).map((group) => {
      const total = group.runs.length;
      const successful = group.runs.filter((r) => r.outcome === 'SUCCESS').length;
      const failed = total - successful;
      const uptime = total > 0 ? (successful / total) * 100 : 100;
      
      const avgResponseTime = group.runs.filter((r) => r.durationMs !== null).length > 0
        ? group.runs.reduce((sum, r) => sum + (r.durationMs || 0), 0) / group.runs.filter((r) => r.durationMs !== null).length
        : undefined;

      return {
        id: group.id,
        name: group.name,
        uptimePercentage: uptime,
        totalChecks: total,
        successfulChecks: successful,
        failedChecks: failed,
        averageResponseTime: avgResponseTime,
        incidents: group.incidents.length,
      };
    });
  }

  // Generate daily stats
  const dailyStats: DailyStats[] = [];
  const dailyGroups = runs.reduce((acc, run) => {
    const dateKey = startOfDay(run.startedAt).toISOString();
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: dateKey,
        runs: [],
        incidents: incidents.filter(
          (i) => startOfDay(i.openedAt).toISOString() === dateKey
        ).length,
      };
    }
    acc[dateKey].runs.push(run);
    return acc;
  }, {} as Record<string, { date: string; runs: typeof runs; incidents: number }>);

  for (const [dateKey, group] of Object.entries(dailyGroups)) {
    const total = group.runs.length;
    const successful = group.runs.filter((r) => r.outcome === 'SUCCESS').length;
    const failed = total - successful;
    const uptime = total > 0 ? (successful / total) * 100 : 100;
    
    const avgResponseTime = group.runs.filter((r) => r.durationMs !== null).length > 0
      ? group.runs.reduce((sum, r) => sum + (r.durationMs || 0), 0) / group.runs.filter((r) => r.durationMs !== null).length
      : undefined;

    dailyStats.push({
      date: dateKey,
      uptimePercentage: uptime,
      totalChecks: total,
      successfulChecks: successful,
      failedChecks: failed,
      incidents: group.incidents,
      averageResponseTime: avgResponseTime,
    });
  }

  // Sort by date
  dailyStats.sort((a, b) => a.date.localeCompare(b.date));

  // Generate hourly distribution
  const hourlyDistribution: HourlyDistribution[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const hourRuns = runs.filter((r) => new Date(r.startedAt).getHours() === hour);
    const successful = hourRuns.filter((r) => r.outcome === 'SUCCESS').length;
    const failed = hourRuns.length - successful;
    
    const avgResponseTime = hourRuns.filter((r) => r.durationMs !== null).length > 0
      ? hourRuns.reduce((sum, r) => sum + (r.durationMs || 0), 0) / hourRuns.filter((r) => r.durationMs !== null).length
      : undefined;

    hourlyDistribution.push({
      hour,
      successfulChecks: successful,
      failedChecks: failed,
      averageResponseTime: avgResponseTime,
    });
  }

  // Format incident summaries
  const incidentSummaries: IncidentSummary[] = incidents.map((incident) => ({
    id: incident.id,
    monitorName: incident.Monitor.name,
    kind: incident.kind,
    openedAt: incident.openedAt,
    resolvedAt: incident.resolvedAt || undefined,
    durationMs: incident.resolvedAt
      ? incident.resolvedAt.getTime() - incident.openedAt.getTime()
      : undefined,
    summary: incident.summary,
  }));

  // Get org/monitor name
  let reportName: string;
  if (monitorId) {
    const monitor = await prisma.monitor.findUnique({
      where: { id: monitorId },
      select: { name: true },
    });
    reportName = monitor ? `${monitor.name} - ${period} SLA Report` : `${period} SLA Report`;
  } else {
    const org = await prisma.org.findUnique({
      where: { id: orgId },
      select: { name: true },
    });
    reportName = org ? `${org.name} - ${period} SLA Report` : `${period} SLA Report`;
  }

  return {
    orgId,
    monitorId,
    name: reportName,
    period,
    startDate: reportStartDate,
    endDate: reportEndDate,
    generatedBy,
    uptimePercentage,
    totalChecks,
    successfulChecks,
    failedChecks,
    totalDowntimeMs,
    mttr,
    mtbf,
    incidentCount: incidents.length,
    averageResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    data: {
      ...(monitorSummaries && { monitors: monitorSummaries }),
      incidents: incidentSummaries,
      dailyStats,
      hourlyDistribution,
    },
  };
}

