import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnBadge,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
  PageHeader,
} from '@/components/saturn';
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata({
  title: "Incidents",
  description: "View and manage incidents for your monitors.",
  path: '/app/incidents',
keywords: ['incidents', 'alerts', 'failures', 'incident management'],
  noIndex: true,
})
import { format } from 'date-fns';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader as PageHeaderComponent } from '@/components/page-header';
import { AcknowledgeButton } from '@/components/acknowledge-button';
import { ResolveButton } from '@/components/resolve-button';

export default async function IncidentsPage() {
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

  const incidents = await prisma.incident.findMany({
    where: {
      Monitor: {
        orgId: org.id,
      },
    },
    include: {
      Monitor: true,
    },
    orderBy: {
      openedAt: 'desc',
    },
    take: 100,
  });

  const openIncidents = incidents.filter(i => i.status === 'OPEN');
  const ackedIncidents = incidents.filter(i => i.status === 'ACKED');
  const resolvedIncidents = incidents.filter(i => i.status === 'RESOLVED');

  const statusVariant = (status: string): 'error' | 'warning' | 'success' => {
    if (status === 'OPEN') return 'error';
    if (status === 'ACKED') return 'warning';
    return 'success';
  };

  const kindEmoji: Record<string, string> = {
    MISSED: '⏰',
    LATE: '🕐',
    FAIL: '❌',
    ANOMALY: '📊',
    DEGRADED: '⚠️',
  };

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/app' },
        { label: 'Incidents' },
      ]} />
      
      <PageHeaderComponent
        title="Incidents"
        description="Track and manage issues with your monitors"
      />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3">Open</div>
            <div className="text-3xl font-bold text-red-600 font-sans">{openIncidents.length}</div>
            <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-1">Requiring attention</p>
          </div>
        </SaturnCard>

        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3">Acknowledged</div>
            <div className="text-3xl font-bold text-yellow-600 font-sans">{ackedIncidents.length}</div>
            <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-1">Being worked on</p>
          </div>
        </SaturnCard>

        <SaturnCard>
          <div className="p-6">
            <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans mb-3">Resolved</div>
            <div className="text-3xl font-bold text-green-600 font-sans">{resolvedIncidents.length}</div>
            <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-1">Fixed and closed</p>
          </div>
        </SaturnCard>
      </div>

      {/* Incidents Table */}
      <SaturnCard padding="none">
        <SaturnCardHeader>
          <SaturnCardTitle as="h2">All Incidents ({incidents.length})</SaturnCardTitle>
          <SaturnCardDescription>Chronological list of all detected issues</SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          {incidents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎉</div>
              <h3 className="text-lg font-semibold mb-2 text-[#37322F] font-serif">No Incidents!</h3>
              <p className="text-[rgba(55,50,47,0.80)] font-sans">All your monitors are running smoothly.</p>
            </div>
          ) : (
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Kind</SaturnTableHead>
                  <SaturnTableHead>Monitor</SaturnTableHead>
                  <SaturnTableHead>Summary</SaturnTableHead>
                  <SaturnTableHead>Opened</SaturnTableHead>
                  <SaturnTableHead>Status</SaturnTableHead>
                  <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {incidents.map((incident) => (
                  <SaturnTableRow key={incident.id}>
                    <SaturnTableCell>
                      <div className="flex items-center gap-2">
                        <span>{kindEmoji[incident.kind]}</span>
                        <SaturnBadge variant="error" size="sm">{incident.kind}</SaturnBadge>
                      </div>
                    </SaturnTableCell>
                    <SaturnTableCell>
                      <Link
                        href={`/app/monitors/${incident.monitorId}`}
                        className="hover:underline font-medium text-[#37322F]"
                      >
                        {incident.Monitor.name}
                      </Link>
                    </SaturnTableCell>
                    <SaturnTableCell className="max-w-md truncate">
                      <Link
                        href={`/app/incidents/${incident.id}`}
                        className="hover:underline text-blue-600 font-medium"
                      >
                        {incident.summary}
                      </Link>
                    </SaturnTableCell>
                    <SaturnTableCell className="text-[#37322F]">
                      {format(incident.openedAt, 'MMM d, HH:mm')}
                    </SaturnTableCell>
                    <SaturnTableCell>
                      <SaturnBadge variant={statusVariant(incident.status)} size="sm">
                        {incident.status}
                      </SaturnBadge>
                    </SaturnTableCell>
                    <SaturnTableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {incident.status === 'OPEN' && (
                          <AcknowledgeButton incidentId={incident.id} />
                        )}
                        {(incident.status === 'OPEN' || incident.status === 'ACKED') && (
                          <ResolveButton incidentId={incident.id} />
                        )}
                      </div>
                    </SaturnTableCell>
                  </SaturnTableRow>
                ))}
              </SaturnTableBody>
            </SaturnTable>
          )}
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}
