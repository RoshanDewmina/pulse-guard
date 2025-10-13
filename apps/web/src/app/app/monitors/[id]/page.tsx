import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { redirect } from 'next/navigation';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { formatSchedule } from '@/lib/schedule';
import { format } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle, XCircle, Copy, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { DurationChart } from '@/components/duration-chart';
import { RunSparkline } from '@/components/run-sparkline';
import { OutputCaptureToggle } from '@/components/output-capture-toggle';

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
        <h1 className="text-2xl font-bold mb-4">Monitor Not Found</h1>
        <Link href="/app/monitors">
          <Button>Back to Monitors</Button>
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

  const statusIcon = {
    OK: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    LATE: <Clock className="w-5 h-5 text-yellow-600" />,
    MISSED: <AlertCircle className="w-5 h-5 text-orange-600" />,
    FAILING: <XCircle className="w-5 h-5 text-red-600" />,
    DISABLED: <XCircle className="w-5 h-5 text-gray-400" />,
  };

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
    OK: 'default',
    LATE: 'secondary',
    MISSED: 'destructive',
    FAILING: 'destructive',
    DISABLED: 'secondary',
  };

  const outcomeIcon = {
    STARTED: <Clock className="w-4 h-4 text-blue-600" />,
    SUCCESS: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    FAIL: <XCircle className="w-4 h-4 text-red-600" />,
    TIMEOUT: <AlertCircle className="w-4 h-4 text-orange-600" />,
    LATE: <Clock className="w-4 h-4 text-yellow-600" />,
    MISSED: <AlertCircle className="w-4 h-4 text-orange-600" />,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/app/monitors" className="text-sm text-gray-500 hover:underline">
              Monitors
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-sm">{monitor.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{monitor.name}</h1>
            {statusIcon[monitor.status]}
            <Badge variant={statusVariant[monitor.status as keyof typeof statusVariant]}>
              {monitor.status}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Edit</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatSchedule(monitor.scheduleType, monitor.intervalSec, monitor.cronExpr)}
            </div>
            <p className="text-xs text-gray-500 mt-1">{monitor.timezone}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Last Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitor.lastRunAt ? format(monitor.lastRunAt, 'HH:mm') : '—'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {monitor.lastRunAt ? format(monitor.lastRunAt, 'MMM d, yyyy') : 'Never run'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monitor.lastDurationMs ? `${monitor.lastDurationMs}ms` : '—'}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {monitor.lastExitCode !== null && monitor.lastExitCode !== undefined
                ? `Exit: ${monitor.lastExitCode}`
                : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monitor._count.runs}</div>
            <p className="text-xs text-gray-500 mt-1">
              {monitor._count.incidents} open incident{monitor._count.incidents !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monitor Token */}
      <Card>
        <CardHeader>
          <CardTitle>Monitor Token</CardTitle>
          <CardDescription>Use this token to send pings from your cron jobs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-100 px-4 py-2 rounded text-sm font-mono">
              {monitor.token}
            </code>
            <Button variant="outline" size="sm">
              <Copy className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Integration Examples:</p>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">Bash (simple)</p>
                <code className="block bg-gray-900 text-green-400 px-3 py-2 rounded text-xs font-mono overflow-x-auto">
                  curl http://localhost:3000/api/ping/{monitor.token}
                </code>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Bash (with start/finish)</p>
                <code className="block bg-gray-900 text-green-400 px-3 py-2 rounded text-xs font-mono overflow-x-auto whitespace-pre">
{`curl http://localhost:3000/api/ping/${monitor.token}?state=start
# Your job here
curl http://localhost:3000/api/ping/${monitor.token}?state=success&exitCode=0`}
                </code>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">CLI Wrapper</p>
                <code className="block bg-gray-900 text-green-400 px-3 py-2 rounded text-xs font-mono overflow-x-auto">
                  pulse run --token {monitor.token} -- your-command
                </code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Run History</TabsTrigger>
          <TabsTrigger value="incidents">Incidents ({monitor._count.incidents})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-4">
          {/* Duration Chart */}
          {monitor.runs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Duration Trend</CardTitle>
                <CardDescription>Job execution time over last 20 runs</CardDescription>
              </CardHeader>
              <CardContent>
                <DurationChart runs={monitor.runs} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Recent Runs</CardTitle>
                  <CardDescription>Last {monitor.runs.length} execution attempts</CardDescription>
                </div>
                <RunSparkline runs={monitor.runs.slice(0, 10)} />
              </div>
            </CardHeader>
            <CardContent>
              {monitor.runs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No runs yet. Send your first ping to see it here.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Started At</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Exit Code</TableHead>
                      <TableHead>Output</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monitor.runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {outcomeIcon[run.outcome]}
                            <span className="font-medium">{run.outcome}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {format(run.startedAt, 'MMM d, yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="text-sm">
                          {run.durationMs !== null ? `${run.durationMs}ms` : '—'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {run.exitCode !== null ? (
                            <Badge variant={run.exitCode === 0 ? 'default' : 'destructive'}>
                              {run.exitCode}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {run.outputKey ? (
                            <Badge variant="outline" className="gap-1">
                              <FileText className="h-3 w-3" />
                              {run.sizeBytes ? (
                                run.sizeBytes < 1024
                                  ? `${run.sizeBytes} B`
                                  : run.sizeBytes < 1024 * 1024
                                  ? `${(run.sizeBytes / 1024).toFixed(1)} KB`
                                  : `${(run.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                              ) : 'Captured'}
                            </Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {run.outputKey ? (
                            <Link href={`/app/monitors/${monitor.id}/runs/${run.id}`}>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Incidents</CardTitle>
              <CardDescription>Issues detected for this monitor</CardDescription>
            </CardHeader>
            <CardContent>
              {monitor.incidents.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No incidents. Your monitor is running smoothly!
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kind</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Opened At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {monitor.incidents.map((incident) => (
                      <TableRow key={incident.id}>
                        <TableCell>
                          <Badge variant="destructive">{incident.kind}</Badge>
                        </TableCell>
                        <TableCell className="font-medium">{incident.summary}</TableCell>
                        <TableCell className="text-sm">
                          {format(incident.openedAt, 'MMM d, HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={incident.status === 'RESOLVED' ? 'default' : 'secondary'}>
                            {incident.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {incident.status === 'OPEN' && (
                            <Button variant="ghost" size="sm">
                              Acknowledge
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monitor Settings</CardTitle>
              <CardDescription>Configure how this monitor behaves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Schedule Type</p>
                  <p className="text-lg font-semibold">{monitor.scheduleType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Grace Period</p>
                  <p className="text-lg font-semibold">{monitor.graceSec}s</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Timezone</p>
                  <p className="text-lg font-semibold">{monitor.timezone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Output Capture</p>
                  <p className="text-lg font-semibold">
                    {monitor.captureOutput ? `Enabled (${monitor.captureLimitKb}KB)` : 'Disabled'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <OutputCaptureToggle
            monitorId={monitor.id}
            captureOutput={monitor.captureOutput}
            captureLimitKb={monitor.captureLimitKb}
          />

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                <div>
                  <p className="font-medium">Delete this monitor</p>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone. All run history will be lost.
                  </p>
                </div>
                <Button variant="destructive">Delete Monitor</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

