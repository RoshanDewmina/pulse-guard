import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { generatePageMetadata } from '@/lib/seo/metadata';
import { StaffDashboard } from '@/components/staff/staff-dashboard';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader as PageHeaderComponent } from '@/components/page-header';
import { redirect } from 'next/navigation';

export const metadata = generatePageMetadata({
  title: "Staff Dashboard",
  description: "System health metrics and analytics for staff members.",
  path: '/app/staff',
  keywords: ['staff', 'dashboard', 'health metrics', 'analytics'],
  noIndex: true,
});

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  // Check if user is staff (you can implement your own staff check logic)
  const isStaff = session.user.email?.endsWith('@saturn.sh') || 
                  session.user.email === 'admin@saturn.sh';
  
  if (!isStaff) {
    redirect('/app');
  }

  // Get system health metrics
  const [
    totalMonitors,
    activeMonitors,
    totalIncidents,
    openIncidents,
    totalUsers,
    totalOrgs,
    recentIncidents,
    monitorStats,
    userStats,
  ] = await Promise.all([
    // Total monitors
    prisma.monitor.count(),
    
    // Active monitors (not disabled)
    prisma.monitor.count({
      where: { status: { not: 'DISABLED' } },
    }),
    
    // Total incidents
    prisma.incident.count(),
    
    // Open incidents
    prisma.incident.count({
      where: { status: { in: ['OPEN', 'ACKED'] } },
    }),
    
    // Total users
    prisma.user.count(),
    
    // Total organizations
    prisma.org.count(),
    
    // Recent incidents (last 24 hours)
    prisma.incident.findMany({
      where: {
        openedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      include: {
        Monitor: {
          include: {
            Org: true,
          },
        },
      },
      orderBy: { openedAt: 'desc' },
      take: 10,
    }),
    
    // Monitor status breakdown
    prisma.monitor.groupBy({
      by: ['status'],
      _count: { status: true },
    }),
    
    // User registration stats (last 30 days)
    prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  // Calculate uptime percentage
  const totalRuns = await prisma.run.count();
  const successfulRuns = await prisma.run.count({
    where: { outcome: 'SUCCESS' },
  });
  const uptimePercentage = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 100;

  // Transform recent incidents to match the expected interface
  const transformedRecentIncidents = recentIncidents.map(incident => ({
    id: incident.id,
    status: incident.status,
    kind: incident.kind,
    summary: incident.summary,
    openedAt: incident.openedAt,
    monitor: {
      id: incident.Monitor.id,
      name: incident.Monitor.name,
      org: {
        name: incident.Monitor.Org.name,
      },
    },
  }));

  // Get system load metrics
  const systemMetrics = {
    totalMonitors,
    activeMonitors,
    totalIncidents,
    openIncidents,
    totalUsers,
    totalOrgs,
    uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    recentUsers: userStats,
    monitorStatusBreakdown: monitorStats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>),
  };

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/app' },
        { label: 'Staff Dashboard' },
      ]} />
      
      <PageHeaderComponent
        title="Staff Dashboard"
        description="System health metrics and analytics"
      />

      <StaffDashboard
        systemMetrics={systemMetrics}
        recentIncidents={transformedRecentIncidents}
      />
    </div>
  );
}
