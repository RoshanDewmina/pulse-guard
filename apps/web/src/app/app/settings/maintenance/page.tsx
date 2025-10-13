import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
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
import { Calendar, Clock, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { getActiveWindows } from '@/lib/maintenance/scheduler';

export default async function MaintenancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

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
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    redirect('/');
  }

  const windows = await getActiveWindows(membership.orgId);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Maintenance Windows</h1>
            <p className="text-gray-600 mt-1">
              Schedule maintenance periods to suppress alerts
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Window
          </Button>
        </div>
      </div>

      {/* Active Windows */}
      {windows.some(w => w.isActive) && (
        <Card className="mb-6 border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Maintenance Windows
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {windows
                .filter(w => w.isActive)
                .map(window => (
                  <div key={window.id} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                    <div>
                      <p className="font-medium">{window.name}</p>
                      <p className="text-sm text-gray-600">
                        {format(window.startTime, 'PPp')} - {format(window.endTime, 'p')}
                      </p>
                    </div>
                    <Badge variant="secondary">Active Now</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Windows */}
      <Card>
        <CardHeader>
          <CardTitle>All Maintenance Windows</CardTitle>
          <CardDescription>
            Schedule periods where alerts will be suppressed
          </CardDescription>
        </CardHeader>
        <CardContent>
          {windows.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No maintenance windows</p>
              <p className="text-sm mt-2">
                Create a maintenance window to suppress alerts during planned downtime
              </p>
              <Button className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Maintenance Window
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Start Time</TableHead>
                  <TableHead>End Time</TableHead>
                  <TableHead>Recurrence</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {windows.map(window => (
                  <TableRow key={window.id}>
                    <TableCell className="font-medium">{window.name}</TableCell>
                    <TableCell>
                      {window.monitorId ? (
                        <Badge variant="outline">Specific Monitor</Badge>
                      ) : (
                        <Badge>All Monitors</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(window.startTime, 'PPp')}
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(window.endTime, 'PPp')}
                    </TableCell>
                    <TableCell>
                      {window.recurring ? (
                        <Badge variant="secondary">
                          {window.rrule ? window.rrule.split(';')[0].replace('FREQ=', '') : 'Recurring'}
                        </Badge>
                      ) : (
                        <span className="text-gray-500">One-time</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {window.isActive ? (
                        <Badge className="bg-yellow-100 text-yellow-800">Active</Badge>
                      ) : window.enabled ? (
                        <Badge variant="outline">Scheduled</Badge>
                      ) : (
                        <Badge variant="secondary">Disabled</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>About Maintenance Windows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600">
            Maintenance windows allow you to schedule periods where alerts will be suppressed. This is useful for:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
            <li>Planned maintenance or deployments</li>
            <li>Regular system updates (e.g., every Sunday night)</li>
            <li>Known downtime periods</li>
            <li>Testing or staging environment work</li>
          </ul>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md mt-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Jobs will still be monitored during maintenance windows, but no alerts will be sent. 
              Incidents will be created but marked as suppressed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




