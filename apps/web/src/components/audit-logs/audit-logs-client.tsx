'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  SaturnBadge,
  SaturnButton,
  SaturnInput,
  SaturnSelect,
} from '@/components/saturn';
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
  AlertCircle,
  Download,
  Filter,
  Search,
  Calendar,
  RefreshCw,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Clock,
  Database,
  Server,
  CreditCard,
  Mail,
  Bell,
  Monitor,
  Tag,
  Wrench,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
} from 'lucide-react';

// Map action types to icons and descriptions
const actionConfig: Record<string, { icon: React.ReactNode; label: string; variant: 'default' | 'success' | 'warning' | 'error' }> = {
  // User actions
  'user.created': { icon: <User className="w-4 h-4" />, label: 'User Created', variant: 'success' },
  'user.deleted': { icon: <Trash2 className="w-4 h-4" />, label: 'User Deleted', variant: 'error' },
  'user.updated': { icon: <Edit className="w-4 h-4" />, label: 'User Updated', variant: 'default' },
  'user.data_exported': { icon: <Download className="w-4 h-4" />, label: 'Data Exported', variant: 'default' },
  'user.data_export_downloaded': { icon: <Download className="w-4 h-4" />, label: 'Data Downloaded', variant: 'default' },
  'user.profile_updated': { icon: <User className="w-4 h-4" />, label: 'Profile Updated', variant: 'default' },

  // Authentication & Security
  'auth.login_success': { icon: <Unlock className="w-4 h-4" />, label: 'Login Success', variant: 'success' },
  'auth.login_failed': { icon: <Lock className="w-4 h-4" />, label: 'Login Failed', variant: 'error' },
  'auth.logout': { icon: <Lock className="w-4 h-4" />, label: 'Logout', variant: 'default' },
  'auth.password_changed': { icon: <Key className="w-4 h-4" />, label: 'Password Changed', variant: 'success' },
  'auth.password_reset': { icon: <Key className="w-4 h-4" />, label: 'Password Reset', variant: 'warning' },
  'auth.mfa_enabled': { icon: <Shield className="w-4 h-4" />, label: 'MFA Enabled', variant: 'success' },
  'auth.mfa_disabled': { icon: <Shield className="w-4 h-4" />, label: 'MFA Disabled', variant: 'error' },
  'auth.mfa_verified': { icon: <CheckCircle className="w-4 h-4" />, label: 'MFA Verified', variant: 'success' },
  'auth.mfa_backup_codes_generated': { icon: <Key className="w-4 h-4" />, label: 'Backup Codes Generated', variant: 'success' },
  'auth.mfa_backup_codes_regenerated': { icon: <RefreshCw className="w-4 h-4" />, label: 'Backup Codes Regenerated', variant: 'warning' },

  // API key actions
  'api_key.created': { icon: <Key className="w-4 h-4" />, label: 'API Key Created', variant: 'success' },
  'api_key.revoked': { icon: <Key className="w-4 h-4" />, label: 'API Key Revoked', variant: 'error' },
  'api_key.used': { icon: <Activity className="w-4 h-4" />, label: 'API Key Used', variant: 'default' },
  'api_key.updated': { icon: <Edit className="w-4 h-4" />, label: 'API Key Updated', variant: 'default' },

  // Organization actions
  'org.created': { icon: <Database className="w-4 h-4" />, label: 'Organization Created', variant: 'success' },
  'org.deleted': { icon: <Trash2 className="w-4 h-4" />, label: 'Organization Deleted', variant: 'error' },
  'org.updated': { icon: <Edit className="w-4 h-4" />, label: 'Organization Updated', variant: 'default' },
  'org.member_added': { icon: <UserPlus className="w-4 h-4" />, label: 'Member Added', variant: 'success' },
  'org.member_removed': { icon: <Trash2 className="w-4 h-4" />, label: 'Member Removed', variant: 'error' },
  'org.member_role_changed': { icon: <Settings className="w-4 h-4" />, label: 'Role Changed', variant: 'default' },
  'org.switched': { icon: <RefreshCw className="w-4 h-4" />, label: 'Organization Switched', variant: 'default' },

  // Monitor actions
  'monitor.created': { icon: <Monitor className="w-4 h-4" />, label: 'Monitor Created', variant: 'success' },
  'monitor.deleted': { icon: <Trash2 className="w-4 h-4" />, label: 'Monitor Deleted', variant: 'error' },
  'monitor.updated': { icon: <Edit className="w-4 h-4" />, label: 'Monitor Updated', variant: 'default' },
  'monitor.paused': { icon: <Pause className="w-4 h-4" />, label: 'Monitor Paused', variant: 'warning' },
  'monitor.resumed': { icon: <Play className="w-4 h-4" />, label: 'Monitor Resumed', variant: 'success' },
  'monitor.anomaly_threshold_updated': { icon: <Settings className="w-4 h-4" />, label: 'Anomaly Threshold Updated', variant: 'default' },
  'monitor.http_config_updated': { icon: <Settings className="w-4 h-4" />, label: 'HTTP Config Updated', variant: 'default' },

  // Tag actions
  'tag.created': { icon: <Tag className="w-4 h-4" />, label: 'Tag Created', variant: 'success' },
  'tag.deleted': { icon: <Trash2 className="w-4 h-4" />, label: 'Tag Deleted', variant: 'error' },
  'tag.updated': { icon: <Edit className="w-4 h-4" />, label: 'Tag Updated', variant: 'default' },

  // Incident actions
  'incident.created': { icon: <AlertCircle className="w-4 h-4" />, label: 'Incident Created', variant: 'error' },
  'incident.acknowledged': { icon: <Eye className="w-4 h-4" />, label: 'Incident Acknowledged', variant: 'warning' },
  'incident.resolved': { icon: <CheckCircle className="w-4 h-4" />, label: 'Incident Resolved', variant: 'success' },
  'incident.snoozed': { icon: <Clock className="w-4 h-4" />, label: 'Incident Snoozed', variant: 'warning' },
  'incident.updated': { icon: <Edit className="w-4 h-4" />, label: 'Incident Updated', variant: 'default' },

  // Status page actions
  'status_page.created': { icon: <FileText className="w-4 h-4" />, label: 'Status Page Created', variant: 'success' },
  'status_page.deleted': { icon: <Trash2 className="w-4 h-4" />, label: 'Status Page Deleted', variant: 'error' },
  'status_page.updated': { icon: <Edit className="w-4 h-4" />, label: 'Status Page Updated', variant: 'default' },
  'status_page.domain_verified': { icon: <CheckCircle className="w-4 h-4" />, label: 'Domain Verified', variant: 'success' },

  // Maintenance window actions
  'maintenance_window.created': { icon: <Wrench className="w-4 h-4" />, label: 'Maintenance Window Created', variant: 'success' },
  'maintenance_window.deleted': { icon: <Trash2 className="w-4 h-4" />, label: 'Maintenance Window Deleted', variant: 'error' },
  'maintenance_window.updated': { icon: <Edit className="w-4 h-4" />, label: 'Maintenance Window Updated', variant: 'default' },

  // Alert channel actions
  'alert_channel.created': { icon: <Bell className="w-4 h-4" />, label: 'Alert Channel Created', variant: 'success' },
  'alert_channel.deleted': { icon: <Trash2 className="w-4 h-4" />, label: 'Alert Channel Deleted', variant: 'error' },
  'alert_channel.updated': { icon: <Edit className="w-4 h-4" />, label: 'Alert Channel Updated', variant: 'default' },
  'alert_channel.tested': { icon: <Activity className="w-4 h-4" />, label: 'Alert Channel Tested', variant: 'default' },

  // Billing actions
  'billing.subscription_created': { icon: <CreditCard className="w-4 h-4" />, label: 'Subscription Created', variant: 'success' },
  'billing.subscription_updated': { icon: <Edit className="w-4 h-4" />, label: 'Subscription Updated', variant: 'default' },
  'billing.subscription_cancelled': { icon: <XCircle className="w-4 h-4" />, label: 'Subscription Cancelled', variant: 'error' },
  'billing.payment_success': { icon: <CheckCircle className="w-4 h-4" />, label: 'Payment Success', variant: 'success' },
  'billing.payment_failed': { icon: <XCircle className="w-4 h-4" />, label: 'Payment Failed', variant: 'error' },

  // System actions
  'system.backup_created': { icon: <Database className="w-4 h-4" />, label: 'Backup Created', variant: 'success' },
  'system.cleanup_run': { icon: <Trash2 className="w-4 h-4" />, label: 'Cleanup Run', variant: 'default' },
  'system.maintenance_mode_enabled': { icon: <Wrench className="w-4 h-4" />, label: 'Maintenance Mode Enabled', variant: 'warning' },
  'system.maintenance_mode_disabled': { icon: <CheckCircle className="w-4 h-4" />, label: 'Maintenance Mode Disabled', variant: 'success' },
};

