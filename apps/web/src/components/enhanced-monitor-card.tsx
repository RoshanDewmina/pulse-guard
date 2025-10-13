'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { StatusSparkline, DurationSparkline } from '@/components/charts/run-sparkline';
import { calculateHealthScore, calculateExpectedRuns } from '@/lib/analytics/health-score';
import { Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Run {
  outcome: 'SUCCESS' | 'FAIL' | 'LATE' | 'MISSED' | 'STARTED' | 'TIMEOUT';
  durationMs?: number | null;
  startedAt: Date;
}

interface Monitor {
  id: string;
  name: string;
  status: 'OK' | 'LATE' | 'MISSED' | 'FAILING' | 'DISABLED';
  lastRunAt: Date | null;
  nextDueAt: Date | null;
  scheduleType: 'INTERVAL' | 'CRON';
  intervalSec: number | null;
  createdAt: Date;
  durationCount: number;
  durationMean: number | null;
  durationM2: number | null;
  _count: {
    incidents: number;
  };
  runs: Run[];
}

function formatTimeUntil(date: Date | null): string {
  if (!date) return 'Not scheduled';
  
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  
  if (diff < 0) return 'Overdue';
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `in ${days}d ${hours % 24}h`;
  if (hours > 0) return `in ${hours}h ${minutes % 60}m`;
  return `in ${minutes}m`;
}

export function EnhancedMonitorCard({ monitor }: { monitor: Monitor }) {
  const [timeUntil, setTimeUntil] = useState(formatTimeUntil(monitor.nextDueAt));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeUntil(formatTimeUntil(monitor.nextDueAt));
    }, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [monitor.nextDueAt]);

  // Calculate health score
  const expectedRuns = calculateExpectedRuns(
    monitor.scheduleType,
    monitor.intervalSec,
    monitor.createdAt,
    new Date()
  );
  
  const actualRuns = monitor.runs.length;
  const successfulRuns = monitor.runs.filter(r => r.outcome === 'SUCCESS').length;
  
  const healthScoreData = calculateHealthScore({
    totalExpectedRuns: Math.max(expectedRuns, 1),
    totalActualRuns: actualRuns,
    successfulRuns,
    durationMean: monitor.durationMean,
    durationM2: monitor.durationM2,
    durationCount: monitor.durationCount,
  });

  return (
    <Link
      href={`/app/monitors/${monitor.id}`}
      className="block p-6 rounded-lg border hover:shadow-md transition-all bg-white dark:bg-slate-800"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{monitor.name}</h3>
            <p className="text-sm text-muted-foreground">
              Last run: {monitor.lastRunAt ? new Date(monitor.lastRunAt).toLocaleString() : 'Never'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant={
                monitor.status === 'OK' ? 'default' :
                monitor.status === 'LATE' ? 'secondary' :
                'destructive'
              }
            >
              {monitor.status}
            </Badge>
            {monitor._count.incidents > 0 && (
              <Badge variant="destructive" className="text-xs">
                {monitor._count.incidents} incident{monitor._count.incidents !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>

        {/* Health Score and Next Run */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Health Score</span>
              {healthScoreData.score >= 90 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : healthScoreData.score >= 70 ? (
                <Minus className="w-4 h-4 text-yellow-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
            <div className={`text-2xl font-bold ${healthScoreData.color}`}>
              {healthScoreData.score}
              <span className="text-sm ml-1">{healthScoreData.grade}</span>
            </div>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Next Run</span>
            </div>
            <div className="text-lg font-medium">
              {timeUntil}
            </div>
          </div>
        </div>

        {/* Status Sparkline */}
        {monitor.runs.length > 0 && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Recent Runs</div>
            <StatusSparkline runs={monitor.runs} />
          </div>
        )}

        {/* Duration Sparkline */}
        {monitor.runs.some(r => r.durationMs) && (
          <div>
            <div className="text-xs text-muted-foreground mb-2">Duration Trend</div>
            <DurationSparkline runs={monitor.runs} height={30} />
          </div>
        )}

        {/* Quick Stats */}
        <div className="flex gap-4 text-xs text-muted-foreground pt-2 border-t">
          <div>
            Uptime: <span className="font-medium">{healthScoreData.uptime.toFixed(1)}%</span>
          </div>
          <div>
            Success: <span className="font-medium">{healthScoreData.successRate.toFixed(1)}%</span>
          </div>
          <div>
            Performance: <span className="font-medium">{healthScoreData.performanceScore.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

