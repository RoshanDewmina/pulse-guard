import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { calculateHealthScore, calculateUptime, calculateMTBF, calculateMTTR, getHealthScoreColor, getHealthScoreBgColor } from '@/lib/analytics/health-score';
import { Activity, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  // Get user's org
  const membership = await prisma.membership.findFirst({
    where: {
      user: {
        email: session.user.email,
      },
    },
    include: {
      org: {
        include: {
          monitors: {
            where: {
              status: {
                not: 'DISABLED',
              },
            },
            include: {
              runs: {
                where: {
                  startedAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!membership) {
    redirect('/');
  }

  const org = membership.org;

  // Calculate analytics for each monitor
  const monitorAnalytics = await Promise.all(
    org.monitors.map(async (monitor) => {
      const healthScore = await calculateHealthScore(monitor.id, 7);
      const uptime7d = await calculateUptime(monitor.id, 7);
      const uptime30d = await calculateUptime(monitor.id, 30);
      const mtbf = await calculateMTBF(monitor.id);
      const mttr = await calculateMTTR(monitor.id);

      return {
        monitor,
        healthScore,
        uptime7d,
        uptime30d,
        mtbf,
        mttr,
      };
    })
  );

  // Calculate overall org statistics
  const totalMonitors = org.monitors.length;
  const avgHealthScore = monitorAnalytics.length > 0
    ? monitorAnalytics.reduce((sum, m) => sum + m.healthScore.score, 0) / monitorAnalytics.length
    : 100;
  const avgUptime = monitorAnalytics.length > 0
    ? monitorAnalytics.reduce((sum, m) => sum + m.uptime7d, 0) / monitorAnalytics.length
    : 100;

  const activeIncidents = await prisma.incident.count({
    where: {
      monitor: {
        orgId: org.id,
      },
      status: {
        in: ['OPEN', 'ACKED'],
      },
    },
  });

  // Get total runs in last 7 days
  const totalRuns = org.monitors.reduce((sum, m) => sum + m.runs.length, 0);
  const successfulRuns = org.monitors.reduce(
    (sum, m) => sum + m.runs.filter(r => r.outcome === 'SUCCESS' || r.outcome === 'LATE').length,
    0
  );
  const overallSuccessRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;

  // Sort monitors by health score
  const sortedMonitors = [...monitorAnalytics].sort((a, b) => b.healthScore.score - a.healthScore.score);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-600 mt-1">Monitor health, performance, and reliability insights</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Monitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMonitors}</p>
            <p className="text-sm text-gray-500 mt-1">
              {org.monitors.filter(m => m.status === 'OK').length} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${getHealthScoreColor(avgHealthScore)}`}>
              {Math.round(avgHealthScore)}
            </p>
            <p className="text-sm text-gray-500 mt-1">Out of 100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Uptime (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">
              {avgUptime.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {successfulRuns}/{totalRuns} runs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Active Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${activeIncidents > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {activeIncidents}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {activeIncidents === 0 ? 'All clear!' : 'Need attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monitor Health Rankings */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Monitor Health Rankings</CardTitle>
          <CardDescription>
            Monitors ranked by health score (last 7 days)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedMonitors.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No monitors yet</p>
              <p className="text-sm mt-2">Create your first monitor to see analytics</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monitor</TableHead>
                  <TableHead>Health Score</TableHead>
                  <TableHead>Uptime (7d)</TableHead>
                  <TableHead>Uptime (30d)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>MTBF</TableHead>
                  <TableHead>MTTR</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMonitors.map(({ monitor, healthScore, uptime7d, uptime30d, mtbf, mttr }) => (
                  <TableRow key={monitor.id}>
                    <TableCell className="font-medium">
                      <Link href={`/app/monitors/${monitor.id}`} className="hover:underline">
                        {monitor.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`px-3 py-1 rounded-full ${getHealthScoreBgColor(healthScore.score)}`}>
                          <span className={`font-bold ${getHealthScoreColor(healthScore.score)}`}>
                            {healthScore.score}
                          </span>
                        </div>
                        <Badge variant="outline">{healthScore.grade}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={uptime7d >= 95 ? 'text-green-600' : uptime7d >= 90 ? 'text-yellow-600' : 'text-red-600'}>
                        {uptime7d.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={uptime30d >= 95 ? 'text-green-600' : uptime30d >= 90 ? 'text-yellow-600' : 'text-red-600'}>
                        {uptime30d.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          monitor.status === 'OK' ? 'default' :
                          monitor.status === 'LATE' ? 'secondary' :
                          monitor.status === 'FAILING' || monitor.status === 'MISSED' ? 'destructive' :
                          'outline'
                        }
                      >
                        {monitor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {mtbf !== null
                        ? mtbf > 86400
                          ? `${(mtbf / 86400).toFixed(1)}d`
                          : mtbf > 3600
                          ? `${(mtbf / 3600).toFixed(1)}h`
                          : `${(mtbf / 60).toFixed(0)}m`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {mttr !== null
                        ? mttr > 3600
                          ? `${(mttr / 3600).toFixed(1)}h`
                          : `${(mttr / 60).toFixed(0)}m`
                        : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/app/monitors/${monitor.id}`}>
                        <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                          View →
                        </Badge>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Highest health scores (7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedMonitors.slice(0, 5).length === 0 ? (
              <p className="text-center py-8 text-gray-500">No data</p>
            ) : (
              <div className="space-y-3">
                {sortedMonitors.slice(0, 5).map(({ monitor, healthScore, uptime7d }, index) => (
                  <div key={monitor.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-gray-400">#{index + 1}</span>
                      <div>
                        <Link href={`/app/monitors/${monitor.id}`} className="font-medium hover:underline">
                          {monitor.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {uptime7d.toFixed(1)}% uptime
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${getHealthScoreBgColor(healthScore.score)}`}>
                      <span className={`text-xl font-bold ${getHealthScoreColor(healthScore.score)}`}>
                        {healthScore.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Needs Attention</CardTitle>
            <CardDescription>Lowest health scores (7 days)</CardDescription>
          </CardHeader>
          <CardContent>
            {sortedMonitors.slice().reverse().slice(0, 5).length === 0 ? (
              <p className="text-center py-8 text-gray-500">No data</p>
            ) : (
              <div className="space-y-3">
                {sortedMonitors.slice().reverse().slice(0, 5).map(({ monitor, healthScore, uptime7d }) => (
                  <div key={monitor.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <AlertCircle className={`h-5 w-5 ${healthScore.score < 70 ? 'text-red-500' : 'text-yellow-500'}`} />
                      <div>
                        <Link href={`/app/monitors/${monitor.id}`} className="font-medium hover:underline">
                          {monitor.name}
                        </Link>
                        <p className="text-sm text-gray-500">
                          {uptime7d.toFixed(1)}% uptime
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${getHealthScoreBgColor(healthScore.score)}`}>
                      <span className={`text-xl font-bold ${getHealthScoreColor(healthScore.score)}`}>
                        {healthScore.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Success Rate (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-4xl font-bold ${overallSuccessRate >= 95 ? 'text-green-600' : overallSuccessRate >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
              {overallSuccessRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {successfulRuns} of {totalRuns} runs successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Avg MTBF</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-blue-600">
              {(() => {
                const mtbfValues = monitorAnalytics.filter(m => m.mtbf !== null).map(m => m.mtbf!);
                if (mtbfValues.length === 0) return '—';
                const avgMTBF = mtbfValues.reduce((a, b) => a + b, 0) / mtbfValues.length;
                if (avgMTBF > 86400) return `${(avgMTBF / 86400).toFixed(1)}d`;
                if (avgMTBF > 3600) return `${(avgMTBF / 3600).toFixed(1)}h`;
                return `${(avgMTBF / 60).toFixed(0)}m`;
              })()}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Mean time between failures
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">Avg MTTR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-purple-600">
              {(() => {
                const mttrValues = monitorAnalytics.filter(m => m.mttr !== null).map(m => m.mttr!);
                if (mttrValues.length === 0) return '—';
                const avgMTTR = mttrValues.reduce((a, b) => a + b, 0) / mttrValues.length;
                if (avgMTTR > 3600) return `${(avgMTTR / 3600).toFixed(1)}h`;
                return `${(avgMTTR / 60).toFixed(0)}m`;
              })()}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Mean time to repair
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Health Score Distribution */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Health Score Distribution</CardTitle>
          <CardDescription>How your monitors are performing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {['A (90-100)', 'B (80-89)', 'C (70-79)', 'D (60-69)', 'F (<60)'].map((grade, index) => {
              const gradeKey = grade[0] as 'A' | 'B' | 'C' | 'D' | 'F';
              const count = monitorAnalytics.filter(m => m.healthScore.grade === gradeKey).length;
              const colors = [
                'bg-green-100 text-green-800',
                'bg-blue-100 text-blue-800',
                'bg-yellow-100 text-yellow-800',
                'bg-orange-100 text-orange-800',
                'bg-red-100 text-red-800',
              ];
              
              return (
                <div key={grade} className="text-center">
                  <div className={`text-4xl font-bold mb-2 px-4 py-3 rounded-lg ${colors[index]}`}>
                    {count}
                  </div>
                  <p className="text-sm text-gray-600">{grade}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reliability Insights */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Reliability Insights</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Most Reliable Monitors</h4>
              <div className="space-y-2">
                {sortedMonitors.slice(0, 3).map(({ monitor, uptime7d }) => (
                  <div key={monitor.id} className="flex items-center justify-between p-2 border-l-4 border-green-500 pl-3">
                    <Link href={`/app/monitors/${monitor.id}`} className="font-medium text-sm hover:underline">
                      {monitor.name}
                    </Link>
                    <span className="text-sm font-bold text-green-600">
                      {uptime7d.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-3">Needs Improvement</h4>
              <div className="space-y-2">
                {sortedMonitors.slice().reverse().slice(0, 3).map(({ monitor, uptime7d }) => (
                  <div key={monitor.id} className="flex items-center justify-between p-2 border-l-4 border-red-500 pl-3">
                    <Link href={`/app/monitors/${monitor.id}`} className="font-medium text-sm hover:underline">
                      {monitor.name}
                    </Link>
                    <span className="text-sm font-bold text-red-600">
                      {uptime7d.toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}





