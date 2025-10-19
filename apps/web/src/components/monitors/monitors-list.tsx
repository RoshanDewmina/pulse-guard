'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnBadge,
  SaturnTable,
  SaturnTableHeader,
  SaturnTableBody,
  SaturnTableRow,
  SaturnTableHead,
  SaturnTableCell,
  StatusIcon,
} from '@/components/saturn';
import { TagFilter } from './tag-filter';
import { formatSchedule } from '@/lib/schedule';

type MonitorStatus = 'OK' | 'LATE' | 'MISSED' | 'FAILING' | 'DISABLED';

interface Tag {
  id: string;
  name: string;
}

interface Monitor {
  id: string;
  name: string;
  status: MonitorStatus;
  scheduleType: 'INTERVAL' | 'CRON';
  intervalSec: number | null;
  cronExpr: string | null;
  lastRunAt: Date | null;
  lastDurationMs: number | null;
  nextDueAt: Date | null;
  _count: {
    Incident: number;
    Run: number;
  };
  MonitorTag: {
    Tag: Tag;
  }[];
}

interface MonitorsListProps {
  monitors: Monitor[];
  tags: Tag[];
  monitorLimit?: number;
  currentCount: number;
}

export function MonitorsList({ monitors, tags, monitorLimit, currentCount }: MonitorsListProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredMonitors = useMemo(() => {
    if (selectedTags.length === 0) {
      return monitors;
    }

    return monitors.filter(monitor =>
      monitor.MonitorTag.some(monitorTag =>
        selectedTags.includes(monitorTag.Tag.id)
      )
    );
  }, [monitors, selectedTags]);

  const getStatusVariant = (status: MonitorStatus): 'success' | 'warning' | 'error' | 'default' => {
    if (status === 'OK') return 'success';
    if (status === 'LATE' || status === 'MISSED') return 'warning';
    if (status === 'FAILING') return 'error';
    if (status === 'DISABLED') return 'default';
    return 'default';
  };

  const getMonitorTags = (monitor: Monitor) => {
    return monitor.MonitorTag.map(mt => mt.Tag);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <TagFilter
            tags={tags}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
          />
          {selectedTags.length > 0 && (
            <div className="text-sm text-gray-600">
              Showing {filteredMonitors.length} of {monitors.length} monitors
            </div>
          )}
        </div>
      </div>

      {/* Monitors Table */}
      <SaturnCard padding="none">
        <SaturnCardHeader>
          <SaturnCardTitle as="h2">
            Your Monitors ({filteredMonitors.length})
          </SaturnCardTitle>
          <SaturnCardDescription>
            {monitorLimit
              ? `Using ${currentCount} of ${monitorLimit} monitors`
              : 'Manage your monitors'}
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          {filteredMonitors.length === 0 ? (
            <div className="text-center py-8">
              {selectedTags.length > 0 ? (
                <div>
                  <p className="text-gray-500 mb-4">
                    No monitors found with the selected tags.
                  </p>
                  <SaturnButton
                    variant="secondary"
                    onClick={() => setSelectedTags([])}
                  >
                    Clear filters
                  </SaturnButton>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-4">
                    No monitors found. Create your first monitor to get started.
                  </p>
                  <Link href="/app/monitors/new">
                    <SaturnButton>Create Monitor</SaturnButton>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <SaturnTable>
              <SaturnTableHeader>
                <SaturnTableRow>
                  <SaturnTableHead>Name</SaturnTableHead>
                  <SaturnTableHead>Tags</SaturnTableHead>
                  <SaturnTableHead>Status</SaturnTableHead>
                  <SaturnTableHead>Schedule</SaturnTableHead>
                  <SaturnTableHead>Last Run</SaturnTableHead>
                  <SaturnTableHead>Next Due</SaturnTableHead>
                  <SaturnTableHead>Incidents</SaturnTableHead>
                  <SaturnTableHead className="text-right">Actions</SaturnTableHead>
                </SaturnTableRow>
              </SaturnTableHeader>
              <SaturnTableBody>
                {filteredMonitors.map((monitor) => {
                  const monitorTags = getMonitorTags(monitor);
                  
                  return (
                    <SaturnTableRow key={monitor.id}>
                      <SaturnTableCell className="font-medium">
                        <Link
                          href={`/app/monitors/${monitor.id}`}
                          className="hover:underline text-[#37322F]"
                        >
                          {monitor.name}
                        </Link>
                      </SaturnTableCell>
                      <SaturnTableCell>
                        {monitorTags.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {monitorTags.slice(0, 3).map((tag) => (
                              <SaturnBadge
                                key={tag.id}
                                variant="default"
                                size="sm"
                                className="text-xs"
                              >
                                {tag.name}
                              </SaturnBadge>
                            ))}
                            {monitorTags.length > 3 && (
                              <SaturnBadge
                                variant="default"
                                size="sm"
                                className="text-xs"
                              >
                                +{monitorTags.length - 3}
                              </SaturnBadge>
                            )}
                          </div>
                        ) : (
                          <span className="text-[rgba(55,50,47,0.40)]">—</span>
                        )}
                      </SaturnTableCell>
                      <SaturnTableCell>
                        <div className="flex items-center gap-2">
                          <StatusIcon status={monitor.status} size="sm" />
                          <SaturnBadge variant={getStatusVariant(monitor.status)} size="sm">
                            {monitor.status}
                          </SaturnBadge>
                        </div>
                      </SaturnTableCell>
                      <SaturnTableCell className="text-[rgba(55,50,47,0.80)]">
                        {formatSchedule(monitor.scheduleType, monitor.intervalSec, monitor.cronExpr)}
                      </SaturnTableCell>
                      <SaturnTableCell>
                        {monitor.lastRunAt ? (
                          <span className="text-[#37322F]">
                            {format(monitor.lastRunAt, 'MMM d, HH:mm')}
                            {monitor.lastDurationMs && (
                              <span className="text-[rgba(55,50,47,0.60)] ml-2">
                                ({monitor.lastDurationMs}ms)
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-[rgba(55,50,47,0.40)]">Never</span>
                        )}
                      </SaturnTableCell>
                      <SaturnTableCell>
                        {monitor.nextDueAt ? (
                          <span className="text-[#37322F]">{format(monitor.nextDueAt, 'MMM d, HH:mm')}</span>
                        ) : (
                          <span className="text-[rgba(55,50,47,0.40)]">N/A</span>
                        )}
                      </SaturnTableCell>
                      <SaturnTableCell>
                        {monitor._count.Incident > 0 ? (
                          <SaturnBadge variant="error" size="sm">
                            {monitor._count.Incident}
                          </SaturnBadge>
                        ) : (
                          <span className="text-[rgba(55,50,47,0.40)]">—</span>
                        )}
                      </SaturnTableCell>
                      <SaturnTableCell className="text-right">
                        <Link href={`/app/monitors/${monitor.id}`}>
                          <SaturnButton variant="ghost" size="sm">
                            View
                          </SaturnButton>
                        </Link>
                      </SaturnTableCell>
                    </SaturnTableRow>
                  );
                })}
              </SaturnTableBody>
            </SaturnTable>
          )}
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}
