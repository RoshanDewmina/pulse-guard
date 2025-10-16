import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
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
  PageHeader,
  StatusIcon,
} from '@/components/saturn';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { formatSchedule } from '@/lib/schedule';
import { format } from 'date-fns';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

type MonitorStatus = 'OK' | 'LATE' | 'MISSED' | 'FAILING' | 'DISABLED';

export default async function MonitorsPage() {
  const session = await getServerSession(authOptions);
  const org = await getUserPrimaryOrg(session!.user.id);

  if (!org) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4 text-[#37322F] font-serif">No Organization Found</h1>
        <p className="text-[rgba(55,50,47,0.80)] font-sans">Please contact support.</p>
      </div>
    );
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

  const getStatusVariant = (status: MonitorStatus): 'success' | 'warning' | 'error' | 'default' => {
    if (status === 'OK') return 'success';
    if (status === 'LATE' || status === 'MISSED') return 'warning';
    if (status === 'FAILING') return 'error';
    if (status === 'DISABLED') return 'default';
    return 'default';
  };

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <PageHeaderWithBreadcrumbs
        title="Monitors"
        description="Manage your cron job monitors"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Monitors' },
        ]}
        action={
          <Link href="/app/monitors/new">
            <SaturnButton icon={<Plus className="w-4 h-4" />}>
              Create Monitor
            </SaturnButton>
          </Link>
        }
      />

      {monitors.length === 0 ? (
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h3">No Monitors Yet</SaturnCardTitle>
            <SaturnCardDescription>Get started by creating your first monitor</SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="text-center py-8">
              <p className="text-[rgba(55,50,47,0.80)] font-sans mb-6">
                Monitors help you track your cron jobs and scheduled tasks.
              </p>
              <Link href="/app/monitors/new">
                <SaturnButton icon={<Plus className="w-4 h-4" />}>
                  Create Your First Monitor
                </SaturnButton>
              </Link>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      ) : (
        <SaturnCard padding="none">
          <SaturnCardHeader>
            <SaturnCardTitle as="h2">Your Monitors ({monitors.length})</SaturnCardTitle>
            <SaturnCardDescription>
              {org.subscriptionPlan
                ? `Using ${monitors.length} of ${org.subscriptionPlan.monitorLimit} monitors`
                : 'Manage your monitors'}
            </SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Name</SaturnTableHead>
                  <SaturnTableHead>Status</SaturnTableHead>
                  <SaturnTableHead>Schedule</SaturnTableHead>
                  <SaturnTableHead>Last Run</SaturnTableHead>
                  <SaturnTableHead>Next Due</SaturnTableHead>
                  <SaturnTableHead>Incidents</SaturnTableHead>
                  <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {monitors.map((monitor) => (
                  <SaturnTableRow key={monitor.id}>
                    <SaturnTableCell className="font-medium">
                      <Link
                        href={`/app/monitors/${monitor.id}`}
                        className="hover:underline text-[#37322F]"
                      >
                        {monitor.name}
                      </Link>
                    </SaturnTableCell>
                    <SaturnTableCell>
                      <div className="flex items-center gap-2">
                        <StatusIcon status={monitor.status as MonitorStatus} size="sm" />
                        <SaturnBadge variant={getStatusVariant(monitor.status as MonitorStatus)} size="sm">
                          {monitor.status}
                        </SaturnBadge>
                      </div>
                    </SaturnTableCell>
                    <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                      {formatSchedule(monitor.scheduleType, monitor.intervalSec, monitor.cronExpr)}
                    </SaturnTableCell>
                    <SaturnTableCell>
                      {monitor.lastRunAt ? (
                        <span className="text-[#37322F]">
                          {format(monitor.lastRunAt, 'MMM d, HH:mm')}
                          {monitor.lastDurationMs && (
                            <span className="text-[rgba(55,50,47,0.60)] ml-2">
                              ({monitor.lastDurationMs}ms)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[rgba(55,50,47,0.40)]">Never</span>
                      )}
                    </SaturnTableCell>
                    <SaturnTableCell>
                      {monitor.nextDueAt ? (
                        <span className="text-[#37322F]">{format(monitor.nextDueAt, 'MMM d, HH:mm')}</span>
                      ) : (
                        <span className="text-[rgba(55,50,47,0.40)]">N/A</span>
                      )}
                    </SaturnTableCell>
                    <SaturnTableCell>
                      {monitor._count.incidents > 0 ? (
                        <SaturnBadge variant="error" size="sm">
                          {monitor._count.incidents}
                        </SaturnBadge>
                      ) : (
                        <span className="text-[rgba(55,50,47,0.40)]">—</span>
                      )}
                    </SaturnTableCell>
                    <SaturnTableCell className="text-right">
                      <Link href={`/app/monitors/${monitor.id}`}>
                        <SaturnButton variant="ghost" size="sm">
                          View
                        </SaturnButton>
                      </Link>
                    </SaturnTableCell>
                  </SaturnTableRow>
                ))}
              </SaturnTableBody>
            </SaturnTable>
          </SaturnCardContent>
        </SaturnCard>
      )}
    </div>
  );
}
