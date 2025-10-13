import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
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
import { format } from 'date-fns';
import Link from 'next/link';
import { AcknowledgeButton } from '@/components/acknowledge-button';
import { ResolveButton } from '@/components/resolve-button';

export default async function IncidentsPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return <div>No organization found</div>;
  }

  const incidents = await prisma.incident.findMany({
    where: {
      monitor: {
        orgId: org.id,
      },
    },
    include: {
      monitor: true,
    },
    orderBy: {
      openedAt: 'desc',
    },
    take: 100,
  });

  const openIncidents = incidents.filter(i => i.status === 'OPEN');
  const ackedIncidents = incidents.filter(i => i.status === 'ACKED');
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED');

  const statusVariant = {
    OPEN: 'destructive' as const,
    ACKED: 'secondary' as const,
    RESOLVED: 'default' as const,
  };

  const kindEmoji = {
    MISSED: '⏰',
    LATE: '🕐',
    FAIL: '❌',
    ANOMALY: '📊',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Incidents</h1>
        <p className="text-gray-600">Track and manage issues with your monitors</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{openIncidents.length}</div>
            <p className="text-xs text-gray-500 mt-1">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Acknowledged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{ackedIncidents.length}</div>
            <p className="text-xs text-gray-500 mt-1">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{resolvedIncidents.length}</div>
            <p className="text-xs text-gray-500 mt-1">Fixed and closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Incidents Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Incidents ({incidents.length})</CardTitle>
          <CardDescription>Chronological list of all detected issues</CardDescription>
        </CardHeader>
        <CardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold mb-2">No Incidents!</h3>
              <p className="text-gray-600">All your monitors are running smoothly.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kind</TableHead>
                  <TableHead>Monitor</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{kindEmoji[incident.kind]}</span>
                        <Badge variant="destructive">{incident.kind}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/app/monitors/${incident.monitorId}`}
                        className="hover:underline font-medium"
                      >
                        {incident.monitor.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{incident.summary}</TableCell>
                    <TableCell className="text-sm">
                      {format(incident.openedAt, 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[incident.status]}>
                        {incident.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {incident.status === 'OPEN' && (
                          <AcknowledgeButton incidentId={incident.id} />
                        )}
                        {(incident.status === 'OPEN' || incident.status === 'ACKED') && (
                          <ResolveButton incidentId={incident.id} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

