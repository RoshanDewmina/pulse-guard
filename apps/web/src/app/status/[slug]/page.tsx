import { prisma } from '@tokiflow/db';
import { notFound } from 'next/navigation';
import { format, subDays } from 'date-fns';
import { CheckCircle2, XCircle, AlertCircle, Clock } from 'lucide-react';

interface StatusPageProps {
  params: Promise<{
    slug: string;
  }>;
}

// Enable ISR with revalidation every 60 seconds
export const revalidate = 60;

export async function generateStaticParams() {
  const statusPages = await prisma.statusPage.findMany({
    where: { isPublic: true },
    select: { slug: true },
  });

  return statusPages.map((page: any) => ({
    slug: page.slug,
  }));
}

async function getStatusPageData(slug: string) {
  const statusPage = await prisma.statusPage.findUnique({
    where: { slug },
    include: {
      org: {
        include: {
          monitors: {
            where: {
              status: { not: 'DISABLED' },
            },
            include: {
              runs: {
                where: {
                  startedAt: { gte: subDays(new Date(), 90) },
                },
                orderBy: { startedAt: 'desc' },
                take: 90,
              },
              incidents: {
                where: {
                  openedAt: { gte: subDays(new Date(), 30) },
                },
                orderBy: { openedAt: 'desc' },
              },
            },
          },
        },
      },
    },
  });

  if (!statusPage) {
    return null;
  }

  // Calculate uptime for each component
  const components = (statusPage.components as any[]) || [];
  const componentsWithData = components.map((component: any) => {
    // Find monitors associated with this component
    const componentMonitors = statusPage.org.monitors.filter((m: any) =>
      component.monitorIds?.includes(m.id)
    );

    // Calculate overall component status
    const hasFailure = componentMonitors.some((m: any) => m.status === 'FAILING' || m.status === 'MISSED');
    const hasDegraded = componentMonitors.some((m: any) => m.status === 'LATE' || m.status === 'DEGRADED');
    
    let status: 'operational' | 'degraded' | 'outage' | 'maintenance' = 'operational';
    if (hasFailure) status = 'outage';
    else if (hasDegraded) status = 'degraded';

    // Calculate 90-day uptime
    let totalRuns = 0;
    let successfulRuns = 0;
    
    componentMonitors.forEach((monitor: any) => {
      totalRuns += monitor.runs.length;
      successfulRuns += monitor.runs.filter((r: any) => r.outcome === 'SUCCESS').length;
    });

    const uptime = totalRuns > 0 ? ((successfulRuns / totalRuns) * 100).toFixed(2) : '100.00';

    return {
      ...component,
      status,
      uptime,
      monitors: componentMonitors,
    };
  });

  // Get recent incidents across all monitors
  const recentIncidents = statusPage.org.monitors
    .flatMap((m: any) => m.incidents.map((inc: any) => ({ ...inc, monitorName: m.name })))
    .sort((a: any, b: any) => b.openedAt.getTime() - a.openedAt.getTime())
    .slice(0, 10);

  return {
    statusPage,
    components: componentsWithData,
    incidents: recentIncidents,
  };
}

