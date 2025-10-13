import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Activity, AlertCircle, CheckCircle2, Clock, Plus } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4">No Organization Found</h1>
        <p className="text-gray-600">Please contact support.</p>
      </div>
    );
  }

  // Get monitor counts by status
  const monitors = await prisma.monitor.findMany({
    where: { orgId: org.id },
    include: {
      _count: {
        select: {
          incidents: {
            where: {
              status: { in: ['OPEN', 'ACKED'] },
            },
          },
        },
      },
    },
    take: 10,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const statusCounts = {
    ok: monitors.filter(m => m.status === 'OK').length,
    late: monitors.filter(m => m.status === 'LATE').length,
    missed: monitors.filter(m => m.status === 'MISSED').length,
    failing: monitors.filter(m => m.status === 'FAILING').length,
  };

  // Get recent incidents
  const incidents = await prisma.incident.findMany({
    where: {
      monitor: {
        orgId: org.id,
      },
      status: { in: ['OPEN', 'ACKED'] },
    },
    include: {
      monitor: true,
    },
    take: 10,
    orderBy: {
      openedAt: 'desc',
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{org.name}</h1>
          <p className="text-gray-600">Monitor your jobs and get instant alerts</p>
        </div>
        <Link href="/app/monitors/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Monitor
          </Button>
        </Link>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.ok}</div>
            <p className="text-xs text-muted-foreground">monitors running smoothly</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.late}</div>
            <p className="text-xs text-muted-foreground">jobs completed late</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Missed</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.missed}</div>
            <p className="text-xs text-muted-foreground">jobs didn&apos;t run</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failing</CardTitle>
            <Activity className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts.failing}</div>
            <p className="text-xs text-muted-foreground">jobs with failures</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Monitors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Monitors</CardTitle>
          <CardDescription>Your most recently updated monitors</CardDescription>
        </CardHeader>
        <CardContent>
          {monitors.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              <p className="mb-4">No monitors yet. Create your first one!</p>
              <Link href="/app/monitors/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Monitor
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {monitors.map(monitor => (
                <Link
                  key={monitor.id}
                  href={`/app/monitors/${monitor.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <div className="font-medium">{monitor.name}</div>
                    <div className="text-sm text-gray-600">
                      Last run: {monitor.lastRunAt ? new Date(monitor.lastRunAt).toLocaleString() : 'Never'}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {monitor._count.incidents > 0 && (
                      <Badge variant="destructive">{monitor._count.incidents} incident{monitor._count.incidents !== 1 ? 's' : ''}</Badge>
                    )}
                    <Badge
                      variant={
                        monitor.status === 'OK' ? 'default' :
                        monitor.status === 'LATE' ? 'secondary' :
                        'destructive'
                      }
                    >
                      {monitor.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Open Incidents */}
      {incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open Incidents</CardTitle>
            <CardDescription>Incidents requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.map(incident => (
                <Link
                  key={incident.id}
                  href={`/app/incidents/${incident.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
                >
                  <div>
                    <div className="font-medium">{incident.monitor.name}</div>
                    <div className="text-sm text-gray-600">{incident.summary}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      Opened {new Date(incident.openedAt).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant={incident.status === 'ACKED' ? 'secondary' : 'destructive'}>
                    {incident.kind}
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

