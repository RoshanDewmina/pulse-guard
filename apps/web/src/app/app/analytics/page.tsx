import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnBadge,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
  PageHeader,
} from '@/components/saturn';
import { calculateHealthScore, calculateUptime, calculateMTBF, calculateMTTR, getHealthScoreColor, getHealthScoreBgColor } from '@/lib/analytics/health-score';
import { Activity, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

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

  // Sort monitors by health score
  const sortedMonitors = [...monitorAnalytics].sort((a, b) => b.healthScore.score - a.healthScore.score);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    if (status === 'OK') return 'success';
    if (status === 'LATE') return 'warning';
    if (status === 'FAILING' || status === 'MISSED') return 'error';
    return 'default';
  };

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <PageHeaderWithBreadcrumbs
        title="Analytics"
        description="Monitor health, performance, and reliability insights"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Analytics' },
        ]}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Total Monitors
            </div>
            <p className="text-3xl font-bold text-[#37322F] font-sans">{totalMonitors}</p>
            <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mt-1">
              {org.monitors.filter(m => m.status === 'OK').length} healthy
            </p>
          </div>
        </SaturnCard>

        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Avg Health Score
            </div>
            <p className={`text-3xl font-bold font-sans ${getHealthScoreColor(avgHealthScore)}`}>
              {Math.round(avgHealthScore)}
            </p>
            <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mt-1">Out of 100</p>
          </div>
        </SaturnCard>

        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Uptime (7d)
            </div>
            <p className="text-3xl font-bold text-green-600 font-sans">
              {avgUptime.toFixed(1)}%
            </p>
            <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mt-1">
              {successfulRuns}/{totalRuns} runs
            </p>
          </div>
        </SaturnCard>

        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Active Incidents
            </div>
            <p className={`text-3xl font-bold font-sans ${activeIncidents > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {activeIncidents}
            </p>
            <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mt-1">
              {activeIncidents === 0 ? 'All clear!' : 'Need attention'}
            </p>
          </div>
        </SaturnCard>
      </div>

      {/* Monitor Health Rankings */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h2">Monitor Health Rankings</SaturnCardTitle>
          <SaturnCardDescription>
            Monitors ranked by health score (last 7 days)
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          {sortedMonitors.length === 0 ? (
            <div className="text-center py-12 text-[rgba(55,50,47,0.80)]">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium font-sans">No monitors yet</p>
              <p className="text-sm mt-2 font-sans">Create your first monitor to see analytics</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <SaturnTable>
                <SaturnTableHeader>
                  <SaturnTableRow>
                    <SaturnTableHead>Monitor</SaturnTableHead>
                    <SaturnTableHead>Health Score</SaturnTableHead>
                    <SaturnTableHead>Uptime (7d)</SaturnTableHead>
                    <SaturnTableHead>Uptime (30d)</SaturnTableHead>
                    <SaturnTableHead>Status</SaturnTableHead>
                    <SaturnTableHead>MTBF</SaturnTableHead>
                    <SaturnTableHead>MTTR</SaturnTableHead>
                    <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                  </SaturnTableRow>
                </SaturnTableHeader>
                <SaturnTableBody>
                  {sortedMonitors.map(({ monitor, healthScore, uptime7d, uptime30d, mtbf, mttr }) => (
                    <SaturnTableRow key={monitor.id}>
                      <SaturnTableCell className="font-medium">
                        <Link href={`/app/monitors/${monitor.id}`} className="hover:underline text-[#37322F]">
                          {monitor.name}
                        </Link>
                      </SaturnTableCell>
                      <SaturnTableCell>
                        <div className="flex items-center gap-2">
                          <div className={`px-3 py-1 rounded-full ${getHealthScoreBgColor(healthScore.score)}`}>
                            <span className={`font-bold font-sans ${getHealthScoreColor(healthScore.score)}`}>
                              {healthScore.score}
                            </span>
                          </div>
                          <SaturnBadge variant="default" size="sm">{healthScore.grade}</SaturnBadge>
                        </div>
                      </SaturnTableCell>
                      <SaturnTableCell>
                        <span className={`font-sans ${uptime7d >= 95 ? 'text-green-600' : uptime7d >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {uptime7d.toFixed(1)}%
                        </span>
                      </SaturnTableCell>
                      <SaturnTableCell>
                        <span className={`font-sans ${uptime30d >= 95 ? 'text-green-600' : uptime30d >= 90 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {uptime30d.toFixed(1)}%
                        </span>
                      </SaturnTableCell>
                      <SaturnTableCell>
                        <SaturnBadge variant={getStatusVariant(monitor.status)} size="sm">
                          {monitor.status}
                        </SaturnBadge>
                      </SaturnTableCell>
                      <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                        {mtbf !== null
                          ? mtbf > 86400
                            ? `${(mtbf / 86400).toFixed(1)}d`
                            : mtbf > 3600
                            ? `${(mtbf / 3600).toFixed(1)}h`
                            : `${(mtbf / 60).toFixed(0)}m`
                          : '—'}
                      </SaturnTableCell>
                      <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                        {mttr !== null
                          ? mttr > 3600
                            ? `${(mttr / 3600).toFixed(1)}h`
                            : `${(mttr / 60).toFixed(0)}m`
                          : '—'}
                      </SaturnTableCell>
                      <SaturnTableCell className="text-right">
                        <Link href={`/app/monitors/${monitor.id}`}>
                          <SaturnBadge variant="default" size="sm" className="cursor-pointer hover:bg-[rgba(55,50,47,0.08)]">
                            View →
                          </SaturnBadge>
                        </Link>
                      </SaturnTableCell>
                    </SaturnTableRow>
                  ))}
                </SaturnTableBody>
              </SaturnTable>
            </div>
          )}
        </SaturnCardContent>
      </SaturnCard>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h3">Top Performers</SaturnCardTitle>
            <SaturnCardDescription>Highest health scores (7 days)</SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            {sortedMonitors.slice(0, 5).length === 0 ? (
              <p className="text-center py-8 text-[rgba(55,50,47,0.80)] font-sans">No data</p>
            ) : (
              <div className="space-y-3">
                {sortedMonitors.slice(0, 5).map(({ monitor, healthScore, uptime7d }, index) => (
                  <div key={monitor.id} className="flex items-center justify-between p-3 border border-[rgba(55,50,47,0.08)] rounded-lg hover:bg-[rgba(55,50,47,0.04)] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-[rgba(55,50,47,0.40)] font-sans">#{index + 1}</span>
                      <div>
                        <Link href={`/app/monitors/${monitor.id}`} className="font-medium hover:underline text-[#37322F] font-sans">
                          {monitor.name}
                        </Link>
                        <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                          {uptime7d.toFixed(1)}% uptime
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${getHealthScoreBgColor(healthScore.score)}`}>
                      <span className={`text-xl font-bold font-sans ${getHealthScoreColor(healthScore.score)}`}>
                        {healthScore.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h3">Needs Attention</SaturnCardTitle>
            <SaturnCardDescription>Lowest health scores (7 days)</SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            {sortedMonitors.slice().reverse().slice(0, 5).length === 0 ? (
              <p className="text-center py-8 text-[rgba(55,50,47,0.80)] font-sans">No data</p>
            ) : (
              <div className="space-y-3">
                {sortedMonitors.slice().reverse().slice(0, 5).map(({ monitor, healthScore, uptime7d }) => (
                  <div key={monitor.id} className="flex items-center justify-between p-3 border border-[rgba(55,50,47,0.08)] rounded-lg hover:bg-[rgba(55,50,47,0.04)] transition-colors">
                    <div className="flex items-center gap-3">
                      <AlertCircle className={`h-5 w-5 ${healthScore.score < 70 ? 'text-red-500' : 'text-yellow-500'}`} />
                      <div>
                        <Link href={`/app/monitors/${monitor.id}`} className="font-medium hover:underline text-[#37322F] font-sans">
                          {monitor.name}
                        </Link>
                        <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                          {uptime7d.toFixed(1)}% uptime
                        </p>
                      </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${getHealthScoreBgColor(healthScore.score)}`}>
                      <span className={`text-xl font-bold font-sans ${getHealthScoreColor(healthScore.score)}`}>
                        {healthScore.score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SaturnCardContent>
        </SaturnCard>
      </div>
    </div>
  );
}
