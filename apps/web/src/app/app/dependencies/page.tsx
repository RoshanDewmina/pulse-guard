import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { DependencyGraph } from '@/components/dependency-graph';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle2, Clock, XCircle, GitBranch } from 'lucide-react';
import Link from 'next/link';

export default async function DependenciesPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/signin');
  }

  const org = await getUserPrimaryOrg(session.user.id);
  if (!org) {
    redirect('/');
  }

  // Fetch all monitors and their dependencies
  const monitors = await prisma.monitor.findMany({
    where: {
      orgId: org.id,
      status: { not: 'DISABLED' },
    },
    orderBy: { name: 'asc' },
  });

  const dependencies = await prisma.monitorDependency.findMany({
    where: {
      monitor: {
        orgId: org.id,
      },
    },
    include: {
      monitor: true,
      dependsOn: true,
    },
  });

  // Get stats
  const totalMonitors = monitors.length;
  const totalDependencies = dependencies.length;
  const requiredDependencies = dependencies.filter((d) => d.required).length;
  const monitorsWithDependencies = new Set(dependencies.map((d) => d.monitorId)).size;

  // Find monitors with most dependencies
  const dependencyCount = new Map<string, number>();
  dependencies.forEach((dep) => {
    dependencyCount.set(dep.monitorId, (dependencyCount.get(dep.monitorId) || 0) + 1);
  });

  const statusIcon = {
    OK: <CheckCircle2 className="h-4 w-4 text-green-600" />,
    LATE: <Clock className="h-4 w-4 text-yellow-600" />,
    MISSED: <AlertCircle className="h-4 w-4 text-orange-600" />,
    FAILING: <XCircle className="h-4 w-4 text-red-600" />,
    DISABLED: <AlertCircle className="h-4 w-4 text-gray-400" />,
    DEGRADED: <Clock className="h-4 w-4 text-yellow-600" />,
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GitBranch className="h-8 w-8" />
          Monitor Dependencies
        </h1>
        <p className="text-gray-600 mt-1">
          Visualize and manage monitor dependencies to prevent cascade alerts
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Monitors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMonitors}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalDependencies}</p>
            <p className="text-sm text-gray-500 mt-1">{requiredDependencies} required</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Monitors with Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{monitorsWithDependencies}</p>
            <p className="text-sm text-gray-500 mt-1">
              {totalMonitors > 0 ? ((monitorsWithDependencies / totalMonitors) * 100).toFixed(0) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Cascade Protection</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">Active</p>
            <p className="text-sm text-gray-500 mt-1">Auto-suppression enabled</p>
          </CardContent>
        </Card>
      </div>

      {/* Dependency Graph Visualization */}
      <div className="mb-6">
        <DependencyGraph
          monitors={monitors.map((m) => ({
            id: m.id,
            name: m.name,
            status: m.status,
          }))}
          dependencies={dependencies.map((d) => ({
            id: d.id,
            monitorId: d.monitorId,
            dependsOnId: d.dependsOnId,
            required: d.required,
          }))}
        />
      </div>

      {/* Dependencies Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Dependencies</CardTitle>
          <CardDescription>Detailed list of all monitor dependencies</CardDescription>
        </CardHeader>
        <CardContent>
          {dependencies.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No dependencies configured</p>
              <p className="text-sm mt-2">
                Add dependencies to monitors to enable cascade suppression and composite alerts
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dependent Monitor</TableHead>
                  <TableHead>Depends On</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dependencies.map((dep) => (
                  <TableRow key={dep.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {statusIcon[dep.monitor.status as keyof typeof statusIcon]}
                        <Link href={`/app/monitors/${dep.monitor.id}`} className="hover:underline">
                          {dep.monitor.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {statusIcon[dep.dependsOn.status as keyof typeof statusIcon]}
                        <Link href={`/app/monitors/${dep.dependsOn.id}`} className="hover:underline">
                          {dep.dependsOn.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={dep.required ? 'default' : 'secondary'}>
                        {dep.required ? 'Required' : 'Optional'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            dep.monitor.status === 'OK' ? 'default' :
                            dep.monitor.status === 'LATE' || dep.monitor.status === 'DEGRADED' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {dep.monitor.status}
                        </Badge>
                        <span className="text-gray-400">→</span>
                        <Badge
                          variant={
                            dep.dependsOn.status === 'OK' ? 'default' :
                            dep.dependsOn.status === 'LATE' || dep.dependsOn.status === 'DEGRADED' ? 'secondary' :
                            'destructive'
                          }
                        >
                          {dep.dependsOn.status}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Key Benefits */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Cascade Suppression Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Reduced Alert Fatigue
              </h3>
              <p className="text-sm text-gray-600">
                When an upstream monitor fails, downstream dependent monitors are automatically suppressed,
                preventing redundant alerts.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Root Cause Identification
              </h3>
              <p className="text-sm text-gray-600">
                Composite alerts highlight the root cause monitor and all affected downstream monitors,
                helping you prioritize remediation.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-purple-500" />
                Dependency Visualization
              </h3>
              <p className="text-sm text-gray-600">
                Interactive graph shows the full dependency chain, making it easy to understand
                monitor relationships at a glance.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