export default async function PublicStatusPage({ params }: StatusPageProps) {
  const { slug } = await params;
  const data = await getStatusPageData(slug);

  if (!data) {
    notFound();
  }

  const { statusPage, components, incidents } = data;
  const theme = (statusPage.theme as any) || {};

  // Determine overall status
  const hasOutage = components.some((c) => c.status === 'outage');
  const hasDegraded = components.some((c) => c.status === 'degraded');
  let overallStatus = 'All Systems Operational';
  let overallStatusColor = 'text-green-600';
  
  if (hasOutage) {
    overallStatus = 'System Outage';
    overallStatusColor = 'text-red-600';
  } else if (hasDegraded) {
    overallStatus = 'Degraded Performance';
    overallStatusColor = 'text-yellow-600';
  }

  const statusIcons: Record<string, React.ReactElement> = {
    operational: <CheckCircle2 className="w-5 h-5 text-green-600" />,
    degraded: <AlertCircle className="w-5 h-5 text-yellow-600" />,
    outage: <XCircle className="w-5 h-5 text-red-600" />,
    maintenance: <Clock className="w-5 h-5 text-blue-600" />,
  };

  const primaryColor = theme.primaryColor || '#10B981';
  const backgroundColor = theme.backgroundColor || '#FFFFFF';
  const textColor = theme.textColor || '#1F2937';

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor,
        color: textColor,
      }}
    >
      {/* Header */}
      <header className="border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {theme.logoUrl && (
            <img
              src={theme.logoUrl}
              alt={statusPage.title}
              className="h-12 mb-4"
            />
          )}
          <h1 className="text-4xl font-bold mb-2" style={{ color: primaryColor }}>
            {statusPage.title}
          </h1>
          <p className="text-lg text-gray-600">Real-time status and uptime monitoring</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Overall Status Banner */}
        <div className="mb-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            {hasOutage ? statusIcons.outage : hasDegraded ? statusIcons.degraded : statusIcons.operational}
            <div>
              <h2 className={`text-2xl font-bold ${overallStatusColor}`}>
                {overallStatus}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Last updated: {format(new Date(), 'MMM d, yyyy HH:mm:ss')} UTC
              </p>
            </div>
          </div>
        </div>

        {/* Components Status */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">Services</h3>
          <div className="space-y-3">
            {components.map((component) => (
              <div
                key={component.id}
                className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {statusIcons[component.status]}
                    <div>
                      <h4 className="font-semibold text-lg">{component.name}</h4>
                      {component.description && (
                        <p className="text-sm text-gray-600">{component.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color: primaryColor }}>
                      {component.uptime}%
                    </div>
                    <div className="text-xs text-gray-500">90-day uptime</div>
                  </div>
                </div>

                {/* Uptime bars for last 90 days */}
                <div className="mt-4 flex gap-1">
                  {Array.from({ length: 90 }).map((_, i) => {
                    const date = subDays(new Date(), 89 - i);
                    const dayRuns = component.monitors.flatMap((m: any) =>
                      m.runs.filter((r: any) => {
                        const runDate = new Date(r.startedAt);
                        return (
                          runDate.getDate() === date.getDate() &&
                          runDate.getMonth() === date.getMonth() &&
                          runDate.getFullYear() === date.getFullYear()
                        );
                      })
                    );

                    const successRate =
                      dayRuns.length > 0
                        ? (dayRuns.filter((r: any) => r.outcome === 'SUCCESS').length / dayRuns.length) * 100
                        : 100;

                    let barColor = '#10B981'; // green
                    if (successRate < 50) barColor = '#EF4444'; // red
                    else if (successRate < 99) barColor = '#F59E0B'; // yellow

                    return (
                      <div
                        key={i}
                        className="flex-1 h-8 rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ backgroundColor: barColor }}
                        title={`${format(date, 'MMM d')}: ${successRate.toFixed(1)}% uptime`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>90 days ago</span>
                  <span>Today</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        {incidents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Recent Incidents</h3>
            <div className="space-y-4">
              {incidents.map((incident: any) => (
                <div
                  key={incident.id}
                  className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            incident.status === 'RESOLVED'
                              ? 'bg-green-100 text-green-800'
                              : incident.status === 'ACKED'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {incident.status}
                        </span>
                        <span className="text-sm text-gray-600">{incident.monitorName}</span>
                      </div>
                      <h4 className="font-semibold mb-1">{incident.summary}</h4>
                      {incident.details && (
                        <p className="text-sm text-gray-600 mb-2">{incident.details}</p>
                      )}
                      <div className="text-xs text-gray-500">
                        Opened: {format(new Date(incident.openedAt), 'MMM d, yyyy HH:mm')}
                        {incident.resolvedAt && (
                          <> • Resolved: {format(new Date(incident.resolvedAt), 'MMM d, yyyy HH:mm')}</>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 mt-12 pb-8">
          <p>
            Powered by{' '}
            <a
              href="https://saturn.co"
              className="font-medium hover:underline"
              style={{ color: primaryColor }}
            >
              Saturn
            </a>
          </p>
          {statusPage.customDomain && (
            <p className="mt-2">
              Custom domain: <span className="font-mono">{statusPage.customDomain}</span>
            </p>
          )}
        </div>
      </main>
    </div>
  );
}

