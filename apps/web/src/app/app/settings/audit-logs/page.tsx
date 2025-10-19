import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@tokiflow/db';
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata({
  title: "Settings - Audit Logs",
  description: "View audit logs and activity history.",
  path: '/app/settings/audit-logs',
keywords: ['audit logs', 'activity logs', 'security logs', 'user activity'],
  noIndex: true,
})
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { AuditLogsClient } from '@/components/audit-logs/audit-logs-client';



export default async function AuditLogsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect('/auth/signin');
  }

  const org = await getUserPrimaryOrg(session.user.id);
  
  if (!org) {
    redirect('/onboarding');
  }

  // Check if user is owner or admin
  const membership = await prisma.membership.findUnique({
    where: {
      userId_orgId: {
        userId: session.user.id,
        orgId: org.id,
      },
    },
  });

  if (!membership || membership.role === 'MEMBER') {
    redirect('/app');
  }

  // Fetch initial audit logs
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: {
        orgId: org.id,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    }),
    prisma.auditLog.count({
      where: {
        orgId: org.id,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeaderWithBreadcrumbs
        title="Audit Logs"
        description="View and track all activities in your organization"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Settings', href: '/app/settings' },
          { label: 'Audit Logs' },
        ]}
      />

      <AuditLogsClient 
        initialLogs={logs}
        orgId={org.id}
        total={total}
      />
    </div>
  );
}


