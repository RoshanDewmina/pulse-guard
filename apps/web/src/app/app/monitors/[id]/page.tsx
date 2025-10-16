import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { redirect } from 'next/navigation';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnBadge,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
  SaturnTabs,
  StatusIcon,
} from '@/components/saturn';
import { formatSchedule } from '@/lib/schedule';
import { format } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle, XCircle, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { DurationChart } from '@/components/duration-chart';
import { RunSparkline } from '@/components/run-sparkline';
import { OutputCaptureToggle } from '@/components/output-capture-toggle';
import { CopyButton } from '@/components/copy-button';
import { DeleteMonitorButton } from '@/components/delete-monitor-button';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

type MonitorStatus = 'OK' | 'LATE' | 'MISSED' | 'FAILING' | 'DISABLED';
type RunOutcome = 'STARTED' | 'SUCCESS' | 'FAIL' | 'TIMEOUT' | 'LATE' | 'MISSED';

export default async function MonitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  const { id } = await params;
  const monitor = await prisma.monitor.findUnique({
    where: { id },
    include: {
      org: {
        include: {
          subscriptionPlan: true,
        },
      },
      runs: {
        take: 50,
        orderBy: {
          startedAt: 'desc',
        },
      },
      incidents: {
        take: 20,
        orderBy: {
          openedAt: 'desc',
        },
      },
      _count: {
        select: {
          runs: true,
          incidents: true,
        },
      },
    },
  });

  if (!monitor) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4 text-[#37322F] font-serif">Monitor Not Found</h1>
        <Link href="/app/monitors">
          <SaturnButton>Back to Monitors</SaturnButton>
        </Link>
      </div>
    );
  }

  // Check access
  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: {
        userId: session.user.id,
        orgId: monitor.orgId,
      },
    },
  });

  if (!membership) {
    redirect('/app');
  }

  const outcomeIcon = {
    STARTED: <Clock className="w-4 h-4 text-blue-600" />,
    SUCCESS: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    FAIL: <XCircle className="w-4 h-4 text-red-600" />,
    TIMEOUT: <AlertCircle className="w-4 h-4 text-orange-600" />,
    LATE: <Clock className="w-4 h-4 text-yellow-600" />,
    MISSED: <AlertCircle className="w-4 h-4 text-orange-600" />,
  };

  const getStatusVariant = (status: MonitorStatus): 'success' | 'warning' | 'error' | 'default' => {
    if (status === 'OK') return 'success';
    if (status === 'LATE' || status === 'MISSED') return 'warning';
    if (status === 'FAILING') return 'error';
    return 'default';
  };

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <PageHeaderWithBreadcrumbs
        title={
          <div className="flex items-center gap-3 flex-wrap">
            <span>{monitor.name}</span>
            <StatusIcon status={monitor.status as MonitorStatus} />
            <SaturnBadge variant={getStatusVariant(monitor.status as MonitorStatus)}>
              {monitor.status}
            </SaturnBadge>
          </div>
        }
        description={`Schedule: ${formatSchedule(monitor.scheduleType, monitor.intervalSec, monitor.cronExpr)}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Monitors', href: '/app/monitors' },
          { label: monitor.name },
        ]}
        action={
          <div className="flex gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
            <Link href={`/app/monitors/${monitor.id}/edit`} className="flex-1 sm:flex-initial">
              <SaturnButton variant="secondary" fullWidth className="sm:w-auto whitespace-nowrap">Edit</SaturnButton>
            </Link>
            <DeleteMonitorButton monitorId={monitor.id} monitorName={monitor.name} />
          </div>
        }
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3">Schedule</div>
            <div className="text-2xl font-bold text-[#37322F] font-sans">
              {formatSchedule(monitor.scheduleType, monitor.intervalSec, monitor.cronExpr)}
            </div>
            <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-1">{monitor.timezone}</p>
          </div>
        </SaturnCard>

        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3">Last Run</div>
            <div className="text-2xl font-bold text-[#37322F] font-sans">
              {monitor.lastRunAt ? format(monitor.lastRunAt, 'HH:mm') : '—'}
            </div>
            <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-1">
              {monitor.lastRunAt ? format(monitor.lastRunAt, 'MMM d, yyyy') : 'Never run'}
            </p>
          </div>
        </SaturnCard>

        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3">Duration</div>
            <div className="text-2xl font-bold text-[#37322F] font-sans">
              {monitor.lastDurationMs ? `${monitor.lastDurationMs}ms` : '—'}
            </div>
            <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-1">
              {monitor.lastExitCode !== null && monitor.lastExitCode !== undefined
                ? `Exit: ${monitor.lastExitCode}`
                : 'No data'}
            </p>
          </div>
        </SaturnCard>

        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3">Total Runs</div>
            <div className="text-2xl font-bold text-[#37322F] font-sans">{monitor._count.runs}</div>
            <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-1">
              {monitor._count.incidents} open incident{monitor._count.incidents !== 1 ? 's' : ''}
            </p>
          </div>
        </SaturnCard>
      </div>

      {/* Monitor Token */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h2">Monitor Token</SaturnCardTitle>
          <SaturnCardDescription>Use this token to send pings from your cron jobs</SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-gray-100 px-4 py-2 rounded-lg text-sm font-mono text-[#37322F] border border-[rgba(55,50,47,0.12)]">
                {monitor.token}
              </code>
              <CopyButton textToCopy={monitor.token} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-[#37322F] font-sans">Integration Examples:</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-[rgba(55,50,47,0.60)] mb-1 font-sans">Bash (simple)</p>
                  <code className="block bg-gray-900 text-green-400 px-3 py-2 rounded-lg text-xs font-mono overflow-x-auto">
                    curl http://localhost:3000/api/ping/{monitor.token}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-[rgba(55,50,47,0.60)] mb-1 font-sans">Bash (with start/finish)</p>
                  <code className="block bg-gray-900 text-green-400 px-3 py-2 rounded-lg text-xs font-mono overflow-x-auto whitespace-pre">
{`curl http://localhost:3000/api/ping/${monitor.token}?state=start
# Your job here
curl http://localhost:3000/api/ping/${monitor.token}?state=success&exitCode=0`}
                  </code>
                </div>
                <div>
                  <p className="text-xs text-[rgba(55,50,47,0.60)] mb-1 font-sans">CLI Wrapper</p>
                  <code className="block bg-gray-900 text-green-400 px-3 py-2 rounded-lg text-xs font-mono overflow-x-auto">
                    pulse run --token {monitor.token} -- your-command
                  </code>
                </div>
              </div>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>

      {/* Tabs */}
      <SaturnTabs
        tabs={[
          {
            id: 'runs',
            label: 'Run History',
            content: (
              <div className="space-y-6">
                {/* Duration Chart */}
                {monitor.runs.length > 0 && (
                  <SaturnCard>
                    <SaturnCardHeader>
                      <SaturnCardTitle as="h3">Duration Trend</SaturnCardTitle>
                      <SaturnCardDescription>Job execution time over last 20 runs</SaturnCardDescription>
                    </SaturnCardHeader>
                    <SaturnCardContent>
                      <DurationChart runs={monitor.runs} />
                    </SaturnCardContent>
                  </SaturnCard>
                )}

                <SaturnCard padding="none">
                  <SaturnCardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <SaturnCardTitle as="h3">Recent Runs</SaturnCardTitle>
                        <SaturnCardDescription>Last {monitor.runs.length} execution attempts</SaturnCardDescription>
                      </div>
                      <RunSparkline runs={monitor.runs.slice(0, 10)} />
                    </div>
                  </SaturnCardHeader>
                  <SaturnCardContent>
                    {monitor.runs.length === 0 ? (
                      <div className="text-center py-8 text-[rgba(55,50,47,0.80)] font-sans">
                        No runs yet. Send your first ping to see it here.
                      </div>
                    ) : (
                      <SaturnTable>
                        <SaturnTableHeader>
                          <SaturnTableRow>
                            <SaturnTableHead>Outcome</SaturnTableHead>
                            <SaturnTableHead>Started At</SaturnTableHead>
                            <SaturnTableHead>Duration</SaturnTableHead>
                            <SaturnTableHead>Exit Code</SaturnTableHead>
                            <SaturnTableHead>Output</SaturnTableHead>
                            <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                          </SaturnTableRow>
                        </SaturnTableHeader>
                        <SaturnTableBody>
                          {monitor.runs.map((run) => (
                            <SaturnTableRow key={run.id}>
                              <SaturnTableCell>
                                <div className="flex items-center gap-2">
                                  {outcomeIcon[run.outcome as RunOutcome]}
                                  <span className="font-medium text-[#37322F]">{run.outcome}</span>
                                </div>
                              </SaturnTableCell>
                              <SaturnTableCell className="text-[#37322F]">
                                {format(run.startedAt, 'MMM d, yyyy HH:mm:ss')}
                              </SaturnTableCell>
                              <SaturnTableCell className="text-[#37322F]">
                                {run.durationMs !== null ? `${run.durationMs}ms` : '—'}
                              </SaturnTableCell>
                              <SaturnTableCell>
                                {run.exitCode !== null ? (
                                  <SaturnBadge variant={run.exitCode === 0 ? 'success' : 'error'} size="sm">
                                    {run.exitCode}
                                  </SaturnBadge>
                                ) : (
                                  <span className="text-[rgba(55,50,47,0.40)]">—</span>
                                )}
                              </SaturnTableCell>
                              <SaturnTableCell>
                                {run.outputKey ? (
                                  <div className="flex items-center gap-1 text-sm text-[#37322F]">
                                    <FileText className="h-3 w-3" />
                                    {run.sizeBytes ? (
                                      run.sizeBytes < 1024
                                        ? `${run.sizeBytes} B`
                                        : run.sizeBytes < 1024 * 1024
                                        ? `${(run.sizeBytes / 1024).toFixed(1)} KB`
                                        : `${(run.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                                    ) : 'Captured'}
                                  </div>
                                ) : (
                                  <span className="text-[rgba(55,50,47,0.40)]">—</span>
                                )}
                              </SaturnTableCell>
                              <SaturnTableCell className="text-right">
                                {run.outputKey ? (
                                  <Link href={`/app/monitors/${monitor.id}/runs/${run.id}`}>
                                    <SaturnButton variant="ghost" size="sm">
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </SaturnButton>
                                  </Link>
                                ) : (
                                  <SaturnButton variant="ghost" size="sm" disabled>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </SaturnButton>
                                )}
                              </SaturnTableCell>
                            </SaturnTableRow>
                          ))}
                        </SaturnTableBody>
                      </SaturnTable>
                    )}
                  </SaturnCardContent>
                </SaturnCard>
              </div>
            ),
          },
          {
            id: 'incidents',
            label: `Incidents (${monitor._count.incidents})`,
            content: (
              <SaturnCard>
                <SaturnCardHeader>
                  <SaturnCardTitle as="h3">Open Incidents</SaturnCardTitle>
                  <SaturnCardDescription>Issues detected for this monitor</SaturnCardDescription>
                </SaturnCardHeader>
                <SaturnCardContent>
                  {monitor.incidents.length === 0 ? (
                    <div className="text-center py-8 text-[rgba(55,50,47,0.80)] font-sans">
                      No incidents. This monitor is running smoothly! 🎉
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {monitor.incidents.map((incident) => (
                        <Link
                          key={incident.id}
                          href={`/app/incidents/${incident.id}`}
                          className="block p-4 rounded-lg border border-[rgba(55,50,47,0.08)] hover:bg-[#F7F5F3] transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-[#37322F] font-sans">{incident.summary}</div>
                              <div className="text-sm text-[rgba(55,50,47,0.60)] font-sans mt-1">
                                {format(incident.openedAt, 'MMM d, yyyy HH:mm')}
                              </div>
                            </div>
                            <SaturnBadge variant={incident.status === 'OPEN' ? 'error' : 'warning'} size="sm">
                              {incident.status}
                            </SaturnBadge>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </SaturnCardContent>
              </SaturnCard>
            ),
          },
          {
            id: 'settings',
            label: 'Settings',
            content: (
              <SaturnCard>
                <SaturnCardHeader>
                  <SaturnCardTitle as="h3">Monitor Settings</SaturnCardTitle>
                  <SaturnCardDescription>Configuration and advanced options</SaturnCardDescription>
                </SaturnCardHeader>
                <SaturnCardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-[#37322F] font-sans mb-3">Output Capture</h4>
                      <OutputCaptureToggle 
                        monitorId={monitor.id}
                        captureOutput={monitor.captureOutput ?? false}
                        captureLimitKb={monitor.captureLimitKb ?? 32}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#37322F] font-sans mb-2">Grace Period</h4>
                      <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                        {monitor.graceSec} seconds
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#37322F] font-sans mb-2">Created</h4>
                      <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                        {format(monitor.createdAt, 'PPP')}
                      </p>
                    </div>
                  </div>
                </SaturnCardContent>
              </SaturnCard>
            ),
          },
        ]}
        defaultTab="runs"
      />
    </div>
  );
}
