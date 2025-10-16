import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { OutputViewer } from '@/components/output-viewer';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardContent,
  SaturnBadge,
} from '@/components/saturn';
import { ArrowLeft, Clock, Activity, Terminal } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

type RunOutcome = 'SUCCESS' | 'FAIL' | 'STARTED' | 'LATE' | 'MISSED' | 'TIMEOUT';

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

  const getOutcomeVariant = (outcome: RunOutcome): 'success' | 'warning' | 'error' | 'default' => {
    if (outcome === 'SUCCESS') return 'success';
    if (outcome === 'LATE' || outcome === 'MISSED' || outcome === 'TIMEOUT') return 'warning';
    if (outcome === 'FAIL') return 'error';
    return 'default';
  };

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <PageHeaderWithBreadcrumbs
        title={
          <div className="flex items-center gap-3 flex-wrap">
            <span>Run Details</span>
            <SaturnBadge variant={getOutcomeVariant(run.outcome as RunOutcome)}>
              {run.outcome}
            </SaturnBadge>
          </div>
        }
        description={`${run.monitor.name} • ${format(run.startedAt, 'MMM d, yyyy HH:mm:ss')}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Monitors', href: '/app/monitors' },
          { label: run.monitor.name, href: `/app/monitors/${id}` },
          { label: 'Run' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h3" className="flex items-center gap-2 text-[rgba(55,50,47,0.80)]">
              <Clock className="h-4 w-4" />
              Started At
            </SaturnCardTitle>
          </SaturnCardHeader>
          <SaturnCardContent>
            <p className="text-2xl font-bold text-[#37322F] font-sans">
              {format(run.startedAt, 'MMM d, yyyy')}
            </p>
            <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans mt-1">
              {format(run.startedAt, 'HH:mm:ss')}
            </p>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h3" className="flex items-center gap-2 text-[rgba(55,50,47,0.80)]">
              <Activity className="h-4 w-4" />
              Duration
            </SaturnCardTitle>
          </SaturnCardHeader>
          <SaturnCardContent>
            <p className="text-2xl font-bold text-[#37322F] font-sans">
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
              <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans mt-1">
                Finished at {format(run.finishedAt, 'HH:mm:ss')}
              </p>
            )}
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h3" className="flex items-center gap-2 text-[rgba(55,50,47,0.80)]">
              <Terminal className="h-4 w-4" />
              Exit Code
            </SaturnCardTitle>
          </SaturnCardHeader>
          <SaturnCardContent>
            <p className="text-2xl font-bold text-[#37322F] font-sans">
              {run.exitCode !== null ? run.exitCode : '—'}
            </p>
            <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans mt-1">
              {run.exitCode === 0 ? 'Success' : run.exitCode !== null ? 'Error' : 'Not available'}
            </p>
          </SaturnCardContent>
        </SaturnCard>
      </div>

      {run.outputKey ? (
        <OutputViewer
          outputKey={run.outputKey}
          sizeBytes={run.sizeBytes}
          exitCode={run.exitCode}
          timestamp={run.startedAt}
        />
      ) : (
        <SaturnCard>
          <SaturnCardContent className="py-12">
            <div className="text-center text-[rgba(55,50,47,0.80)]">
              <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium font-sans">No output captured</p>
              <p className="text-sm mt-2 font-sans">
                Enable output capture in monitor settings to capture job output
              </p>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      )}
    </div>
  );
}
