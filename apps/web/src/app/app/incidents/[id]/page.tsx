import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import Link from 'next/link';
import { 
  SaturnCard, 
  SaturnCardHeader, 
  SaturnCardTitle, 
  SaturnCardDescription,
  SaturnCardContent,
  SaturnBadge,
  SaturnButton
} from '@/components/saturn';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { format } from 'date-fns';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Activity,
  ArrowLeft,
  User,
  Bell,
  XCircle,
  Play,
  Pause
} from 'lucide-react';
import { AcknowledgeButton } from '@/components/acknowledge-button';
import { ResolveButton } from '@/components/resolve-button';

export default async function IncidentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const { id } = await params;
  
  const incident = await prisma.incident.findUnique({
    where: { id },
    include: {
      Monitor: {
        include: {
          Org: true,
        },
      },
      IncidentEvent: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!incident) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold mb-4 text-[#37322F] font-serif">Incident Not Found</h1>
        <Link href="/app/incidents">
          <SaturnButton>Back to Incidents</SaturnButton>
        </Link>
      </div>
    );
  }

  // Check access
  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: {
        userId: session.user.id,
        orgId: incident.Monitor.orgId,
      },
    },
  });

  if (!membership) {
    redirect('/app');
  }

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
  };

  const eventIcon: Record<string, React.ReactNode> = {
    'incident.opened': <Play className="w-4 h-4 text-red-600" />,
    'incident.acknowledged': <Pause className="w-4 h-4 text-yellow-600" />,
    'incident.resolved': <CheckCircle2 className="w-4 h-4 text-green-600" />,
    'alert.sent': <Bell className="w-4 h-4 text-blue-600" />,
    'alert.failed': <XCircle className="w-4 h-4 text-red-600" />,
    'monitor.recovered': <CheckCircle2 className="w-4 h-4 text-green-600" />,
  };

  const duration = incident.resolvedAt
    ? Math.round((new Date(incident.resolvedAt).getTime() - new Date(incident.openedAt).getTime()) / 1000 / 60)
    : Math.round((new Date().getTime() - new Date(incident.openedAt).getTime()) / 1000 / 60);

  return (
    <div className="space-y-6">
      <PageHeaderWithBreadcrumbs
        title="Incident Details"
        description={`${kindEmoji[incident.kind]} ${incident.summary}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Incidents', href: '/app/incidents' },
          { label: `${incident.kind}` },
        ]}
        action={
          <Link href="/app/incidents">
            <SaturnButton variant="secondary">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to List
            </SaturnButton>
          </Link>
        }
      />

      {/* Incident Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#37322F] rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">Status</div>
                <SaturnBadge variant={statusVariant(incident.status)} className="mt-1">
                  {incident.status}
                </SaturnBadge>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">Type</div>
                <div className="text-lg font-semibold text-[#37322F] font-sans mt-1">
                  {kindEmoji[incident.kind]} {incident.kind}
                </div>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">Duration</div>
                <div className="text-lg font-semibold text-[#37322F] font-sans mt-1">
                  {duration < 60 ? `${duration}m` : `${Math.floor(duration / 60)}h ${duration % 60}m`}
                </div>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">Events</div>
                <div className="text-lg font-semibold text-[#37322F] font-sans mt-1">
                  {incident.IncidentEvent.length}
                </div>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </div>

      {/* Incident Details */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle>Incident Information</SaturnCardTitle>
          <SaturnCardDescription>Complete details about this incident</SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium text-[rgba(55,50,47,0.70)] font-sans mb-1">Monitor</div>
              <Link href={`/app/monitors/${incident.Monitor.id}`}>
                <div className="text-base font-semibold text-blue-600 hover:underline font-sans">
                  {incident.Monitor.name}
                </div>
              </Link>
            </div>

            <div>
              <div className="text-sm font-medium text-[rgba(55,50,47,0.70)] font-sans mb-1">Opened At</div>
              <div className="text-base text-[#37322F] font-sans">
                {format(new Date(incident.openedAt), 'PPpp')}
              </div>
            </div>

            {incident.acknowledgedAt && (
              <div>
                <div className="text-sm font-medium text-[rgba(55,50,47,0.70)] font-sans mb-1">Acknowledged At</div>
                <div className="text-base text-[#37322F] font-sans">
                  {format(new Date(incident.acknowledgedAt), 'PPpp')}
                </div>
              </div>
            )}

            {incident.resolvedAt && (
              <div>
                <div className="text-sm font-medium text-[rgba(55,50,47,0.70)] font-sans mb-1">Resolved At</div>
                <div className="text-base text-[#37322F] font-sans">
                  {format(new Date(incident.resolvedAt), 'PPpp')}
                </div>
              </div>
            )}

            {incident.lastAlertedAt && (
              <div>
                <div className="text-sm font-medium text-[rgba(55,50,47,0.70)] font-sans mb-1">Last Alert Sent</div>
                <div className="text-base text-[#37322F] font-sans">
                  {format(new Date(incident.lastAlertedAt), 'PPpp')}
                </div>
              </div>
            )}

            {incident.details && (
              <div className="md:col-span-2">
                <div className="text-sm font-medium text-[rgba(55,50,47,0.70)] font-sans mb-1">Details</div>
                <div className="text-base text-[#37322F] font-sans bg-[rgba(55,50,47,0.03)] p-3 rounded">
                  {incident.details}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          {incident.status !== 'RESOLVED' && (
            <div className="flex gap-3 mt-6 pt-6 border-t border-[rgba(55,50,47,0.12)]">
              {incident.status === 'OPEN' && (
                <AcknowledgeButton incidentId={incident.id} />
              )}
              <ResolveButton incidentId={incident.id} />
            </div>
          )}
        </SaturnCardContent>
      </SaturnCard>

      {/* Timeline */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle>Event Timeline</SaturnCardTitle>
          <SaturnCardDescription>
            Chronological history of all events for this incident
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          {incident.IncidentEvent.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-[rgba(55,50,47,0.20)] mx-auto mb-4" />
              <p className="text-[rgba(55,50,47,0.60)] font-sans">No events recorded yet</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-[rgba(55,50,47,0.12)]" />

              {/* Events */}
              <div className="space-y-4">
                {incident.IncidentEvent.map((event, index) => (
                  <div key={event.id} className="relative flex gap-4 pb-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-10 h-10 bg-white rounded-full border-2 border-[rgba(55,50,47,0.12)] flex items-center justify-center">
                        {eventIcon[event.eventType] || <Activity className="w-4 h-4 text-[rgba(55,50,47,0.60)]" />}
                      </div>
                    </div>

                    {/* Event content */}
                    <div className="flex-1 pt-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="font-medium text-[#37322F] font-sans">
                            {event.eventType.split('.').map(word => 
                              word.charAt(0).toUpperCase() + word.slice(1)
                            ).join(' ')}
                          </div>
                          {event.message && (
                            <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans mt-1">
                              {event.message}
                            </div>
                          )}
                          {event.metadata && typeof event.metadata === 'object' && Object.keys(event.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="text-xs text-[rgba(55,50,47,0.50)] font-sans cursor-pointer hover:text-[#37322F]">
                                View metadata
                              </summary>
                              <pre className="mt-2 p-3 bg-[rgba(55,50,47,0.05)] rounded text-xs font-mono overflow-x-auto">
                                {JSON.stringify(event.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        <div className="text-xs text-[rgba(55,50,47,0.50)] font-sans whitespace-nowrap">
                          {format(new Date(event.createdAt), 'MMM d, HH:mm:ss')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

