import { parseExpression } from 'cron-parser';
import { ScheduleType } from '@tokiflow/db';

export interface CalculateNextDueAtParams {
  scheduleType: ScheduleType;
  intervalSec?: number | null;
  cronExpr?: string | null;
  timezone?: string;
  from?: Date;
}

export function calculateNextDueAt(params: CalculateNextDueAtParams): Date {
  const { scheduleType, intervalSec, cronExpr, timezone = 'UTC', from = new Date() } = params;

  if (scheduleType === 'INTERVAL') {
    if (!intervalSec) {
      throw new Error('intervalSec is required for INTERVAL schedule type');
    }
    return new Date(from.getTime() + intervalSec * 1000);
  }

  if (scheduleType === 'CRON') {
    if (!cronExpr) {
      throw new Error('cronExpr is required for CRON schedule type');
    }

    try {
      const interval = parseExpression(cronExpr, {
        currentDate: from,
        tz: timezone,
      });
      return interval.next().toDate();
    } catch (error) {
      throw new Error(`Invalid cron expression: ${cronExpr}`);
    }
  }

  throw new Error(`Unknown schedule type: ${scheduleType}`);
}

export function isRunLate(
  nextDueAt: Date,
  graceSec: number,
  now: Date = new Date()
): boolean {
  const dueWithGrace = new Date(nextDueAt.getTime() + graceSec * 1000);
  return now > dueWithGrace;
}

export function formatSchedule(
  scheduleType: ScheduleType,
  intervalSec?: number | null,
  cronExpr?: string | null
): string {
  if (scheduleType === 'INTERVAL' && intervalSec) {
    if (intervalSec < 60) return `Every ${intervalSec}s`;
    if (intervalSec < 3600) return `Every ${Math.floor(intervalSec / 60)}m`;
    if (intervalSec < 86400) return `Every ${Math.floor(intervalSec / 3600)}h`;
    return `Every ${Math.floor(intervalSec / 86400)}d`;
  }

  if (scheduleType === 'CRON' && cronExpr) {
    return cronExpr;
  }

  return 'Unknown';
}