interface AuditLog {
  id: string;
  action: string;
  orgId: string;
  userId: string | null;
  targetId: string | null;
  meta: any;
  createdAt: Date;
  User?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface AuditLogsClientProps {
  initialLogs: AuditLog[];
  orgId: string;
  total: number;
}

export function AuditLogsClient({ initialLogs, orgId, total }: AuditLogsClientProps) {
  const [logs, setLogs] = useState<AuditLog[]>(initialLogs);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
  });

  const fetchLogs = async (newFilters = filters, newPagination = pagination) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        orgId,
        limit: newPagination.limit.toString(),
        offset: newPagination.offset.toString(),
        ...(newFilters.action && { action: newFilters.action }),
        ...(newFilters.userId && { userId: newFilters.userId }),
        ...(newFilters.startDate && { startDate: newFilters.startDate }),
        ...(newFilters.endDate && { endDate: newFilters.endDate }),
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setLogs(data.logs);
      } else {
        console.error('Failed to fetch audit logs:', data.error);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPagination({ ...pagination, offset: 0 });
    fetchLogs(newFilters, { ...pagination, offset: 0 });
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const params = new URLSearchParams({
        orgId,
        format,
        limit: '1000', // Export more records
        ...(filters.action && { action: filters.action }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      const response = await fetch(`/api/audit-logs?${params}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error);
    }
  };

  const handlePagination = (direction: 'prev' | 'next') => {
    const newOffset = direction === 'next' 
      ? pagination.offset + pagination.limit
      : Math.max(0, pagination.offset - pagination.limit);
    
    setPagination({ ...pagination, offset: newOffset });
    fetchLogs(filters, { ...pagination, offset: newOffset });
  };

  // Get unique action types for filter dropdown
  const actionTypes = Array.from(new Set(logs.map(log => log.action))).sort();

  return (
    <div className="space-y-6">
      {/* Filters */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Export
          </SaturnCardTitle>
          <SaturnCardDescription>
            Filter audit logs and export data for compliance
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="text-sm font-medium text-[#37322F] mb-2 block">Action Type</label>
              <SaturnSelect
                value={filters.action}
                onValueChange={(value) => handleFilterChange('action', value)}
                options={[
                  { value: '', label: 'All actions' },
                  ...actionTypes.map(action => {
                    const config = actionConfig[action] || { label: action, variant: 'default' as const };
                    return {
                      value: action,
                      label: config.label
                    };
                  })
                ]}
                placeholder="All actions"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#37322F] mb-2 block">Start Date</label>
              <SaturnInput
                type="datetime-local"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                placeholder="Start date"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#37322F] mb-2 block">End Date</label>
              <SaturnInput
                type="datetime-local"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                placeholder="End date"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#37322F] mb-2 block">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[rgba(55,50,47,0.50)] w-4 h-4" />
                <SaturnInput
                  placeholder="Search logs..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SaturnButton
                variant="secondary"
                onClick={() => fetchLogs()}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </SaturnButton>
            </div>

            <div className="flex items-center gap-2">
              <SaturnButton
                variant="secondary"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4" />
                Export CSV
              </SaturnButton>
              <SaturnButton
                variant="secondary"
                onClick={() => handleExport('json')}
              >
                <Download className="w-4 h-4" />
                Export JSON
              </SaturnButton>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>

      {/* Audit Logs Table */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle>Activity Log</SaturnCardTitle>
          <SaturnCardDescription>
            Recent activities and security events ({logs.length} of {total} total)
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-[rgba(55,50,47,0.20)] mx-auto mb-4" />
              <p className="text-[rgba(55,50,47,0.60)] font-sans">No audit logs found</p>
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

          {/* Pagination */}
          {logs.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-[rgba(55,50,47,0.60)]">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, total)} of {total} entries
              </div>
              <div className="flex items-center gap-2">
                <SaturnButton
                  variant="secondary"
                  onClick={() => handlePagination('prev')}
                  disabled={pagination.offset === 0 || loading}
                >
                  Previous
                </SaturnButton>
                <SaturnButton
                  variant="secondary"
                  onClick={() => handlePagination('next')}
                  disabled={pagination.offset + pagination.limit >= total || loading}
                >
                  Next
                </SaturnButton>
              </div>
            </div>
          )}
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}
