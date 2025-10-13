'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import { format } from 'date-fns';

interface Run {
  id: string;
  startedAt: Date;
  durationMs: number | null;
  outcome: 'SUCCESS' | 'FAIL' | 'LATE' | 'MISSED' | 'STARTED' | 'TIMEOUT';
}

interface Incident {
  id: string;
  kind: 'MISSED' | 'LATE' | 'FAIL' | 'ANOMALY' | 'DEGRADED';
  openedAt: Date;
  zScore?: number | null;
}

interface DurationBandChartProps {
  runs: Run[];
  incidents: Incident[];
  durationMean?: number | null;
  durationM2?: number | null;
  durationCount: number;
  durationP50?: number | null;
  durationP95?: number | null;
  durationP99?: number | null;
}

export function DurationBandChart({
  runs,
  incidents,
  durationMean,
  durationM2,
  durationCount,
  durationP50,
  durationP95,
  durationP99,
}: DurationBandChartProps) {
  // Filter successful runs with duration
  const successfulRuns = runs
    .filter(r => r.outcome === 'SUCCESS' && r.durationMs !== null)
    .sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());

  if (successfulRuns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No duration data available
      </div>
    );
  }

  // Calculate standard deviation
  let stddev = 0;
  if (durationCount >= 10 && durationMean && durationM2) {
    const variance = durationM2 / durationCount;
    stddev = Math.sqrt(variance);
  }

  // Prepare chart data
  const chartData = successfulRuns.map(run => {
    const durationSec = run.durationMs! / 1000;
    
    // Find if this run has an anomaly incident
    const anomalyIncident = incidents.find(
      inc => 
        inc.kind === 'ANOMALY' &&
        Math.abs(inc.openedAt.getTime() - run.startedAt.getTime()) < 60000 // Within 1 minute
    );

    return {
      timestamp: run.startedAt.getTime(),
      date: format(run.startedAt, 'MMM d, HH:mm'),
      duration: durationSec,
      mean: durationMean ? durationMean / 1000 : null,
      upperBand: durationMean && stddev ? (durationMean + 2 * stddev) / 1000 : null,
      lowerBand: durationMean && stddev ? Math.max(0, (durationMean - 2 * stddev) / 1000) : null,
      p50: durationP50 ? durationP50 / 1000 : null,
      p95: durationP95 ? durationP95 / 1000 : null,
      p99: durationP99 ? durationP99 / 1000 : null,
      isAnomaly: !!anomalyIncident,
      zScore: anomalyIncident?.zScore,
    };
  });

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis
            label={{ value: 'Duration (seconds)', angle: -90, position: 'insideLeft', fontSize: 12 }}
            tick={{ fontSize: 12 }}
            tickMargin={10}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;

              const data = payload[0].payload;
              return (
                <div className="bg-white dark:bg-slate-800 p-3 border rounded-lg shadow-lg">
                  <p className="font-medium">{data.date}</p>
                  <p className="text-sm mt-1">
                    Duration: <span className="font-mono">{data.duration.toFixed(2)}s</span>
                  </p>
                  {data.mean && (
                    <p className="text-sm text-muted-foreground">
                      Mean: <span className="font-mono">{data.mean.toFixed(2)}s</span>
                    </p>
                  )}
                  {data.isAnomaly && (
                    <p className="text-sm text-red-600 font-medium mt-1">
                      ⚠️ Anomaly Detected
                      {data.zScore && ` (z-score: ${data.zScore.toFixed(2)})`}
                    </p>
                  )}
                </div>
              );
            }}
          />

          {/* Normal band (mean ± 2σ) */}
          {durationMean && stddev > 0 && (
            <Area
              type="monotone"
              dataKey="upperBand"
              stackId="1"
              stroke="none"
              fill="#93c5fd"
              fillOpacity={0.2}
            />
          )}
          {durationMean && stddev > 0 && (
            <Area
              type="monotone"
              dataKey="lowerBand"
              stackId="1"
              stroke="none"
              fill="#93c5fd"
              fillOpacity={0.2}
            />
          )}

          {/* Mean line */}
          {durationMean && (
            <Line
              type="monotone"
              dataKey="mean"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Mean"
            />
          )}

          {/* Percentile lines */}
          {durationP50 && (
            <Line
              type="monotone"
              dataKey="p50"
              stroke="#10b981"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="p50 (Median)"
            />
          )}
          {durationP95 && (
            <Line
              type="monotone"
              dataKey="p95"
              stroke="#f59e0b"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="p95"
            />
          )}
          {durationP99 && (
            <Line
              type="monotone"
              dataKey="p99"
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="3 3"
              dot={false}
              name="p99"
            />
          )}

          {/* Actual duration line with anomaly markers */}
          <Line
            type="monotone"
            dataKey="duration"
            stroke="#1e293b"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.isAnomaly) {
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="#1e293b"
                  stroke="#fff"
                  strokeWidth={1}
                />
              );
            }}
            name="Duration"
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-slate-800" />
          <span>Actual Duration</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500 border-dashed" />
          <span>Mean</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-3 bg-blue-200 opacity-50" />
          <span>Normal Band (±2σ)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Anomaly</span>
        </div>
        {durationP50 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-green-500 border-dashed" />
            <span>p50</span>
          </div>
        )}
        {durationP95 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-yellow-500 border-dashed" />
            <span>p95</span>
          </div>
        )}
        {durationP99 && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500 border-dashed" />
            <span>p99</span>
          </div>
        )}
      </div>
    </div>
  );
}

