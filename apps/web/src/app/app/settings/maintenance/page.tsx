import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
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
} from '@/components/saturn';
import { Calendar, Clock, Trash2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { getActiveWindows } from '@/lib/maintenance/scheduler';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

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
    <div className="space-y-6">
      <PageHeaderWithBreadcrumbs
        title="Maintenance Windows"
        description="Schedule maintenance windows to suppress alerts"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Settings', href: '/app/settings' },
          { label: 'Maintenance' },
        ]}
      />
      
      {/* Active Windows */}
      {windows.some(w => w.isActive) && (
        <SaturnCard className="border-yellow-300 bg-yellow-50">
          <SaturnCardHeader>
            <SaturnCardTitle as="h2" className="text-yellow-800 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Active Maintenance Windows
            </SaturnCardTitle>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-2">
              {windows
                .filter(w => w.isActive)
                .map(window => (
                  <div key={window.id} className="flex items-center justify-between p-3 bg-white border border-yellow-200 rounded-lg">
                    <div>
                      <p className="font-medium text-[#37322F] font-sans">{window.name}</p>
                      <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                        {format(window.startTime, 'PPp')} - {format(window.endTime, 'p')}
                      </p>
                    </div>
                    <SaturnBadge variant="warning" size="sm">Active Now</SaturnBadge>
                  </div>
                ))}
            </div>
          </SaturnCardContent>
        </SaturnCard>
      )}

      {/* All Windows */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h2">All Maintenance Windows</SaturnCardTitle>
          <SaturnCardDescription>
            Schedule periods where alerts will be suppressed
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          {windows.length === 0 ? (
            <div className="text-center py-12 text-[rgba(55,50,47,0.80)]">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium font-sans">No maintenance windows</p>
              <p className="text-sm mt-2 font-sans">
                Create a maintenance window to suppress alerts during planned downtime
              </p>
              <SaturnButton className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Create Maintenance Window
              </SaturnButton>
            </div>
          ) : (
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Name</SaturnTableHead>
                  <SaturnTableHead>Scope</SaturnTableHead>
                  <SaturnTableHead>Start Time</SaturnTableHead>
                  <SaturnTableHead>End Time</SaturnTableHead>
                  <SaturnTableHead>Recurrence</SaturnTableHead>
                  <SaturnTableHead>Status</SaturnTableHead>
                  <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {windows.map(window => (
                  <SaturnTableRow key={window.id}>
                    <SaturnTableCell className="font-medium text-[#37322F]">{window.name}</SaturnTableCell>
                    <SaturnTableCell>
                      {window.monitorId ? (
                        <SaturnBadge variant="default" size="sm">Specific Monitor</SaturnBadge>
                      ) : (
                        <SaturnBadge variant="success" size="sm">All Monitors</SaturnBadge>
                      )}
                    </SaturnTableCell>
                    <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                      {format(window.startTime, 'PPp')}
                    </SaturnTableCell>
                    <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                      {format(window.endTime, 'PPp')}
                    </SaturnTableCell>
                    <SaturnTableCell>
                      {window.recurring ? (
                        <SaturnBadge variant="default" size="sm">
                          {window.rrule ? window.rrule.split(';')[0].replace('FREQ=', '') : 'Recurring'}
                        </SaturnBadge>
                      ) : (
                        <span className="text-[rgba(55,50,47,0.60)] font-sans">One-time</span>
                      )}
                    </SaturnTableCell>
                    <SaturnTableCell>
                      {window.isActive ? (
                        <SaturnBadge variant="warning" size="sm">Active</SaturnBadge>
                      ) : window.enabled ? (
                        <SaturnBadge variant="default" size="sm">Scheduled</SaturnBadge>
                      ) : (
                        <SaturnBadge variant="default" size="sm">Disabled</SaturnBadge>
                      )}
                    </SaturnTableCell>
                    <SaturnTableCell className="text-right">
                      <SaturnButton variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </SaturnButton>
                    </SaturnTableCell>
                  </SaturnTableRow>
                ))}
              </SaturnTableBody>
            </SaturnTable>
          )}
        </SaturnCardContent>
      </SaturnCard>

      {/* Help Card */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h3">About Maintenance Windows</SaturnCardTitle>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="space-y-3">
            <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
              Maintenance windows allow you to schedule periods where alerts will be suppressed. This is useful for:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-[rgba(55,50,47,0.80)] font-sans">
              <li>Planned maintenance or deployments</li>
              <li>Regular system updates (e.g., every Sunday night)</li>
              <li>Known downtime periods</li>
              <li>Testing or staging environment work</li>
            </ul>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
              <p className="text-sm text-blue-900 font-sans">
                <strong>Note:</strong> Jobs will still be monitored during maintenance windows, but no alerts will be sent. 
                Incidents will be created but marked as suppressed.
              </p>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}
