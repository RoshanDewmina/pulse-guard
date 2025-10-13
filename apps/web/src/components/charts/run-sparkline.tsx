'use client';

import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface Run {
  outcome: 'SUCCESS' | 'FAIL' | 'LATE' | 'MISSED' | 'STARTED' | 'TIMEOUT';
  durationMs?: number | null;
  startedAt: Date;
}

interface RunSparklineProps {
  runs: Run[];
  height?: number;
}

export function RunSparkline({ runs, height = 40 }: RunSparklineProps) {
  if (!runs || runs.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  // Prepare data for chart (last 20 runs, reversed for chronological order)
  const chartData = runs
    .slice(0, 20)
    .reverse()
    .map((run, index) => ({
      index,
      value: run.outcome === 'SUCCESS' ? 1 : 0,
      duration: run.durationMs || 0,
    }));

  // Determine line color based on recent success rate
  const successCount = runs.slice(0, 10).filter(r => r.outcome === 'SUCCESS').length;
  const successRate = successCount / Math.min(runs.length, 10);
  
  let strokeColor = '#10b981'; // green
  if (successRate < 0.5) {
    strokeColor = '#ef4444'; // red
  } else if (successRate < 0.8) {
    strokeColor = '#f59e0b'; // yellow
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Duration sparkline shows duration trends over time
 */
export function DurationSparkline({ runs, height = 40 }: RunSparklineProps) {
  if (!runs || runs.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        No data
      </div>
    );
  }

  // Filter only successful runs with duration data
  const runsWithDuration = runs
    .filter(r => r.outcome === 'SUCCESS' && r.durationMs)
    .slice(0, 20)
    .reverse();

  if (runsWithDuration.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        No duration data
      </div>
    );
  }

  const chartData = runsWithDuration.map((run, index) => ({
    index,
    duration: run.durationMs! / 1000, // Convert to seconds
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="duration"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Simple status indicator sparkline (colored dots)
 */
export function StatusSparkline({ runs }: { runs: Run[] }) {
  if (!runs || runs.length === 0) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">No runs</span>
      </div>
    );
  }

  const statusColors = {
    SUCCESS: 'bg-green-500',
    FAIL: 'bg-red-500',
    LATE: 'bg-yellow-500',
    MISSED: 'bg-orange-500',
    TIMEOUT: 'bg-red-400',
    STARTED: 'bg-blue-500',
  };

  return (
    <div className="flex items-center gap-1">
      {runs.slice(0, 15).map((run, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full ${statusColors[run.outcome]}`}
          title={`${run.outcome} - ${run.startedAt.toLocaleString()}`}
        />
      ))}
      {runs.length > 15 && (
        <span className="text-xs text-muted-foreground ml-1">
          +{runs.length - 15}
        </span>
      )}
    </div>
  );
}

