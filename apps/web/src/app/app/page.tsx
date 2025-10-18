import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import Link from 'next/link';
import { Activity, AlertCircle, CheckCircle2, Clock, Plus, BarChart3, Bell, Plug, BookOpen } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { SaturnCard, SaturnButton } from '@/components/saturn';
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata({
  title: "Dashboard",
  description: "Monitor your cron jobs and scheduled tasks with Saturn.",
  path: '/app',
keywords: ['dashboard', 'monitoring dashboard', 'cron jobs', 'status overview'],
  noIndex: true,
})

export default async function DashboardPage() {
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

  // Get monitor counts by status
  const monitors = await prisma.monitor.findMany({
    where: { orgId: org.id },
    include: {
      _count: {
        select: {
          Incident: {
            where: {
              status: { in: ['OPEN', 'ACKED'] },
            },
          },
        },
      },
    },
    take: 10,
    orderBy: {
      updatedAt: 'desc',
    },
  });

  const statusCounts = {
    ok: monitors.filter(m => m.status === 'OK').length,
    late: monitors.filter(m => m.status === 'LATE').length,
    missed: monitors.filter(m => m.status === 'MISSED').length,
    failing: monitors.filter(m => m.status === 'FAILING').length,
  };

  // Get recent incidents
  const incidents = await prisma.incident.findMany({
    where: {
      Monitor: {
        orgId: org.id,
      },
      status: { in: ['OPEN', 'ACKED'] },
    },
    include: {
      Monitor: true,
    },
    take: 10,
    orderBy: {
      openedAt: 'desc',
    },
  });

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <Breadcrumbs items={[{ label: 'Dashboard' }]} />
      
      <PageHeader
        title={org.name}
        description="Monitor your jobs and get instant alerts"
        action={
          <Link href="/app/monitors/new" className="w-full sm:w-auto">
            <SaturnButton className="w-full sm:w-auto sm:min-w-[160px] whitespace-nowrap" icon={<Plus className="w-4 h-4" />}>
              Create Monitor
            </SaturnButton>
          </Link>
        }
      />

      {/* Status Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Healthy Card */}
        <SaturnCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans">Healthy</div>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-[#37322F] font-sans">{statusCounts.ok}</div>
            <div className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-2">monitors running smoothly</div>
          </div>
        </SaturnCard>

        {/* Late Card */}
        <SaturnCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans">Late</div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="text-3xl font-bold text-[#37322F] font-sans">{statusCounts.late}</div>
            <div className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-2">jobs completed late</div>
          </div>
        </SaturnCard>

        {/* Missed Card */}
        <SaturnCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans">Missed</div>
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-3xl font-bold text-[#37322F] font-sans">{statusCounts.missed}</div>
            <div className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-2">jobs didn&apos;t run</div>
          </div>
        </SaturnCard>

        {/* Failing Card */}
        <SaturnCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[rgba(55,50,47,0.80)] text-sm font-medium font-sans">Failing</div>
              <AlertCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-3xl font-bold text-[#37322F] font-sans">{statusCounts.failing}</div>
            <div className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-2">monitors with errors</div>
          </div>
        </SaturnCard>
      </div>

      {/* Recent Monitors */}
      <SaturnCard>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#37322F] font-serif">Recent Monitors</h2>
            <Link href="/app/monitors">
              <SaturnButton variant="ghost" size="sm">View All</SaturnButton>
            </Link>
          </div>
          
          {monitors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[rgba(55,50,47,0.60)] font-sans mb-4">No monitors yet</p>
              <Link href="/app/monitors/new">
                <SaturnButton>Create Your First Monitor</SaturnButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {monitors.map((monitor) => (
                <Link key={monitor.id} href={`/app/monitors/${monitor.id}`}>
                  <div className="flex items-center justify-between p-4 border border-[rgba(55,50,47,0.08)] rounded-lg hover:bg-[#F7F5F3] transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-[#37322F] font-sans">{monitor.name}</div>
                      <div className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                        {monitor.scheduleType === 'CRON' ? monitor.cronExpr : `Every ${monitor.intervalSec}s`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {monitor._count.Incident > 0 && (
                        <span className="text-xs text-red-600 font-medium font-sans">
                          {monitor._count.Incident} incident{monitor._count.Incident !== 1 ? 's' : ''}
                        </span>
                      )}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium font-sans ${
                        monitor.status === 'OK' ? 'bg-green-100 text-green-800' :
                        monitor.status === 'LATE' ? 'bg-yellow-100 text-yellow-800' :
                        monitor.status === 'MISSED' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {monitor.status}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </SaturnCard>

      {/* Recent Incidents */}
      {incidents.length > 0 && (
        <SaturnCard>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#37322F] font-serif">Active Incidents</h2>
              <Link href="/app/incidents">
                <SaturnButton variant="ghost" size="sm">View All</SaturnButton>
              </Link>
            </div>
            
            <div className="space-y-4">
              {incidents.map((incident) => (
                <Link key={incident.id} href={`/app/incidents/${incident.id}`}>
                  <div className="flex items-center justify-between p-4 border border-[rgba(55,50,47,0.08)] rounded-lg hover:bg-[#F7F5F3] transition-colors">
                    <div className="flex-1">
                      <div className="font-medium text-[#37322F] font-sans">{incident.Monitor.name}</div>
                      <div className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                        {incident.kind} • Opened {new Date(incident.openedAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium font-sans ${
                      incident.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                      incident.status === 'ACKED' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {incident.status}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </SaturnCard>
      )}
    </div>
  );
}
