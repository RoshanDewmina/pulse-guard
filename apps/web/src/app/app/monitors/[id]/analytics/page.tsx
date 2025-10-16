import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateHealthScore, calculateUptime, calculateMTBF, calculateMTTR, getHealthScoreColor, getHealthScoreBgColor } from '@/lib/analytics/health-score';
import { calculatePercentile } from '@/lib/analytics/welford';
import { TrendingUp, TrendingDown, Activity, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

export default async function MonitorAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const { id } = await params;
  // Fetch monitor with runs
  const monitor = await prisma.monitor.findFirst({
    where: {
      id,
      Org: {
        Membership: {
          some: {
            User: {
              email: session.user.email,
            },
          },
        },
      },
    },
    include: {
      Run: {
        where: {
          outcome: 'SUCCESS',
          durationMs: { not: null },
        },
        orderBy: {
          startedAt: 'desc',
        },
        take: 100,
      },
    },
  });

  if (!monitor) {
    redirect('/app/monitors');
  }

  // Calculate analytics
  const healthScore = await calculateHealthScore(monitor.id, 7);
  const uptime7d = await calculateUptime(monitor.id, 7);
  const uptime30d = await calculateUptime(monitor.id, 30);
  const uptime90d = await calculateUptime(monitor.id, 90);
  const mtbf = await calculateMTBF(monitor.id);
  const mttr = await calculateMTTR(monitor.id);

  // Calculate duration percentiles
  const durations = monitor.Run.map(r => r.durationMs!).filter(d => d > 0);
  const p50 = durations.length > 0 ? calculatePercentile(durations, 50) : null;
  const p95 = durations.length > 0 ? calculatePercentile(durations, 95) : null;
  const p99 = durations.length > 0 ? calculatePercentile(durations, 99) : null;

  // Calculate trend (comparing first half vs second half of runs)
  let trend: 'improving' | 'degrading' | 'stable' = 'stable';
  if (durations.length >= 20) {
    const firstHalf = durations.slice(0, Math.floor(durations.length / 2));
    const secondHalf = durations.slice(Math.floor(durations.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.2) {
      trend = 'degrading';
    } else if (secondAvg < firstAvg * 0.8) {
      trend = 'improving';
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <PageHeaderWithBreadcrumbs
        title="Analytics & Insights"
        description={`Performance metrics for ${monitor.name}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Monitors', href: '/app/monitors' },
          { label: monitor.name, href: `/app/monitors/${monitor.id}` },
          { label: 'Analytics' },
        ]}
      />

      {/* Health Score */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Health Score</CardTitle>
          <CardDescription>Overall monitor health (last 7 days)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4">
                <div className={`text-6xl font-bold ${getHealthScoreColor(healthScore.score)}`}>
                  {healthScore.score}
                </div>
                <div>
                  <Badge className={getHealthScoreBgColor(healthScore.score)}>
                    <span className={`font-bold text-lg ${getHealthScoreColor(healthScore.score)}`}>
                      Grade {healthScore.grade}
                    </span>
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1 capitalize">{healthScore.status}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Score Breakdown:</p>
              <div className="mt-2 space-y-1 text-sm">
                {healthScore.breakdown.successes > 0 && (
                  <p className="text-green-600">Successes: +{healthScore.breakdown.successes}</p>
                )}
                {healthScore.breakdown.failures < 0 && (
                  <p className="text-red-600">Failures: {healthScore.breakdown.failures}</p>
                )}
                {healthScore.breakdown.missed < 0 && (
                  <p className="text-orange-600">Missed: {healthScore.breakdown.missed}</p>
                )}
                {healthScore.breakdown.late < 0 && (
                  <p className="text-yellow-600">Late: {healthScore.breakdown.late}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uptime Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Uptime (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-4xl font-bold ${uptime7d >= 95 ? 'text-green-600' : uptime7d >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
              {uptime7d.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Uptime (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-4xl font-bold ${uptime30d >= 95 ? 'text-green-600' : uptime30d >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
              {uptime30d.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Uptime (90 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-4xl font-bold ${uptime90d >= 95 ? 'text-green-600' : uptime90d >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
              {uptime90d.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Reliability Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">MTBF</p>
                <p className="text-xs text-gray-500">Mean Time Between Failures</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {mtbf !== null
                  ? mtbf > 86400
                    ? `${(mtbf / 86400).toFixed(1)}d`
                    : mtbf > 3600
                    ? `${(mtbf / 3600).toFixed(1)}h`
                    : `${(mtbf / 60).toFixed(0)}m`
                  : '—'}
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-600">MTTR</p>
                <p className="text-xs text-gray-500">Mean Time To Repair</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {mttr !== null
                  ? mttr > 3600
                    ? `${(mttr / 3600).toFixed(1)}h`
                    : `${(mttr / 60).toFixed(0)}m`
                  : '—'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Duration Percentiles</CardTitle>
            <CardDescription>Based on last 100 successful runs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">P50 (Median)</p>
              <p className="text-2xl font-bold">{p50 !== null ? `${Math.round(p50)}ms` : '—'}</p>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">P95</p>
              <p className="text-2xl font-bold">{p95 !== null ? `${Math.round(p95)}ms` : '—'}</p>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <p className="text-sm font-medium text-gray-600">P99</p>
              <p className="text-2xl font-bold">{p99 !== null ? `${Math.round(p99)}ms` : '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trend */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>Comparing recent vs historical performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {trend === 'improving' && (
              <>
                <TrendingUp className="h-12 w-12 text-green-600" />
                <div>
                  <p className="text-lg font-bold text-green-600">Improving</p>
                  <p className="text-sm text-gray-600">Jobs are completing faster over time</p>
                </div>
              </>
            )}
            {trend === 'degrading' && (
              <>
                <TrendingDown className="h-12 w-12 text-red-600" />
                <div>
                  <p className="text-lg font-bold text-red-600">Degrading</p>
                  <p className="text-sm text-gray-600">Jobs are taking longer to complete</p>
                </div>
              </>
            )}
            {trend === 'stable' && (
              <>
                <Activity className="h-12 w-12 text-blue-600" />
                <div>
                  <p className="text-lg font-bold text-blue-600">Stable</p>
                  <p className="text-sm text-gray-600">Performance is consistent</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Statistical Insights */}
      {monitor.durationCount >= 10 && (
        <Card>
          <CardHeader>
            <CardTitle>Statistical Insights</CardTitle>
            <CardDescription>Runtime statistics (Welford algorithm)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 border rounded-lg">
                <p className="text-sm font-medium text-gray-600">Sample Size</p>
                <p className="text-2xl font-bold">{monitor.durationCount}</p>
                <p className="text-xs text-gray-500">Successful runs</p>
              </div>
              
              {monitor.durationMean && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Mean</p>
                  <p className="text-2xl font-bold">{Math.round(monitor.durationMean)}ms</p>
                  <p className="text-xs text-gray-500">Average duration</p>
                </div>
              )}
              
              {monitor.durationMedian && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Median</p>
                  <p className="text-2xl font-bold">{Math.round(monitor.durationMedian)}ms</p>
                  <p className="text-xs text-gray-500">Middle value</p>
                </div>
              )}
              
              {monitor.durationM2 && monitor.durationCount > 1 && (
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium text-gray-600">Std Dev</p>
                  <p className="text-2xl font-bold">
                    {Math.round(Math.sqrt(monitor.durationM2 / monitor.durationCount))}ms
                  </p>
                  <p className="text-xs text-gray-500">Variability</p>
                </div>
              )}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-900">
                <strong>Anomaly Detection Active:</strong> Saturn automatically detects when this job runs unusually slow (&gt;3σ from mean).
                {monitor.durationCount < 10 && ` Needs ${10 - monitor.durationCount} more runs to establish baseline.`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {monitor.durationCount < 10 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-600">Collecting Baseline Data</p>
              <p className="text-sm text-gray-500 mt-2">
                Need {10 - monitor.durationCount} more successful runs to enable anomaly detection and advanced analytics.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


