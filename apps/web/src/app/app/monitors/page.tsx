import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import Link from 'next/link';
import { Plus, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { formatSchedule } from '@/lib/schedule';
import { format } from 'date-fns';

export default async function MonitorsPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return <div>No organization found</div>;
  }

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
          runs: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const statusIcon = {
    OK: <CheckCircle2 className="w-4 h-4 text-green-600" />,
    LATE: <Clock className="w-4 h-4 text-yellow-600" />,
    MISSED: <AlertCircle className="w-4 h-4 text-orange-600" />,
    FAILING: <XCircle className="w-4 h-4 text-red-600" />,
    DISABLED: <XCircle className="w-4 h-4 text-gray-400" />,
  };

  const statusVariant = {
    OK: 'default' as const,
    LATE: 'secondary' as const,
    MISSED: 'secondary' as const,
    FAILING: 'destructive' as const,
    DISABLED: 'outline' as const,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monitors</h1>
          <p className="text-gray-600">Manage your cron job monitors</p>
        </div>
        <Link href="/app/monitors/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Monitor
          </Button>
        </Link>
      </div>

      {monitors.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Monitors Yet</CardTitle>
            <CardDescription>Get started by creating your first monitor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                Monitors help you track your cron jobs and scheduled tasks.
              </p>
              <Link href="/app/monitors/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Monitor
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Monitors ({monitors.length})</CardTitle>
            <CardDescription>
              {org.subscriptionPlan ? `Using ${monitors.length} of ${org.subscriptionPlan.monitorLimit} monitors` : 'Manage your monitors'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Last Run</TableHead>
                  <TableHead>Next Due</TableHead>
                  <TableHead>Incidents</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitors.map((monitor) => (
                  <TableRow key={monitor.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/app/monitors/${monitor.id}`}
                        className="hover:underline"
                      >
                        {monitor.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant[monitor.status]}
                        className="flex items-center gap-1 w-fit"
                      >
                        {statusIcon[monitor.status]}
                        {monitor.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatSchedule(monitor.scheduleType, monitor.intervalSec, monitor.cronExpr)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {monitor.lastRunAt ? (
                        <span>
                          {format(monitor.lastRunAt, 'MMM d, HH:mm')}
                          {monitor.lastDurationMs && (
                            <span className="text-gray-500 ml-2">
                              ({monitor.lastDurationMs}ms)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400">Never</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {monitor.nextDueAt ? (
                        format(monitor.nextDueAt, 'MMM d, HH:mm')
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {monitor._count.incidents > 0 ? (
                        <Badge variant="destructive">
                          {monitor._count.incidents}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/app/monitors/${monitor.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

