'use client';

import { format } from 'date-fns';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardContent,
  SaturnBadge,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
} from '@/components/saturn';
import { StatusIcon } from '@/components/saturn';
import { Activity, Users, Monitor, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';

interface SystemMetrics {
  totalMonitors: number;
  activeMonitors: number;
  totalIncidents: number;
  openIncidents: number;
  totalUsers: number;
  totalOrgs: number;
  uptimePercentage: number;
  recentUsers: number;
  monitorStatusBreakdown: Record<string, number>;
}

interface RecentIncident {
  id: string;
  status: string;
  kind: string;
  summary: string;
  openedAt: Date;
  monitor: {
    id: string;
    name: string;
    org: {
      name: string;
    };
  };
}

interface StaffDashboardProps {
  systemMetrics: SystemMetrics;
  recentIncidents: RecentIncident[];
}

export function StaffDashboard({ systemMetrics, recentIncidents }: StaffDashboardProps) {
  const {
    totalMonitors,
    activeMonitors,
    totalIncidents,
    openIncidents,
    totalUsers,
    totalOrgs,
    uptimePercentage,
    recentUsers,
    monitorStatusBreakdown,
  } = systemMetrics;

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    if (status === 'OK') return 'success';
    if (status === 'LATE' || status === 'MISSED') return 'warning';
    if (status === 'FAILING') return 'error';
    if (status === 'DISABLED') return 'default';
    return 'default';
  };

  const getIncidentVariant = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    if (status === 'RESOLVED') return 'success';
    if (status === 'ACKED') return 'warning';
    if (status === 'OPEN') return 'error';
    return 'default';
  };

  const getIncidentIcon = (kind: string) => {
    switch (kind) {
      case 'MISSED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'LATE':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'FAIL':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'ANOMALY':
        return <Activity className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Monitors</p>
                <p className="text-2xl font-bold text-gray-900">{totalMonitors.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {activeMonitors} active
                </p>
              </div>
              <Monitor className="w-8 h-8 text-blue-500" />
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{uptimePercentage.toFixed(2)}%</p>
                <p className="text-xs text-gray-500">
                  {totalMonitors > 0 ? 'All monitors' : 'No data'}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{openIncidents}</p>
                <p className="text-xs text-gray-500">
                  of {totalIncidents} total
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{totalUsers.toLocaleString()}</p>
                <p className="text-xs text-gray-500">
                  {recentUsers} new this month
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </div>

      {/* Monitor Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle>Monitor Status</SaturnCardTitle>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-4">
              {Object.entries(monitorStatusBreakdown).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <StatusIcon status={status as any} size="sm" />
                    <span className="text-sm font-medium">{status}</span>
                  </div>
                  <SaturnBadge variant={getStatusVariant(status)} size="sm">
                    {count}
                  </SaturnBadge>
                </div>
              ))}
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle>System Overview</SaturnCardTitle>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Organizations</span>
                <span className="text-sm text-gray-600">{totalOrgs.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Active Monitors</span>
                <span className="text-sm text-gray-600">{activeMonitors.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Disabled Monitors</span>
                <span className="text-sm text-gray-600">
                  {(totalMonitors - activeMonitors).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Incidents</span>
                <span className="text-sm text-gray-600">{totalIncidents.toLocaleString()}</span>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </div>

      {/* Recent Incidents */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle>Recent Incidents (Last 24 Hours)</SaturnCardTitle>
        </SaturnCardHeader>
        <SaturnCardContent>
          {recentIncidents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-gray-500">No incidents in the last 24 hours</p>
            </div>
          ) : (
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Monitor</SaturnTableHead>
                  <SaturnTableHead>Type</SaturnTableHead>
                  <SaturnTableHead>Status</SaturnTableHead>
                  <SaturnTableHead>Summary</SaturnTableHead>
                  <SaturnTableHead>Time</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {recentIncidents.map((incident) => (
                  <SaturnTableRow key={incident.id}>
                    <SaturnTableCell className="font-medium">
                      <div>
                        <div className="text-sm font-medium">{incident.monitor.name}</div>
                        <div className="text-xs text-gray-500">{incident.monitor.org.name}</div>
                      </div>
                    </SaturnTableCell>
                    <SaturnTableCell>
                      <div className="flex items-center gap-2">
                        {getIncidentIcon(incident.kind)}
                        <span className="text-sm">{incident.kind}</span>
                      </div>
                    </SaturnTableCell>
                    <SaturnTableCell>
                      <SaturnBadge variant={getIncidentVariant(incident.status)} size="sm">
                        {incident.status}
                      </SaturnBadge>
                    </SaturnTableCell>
                    <SaturnTableCell className="max-w-xs">
                      <div className="truncate text-sm text-gray-600">
                        {incident.summary}
                      </div>
                    </SaturnTableCell>
                    <SaturnTableCell className="text-sm text-gray-500">
                      {format(incident.openedAt, 'MMM d, HH:mm')}
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
