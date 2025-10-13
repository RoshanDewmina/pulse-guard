import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { OutputViewer } from '@/components/output-viewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, Activity, Terminal } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const { id, runId } = await params;
  // Fetch run with monitor details
  const run = await prisma.run.findFirst({
    where: {
      id: runId,
      monitorId: id,
      monitor: {
        org: {
          memberships: {
            some: {
              user: {
                email: session.user.email,
              },
            },
          },
        },
      },
    },
    include: {
      monitor: {
        select: {
          id: true,
          name: true,
          token: true,
        },
      },
    },
  });

  if (!run) {
    redirect(`/app/monitors/${id}`);
  }

  const outcomeColors: Record<string, string> = {
    SUCCESS: 'bg-green-100 text-green-800 border-green-300',
    FAIL: 'bg-red-100 text-red-800 border-red-300',
    STARTED: 'bg-blue-100 text-blue-800 border-blue-300',
    LATE: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    MISSED: 'bg-orange-100 text-orange-800 border-orange-300',
    TIMEOUT: 'bg-purple-100 text-purple-800 border-purple-300',
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Link
          href={`/app/monitors/${id}`}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Monitor
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{run.monitor.name}</h1>
            <p className="text-gray-600 mt-1">Run Details</p>
          </div>
          <Badge className={outcomeColors[run.outcome]}>
            {run.outcome}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Started At
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {format(run.startedAt, 'MMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {format(run.startedAt, 'HH:mm:ss')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Duration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {run.durationMs !== null ? (
                <>
                  {run.durationMs < 1000
                    ? `${run.durationMs}ms`
                    : `${(run.durationMs / 1000).toFixed(2)}s`}
                </>
              ) : (
                '—'
              )}
            </p>
            {run.finishedAt && (
              <p className="text-sm text-gray-600 mt-1">
                Finished at {format(run.finishedAt, 'HH:mm:ss')}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              Exit Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {run.exitCode !== null ? run.exitCode : '—'}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {run.exitCode === 0 ? 'Success' : run.exitCode !== null ? 'Error' : 'Not available'}
            </p>
          </CardContent>
        </Card>
      </div>

      {run.outputKey ? (
        <OutputViewer
          outputKey={run.outputKey}
          sizeBytes={run.sizeBytes}
          exitCode={run.exitCode}
          timestamp={run.startedAt}
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12 text-gray-500">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No output captured</p>
              <p className="text-sm mt-2">
                Enable output capture in monitor settings to capture job output
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}




