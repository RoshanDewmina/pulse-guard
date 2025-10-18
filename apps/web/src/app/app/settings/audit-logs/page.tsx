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
import { 
  SaturnCard, 
  SaturnCardHeader, 
  SaturnCardTitle, 
  SaturnCardDescription,
  SaturnCardContent,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
  SaturnBadge
} from '@/components/saturn';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { format } from 'date-fns';
import { 
  Shield, 
  User, 
  Settings, 
  Key, 
  UserPlus, 
  Trash2, 
  Edit,
  FileText,
  Activity,
  AlertCircle
} from 'lucide-react';


// Map action types to icons and descriptions
const actionConfig: Record<string, { icon: React.ReactNode; label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  'user.signin': { icon: <User className="w-4 h-4" />, label: 'Sign In', variant: 'success' },
  'user.signout': { icon: <User className="w-4 h-4" />, label: 'Sign Out', variant: 'default' },
  'monitor.create': { icon: <Activity className="w-4 h-4" />, label: 'Monitor Created', variant: 'success' },
  'monitor.update': { icon: <Edit className="w-4 h-4" />, label: 'Monitor Updated', variant: 'default' },
  'monitor.delete': { icon: <Trash2 className="w-4 h-4" />, label: 'Monitor Deleted', variant: 'error' },
  'incident.ack': { icon: <AlertCircle className="w-4 h-4" />, label: 'Incident Acknowledged', variant: 'warning' },
  'incident.resolve': { icon: <AlertCircle className="w-4 h-4" />, label: 'Incident Resolved', variant: 'success' },
  'apikey.create': { icon: <Key className="w-4 h-4" />, label: 'API Key Created', variant: 'success' },
  'apikey.revoke': { icon: <Key className="w-4 h-4" />, label: 'API Key Revoked', variant: 'error' },
  'team.invite': { icon: <UserPlus className="w-4 h-4" />, label: 'Team Member Invited', variant: 'success' },
  'team.remove': { icon: <Trash2 className="w-4 h-4" />, label: 'Team Member Removed', variant: 'error' },
  'settings.update': { icon: <Settings className="w-4 h-4" />, label: 'Settings Updated', variant: 'default' },
  'statuspage.create': { icon: <FileText className="w-4 h-4" />, label: 'Status Page Created', variant: 'success' },
  'statuspage.update': { icon: <Edit className="w-4 h-4" />, label: 'Status Page Updated', variant: 'default' },
  'statuspage.delete': { icon: <Trash2 className="w-4 h-4" />, label: 'Status Page Deleted', variant: 'error' },
};

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

  // Fetch audit logs (last 100)
  const logs = await prisma.auditLog.findMany({
    where: {
      orgId: org.id,
    },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100,
  });

  // Get unique action types for stats
  const actionCounts = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topActions = Object.entries(actionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#37322F] rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#37322F] font-sans">
                  {logs.length}
                </div>
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">Total Events</div>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#37322F] font-sans">
                  {logs.filter(l => l.createdAt > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                </div>
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">Last 24 Hours</div>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#37322F] font-sans">
                  {new Set(logs.map(l => l.userId).filter(Boolean)).size}
                </div>
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">Active Users</div>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-semibold text-[#37322F] font-sans">
                  {Object.keys(actionCounts).length}
                </div>
                <div className="text-sm text-[rgba(55,50,47,0.70)] font-sans">Action Types</div>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </div>

      {/* Top Actions */}
      {topActions.length > 0 && (
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle>Most Frequent Actions</SaturnCardTitle>
            <SaturnCardDescription>Top 5 activities in your organization</SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-3">
              {topActions.map(([action, count]) => {
                const config = actionConfig[action] || { 
                  icon: <Activity className="w-4 h-4" />, 
                  label: action, 
                  variant: 'default' as const
                };
                return (
                  <div key={action} className="flex items-center justify-between p-3 bg-[rgba(55,50,47,0.03)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[rgba(55,50,47,0.12)]">
                        {config.icon}
                      </div>
                      <span className="text-sm font-medium text-[#37322F] font-sans">{config.label}</span>
                    </div>
                    <SaturnBadge variant={config.variant}>{count} times</SaturnBadge>
                  </div>
                );
              })}
            </div>
          </SaturnCardContent>
        </SaturnCard>
      )}

      {/* Audit Logs Table */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle>Activity Log</SaturnCardTitle>
          <SaturnCardDescription>Recent activities and security events (last 100 entries)</SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-[rgba(55,50,47,0.20)] mx-auto mb-4" />
              <p className="text-[rgba(55,50,47,0.60)] font-sans">No audit logs yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <SaturnTable>
                <SaturnTableHeader>
                  <SaturnTableRow>
                    <SaturnTableHead>Timestamp</SaturnTableHead>
                    <SaturnTableHead>User</SaturnTableHead>
                    <SaturnTableHead>Action</SaturnTableHead>
                    <SaturnTableHead>Details</SaturnTableHead>
                  </SaturnTableRow>
                </SaturnTableHeader>
                <SaturnTableBody>
                  {logs.map((log) => {
                    const config = actionConfig[log.action] || { 
                      icon: <Activity className="w-4 h-4" />, 
                      label: log.action, 
                      variant: 'default' as const
                    };
                    
                    return (
                      <SaturnTableRow key={log.id}>
                        <SaturnTableCell>
                          <div className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                            {format(new Date(log.createdAt), 'MMM d, yyyy')}
                            <div className="text-xs text-[rgba(55,50,47,0.50)]">
                              {format(new Date(log.createdAt), 'HH:mm:ss')}
                            </div>
                          </div>
                        </SaturnTableCell>
                        <SaturnTableCell>
                          {log.User ? (
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-[#37322F] rounded-full flex items-center justify-center text-white text-xs font-sans">
                                {log.User.name?.[0] || log.User.email[0]}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-[#37322F] font-sans">
                                  {log.User.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-[rgba(55,50,47,0.50)] font-sans">
                                  {log.User.email}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-[rgba(55,50,47,0.50)] font-sans">System</span>
                          )}
                        </SaturnTableCell>
                        <SaturnTableCell>
                          <div className="flex items-center gap-2">
                            {config.icon}
                            <SaturnBadge variant={config.variant}>{config.label}</SaturnBadge>
                          </div>
                        </SaturnTableCell>
                        <SaturnTableCell>
                          {log.targetId && (
                            <div className="text-sm text-[rgba(55,50,47,0.60)] font-mono">
                              ID: {log.targetId.substring(0, 8)}...
                            </div>
                          )}
                          {log.meta && typeof log.meta === 'object' && Object.keys(log.meta).length > 0 && (
                            <details className="text-xs text-[rgba(55,50,47,0.50)] font-sans mt-1">
                              <summary className="cursor-pointer hover:text-[#37322F]">View metadata</summary>
                              <pre className="mt-2 p-2 bg-[rgba(55,50,47,0.05)] rounded text-xs overflow-x-auto">
                                {JSON.stringify(log.meta, null, 2)}
                              </pre>
                            </details>
                          )}
                        </SaturnTableCell>
                      </SaturnTableRow>
                    );
                  })}
                </SaturnTableBody>
              </SaturnTable>
            </div>
          )}
        </SaturnCardContent>
      </SaturnCard>

      {/* Info Box */}
      <SaturnCard>
        <SaturnCardContent className="p-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#37322F] font-sans mb-1">About Audit Logs</h3>
              <p className="text-sm text-[rgba(55,50,47,0.70)] font-sans">
                Audit logs track all significant actions in your organization for security and compliance purposes. 
                Logs are retained for 90 days and can be exported on request. Only owners and admins can view audit logs.
              </p>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}


