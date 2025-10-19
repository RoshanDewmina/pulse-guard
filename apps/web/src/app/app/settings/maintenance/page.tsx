import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { generatePageMetadata } from '@/lib/seo/metadata';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnBadge,
  SaturnButton,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
} from '@/components/saturn';
import { Calendar, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { getActiveWindows } from '@/lib/maintenance/scheduler';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { MaintenanceWindowList } from '@/components/maintenance/maintenance-window-list';

export const metadata = generatePageMetadata({
  title: "Settings - Maintenance",
  description: "Manage maintenance windows and scheduled maintenance.",
  path: '/app/settings/maintenance',
  keywords: ['maintenance', 'scheduled maintenance', 'downtime', 'maintenance windows'],
  noIndex: true,
});

export default async function MaintenancePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect('/auth/signin');
  }

  const membership = await prisma.membership.findFirst({
    where: {
      User: {
        email: session.user.email,
      },
    },
    include: {
      Org: {
        include: {
          Monitor: {
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

      <MaintenanceWindowList 
        windows={windows} 
        orgId={membership.orgId}
      />

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
