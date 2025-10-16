"use client"

import { Run } from '@tokiflow/db';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';

export function DurationChart({ runs }: { runs: Run[] }) {
  const data = runs
    .filter(r => r.durationMs !== null && r.outcome === 'SUCCESS')
    .slice(0, 20)
    .reverse()
    .map(run => ({
      time: format(run.startedAt, 'MMM d HH:mm'),
      duration: run.durationMs,
      timestamp: run.startedAt.getTime(),
    }));

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400">
        No duration data available yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis
          dataKey="time"
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
        />
        <YAxis
          stroke="#6b7280"
          fontSize={12}
          tickLine={false}
          tickFormatter={(value) => `${value}ms`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
          }}
          labelStyle={{ color: '#374151' }}
          formatter={(value: number) => [`${value}ms`, 'Duration']}
        />
        <Line
          type="monotone"
          dataKey="duration"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}







