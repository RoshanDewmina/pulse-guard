'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ResponseTimeChartProps {
  data: Array<{
    time: string;
    avg: number;
    p95?: number;
    p99?: number;
  }>;
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Response Time</CardTitle>
        <CardDescription>Average, P95, and P99 response times</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              className="text-sm"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              tickFormatter={(value) => `${value}ms`}
              className="text-sm"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            Time
                          </span>
                          <span className="font-bold text-muted-foreground">
                            {payload[0].payload.time}
                          </span>
                        </div>
                        {payload.map((entry: any) => (
                          <div key={entry.name} className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {entry.name}
                            </span>
                            <span className="font-bold" style={{ color: entry.color }}>
                              {entry.value}ms
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="avg" 
              name="Average"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
            />
            {data[0]?.p95 !== undefined && (
              <Line 
                type="monotone" 
                dataKey="p95" 
                name="P95"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
            {data[0]?.p99 !== undefined && (
              <Line 
                type="monotone" 
                dataKey="p99" 
                name="P99"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

