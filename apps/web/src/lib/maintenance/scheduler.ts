/**
 * Maintenance Window Scheduler
 * 
 * Manages maintenance windows for suppressing alerts during planned downtime
 */

import { prisma } from '@tokiflow/db';

type MaintenanceWindowWithActive = {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  startAt: Date;
  endAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Check if current time is within any active maintenance window for a monitor
 */
export async function isInMaintenanceWindow(
  monitorId: string,
  orgId: string
): Promise<boolean> {
  const now = new Date();
  
  const activeWindows = await (prisma as any).maintenanceWindow.findMany({
    where: {
      orgId,
      isActive: true,
      startAt: { lte: now },
      endAt: { gte: now },
    },
  });

  return activeWindows.length > 0;
}

/**
 * Check if a specific time is within a maintenance window
 */
function isTimeInWindow(time: Date, window: MaintenanceWindowWithActive): boolean {
  return window.startAt <= time && window.endAt >= time && window.isActive;
}

/**
 * Get all maintenance windows for an organization
 */
export async function getMaintenanceWindows(
  orgId: string,
  monitorId?: string
): Promise<Array<MaintenanceWindowWithActive & { isActive: boolean }>> {
  const windows = await (prisma as any).maintenanceWindow.findMany({
    where: { orgId },
    orderBy: { startAt: 'desc' },
  });

  const now = new Date();
  
  return windows.map((window: any) => ({
    ...window,
    isActive: window.isActive && window.startAt <= now && window.endAt >= now,
  }));
}

/**
 * Create a new maintenance window
 */
export async function createMaintenanceWindow(data: {
  orgId: string;
  monitorId?: string | null;
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  recurring?: boolean;
  rrule?: string;
}) {
  // Validate dates
  if (data.startTime >= data.endTime) {
    throw new Error('End time must be after start time');
  }

  if (data.startTime < new Date()) {
    throw new Error('Start time cannot be in the past');
  }

  // Check for overlapping maintenance windows
  const overlapping = await (prisma as any).maintenanceWindow.findFirst({
    where: {
      orgId: data.orgId,
      OR: [
        {
          startAt: { lte: data.endTime },
          endAt: { gte: data.startTime },
        },
      ],
    },
  });

  if (overlapping) {
    throw new Error(`Maintenance window overlaps with existing window: ${overlapping.name}`);
  }

  return await (prisma as any).maintenanceWindow.create({
    data: {
      orgId: data.orgId,
      name: data.name,
      description: data.description || null,
      startAt: data.startTime,
      endAt: data.endTime,
      isActive: false, // Will be activated automatically when time comes
      updatedAt: new Date(),
    },
  });
}

/**
 * Delete a maintenance window
 */
export async function deleteMaintenanceWindow(id: string) {
  // Check if window is currently active
  const window = await (prisma as any).maintenanceWindow.findUnique({
    where: { id },
  });

  if (!window) {
    throw new Error('Maintenance window not found');
  }

  const now = new Date();
  if (window.isActive && window.startAt <= now && window.endAt >= now) {
    throw new Error('Cannot delete active maintenance window');
  }

  return await (prisma as any).maintenanceWindow.delete({
    where: { id },
  });
}

/**
 * Legacy function for compatibility
 */
export async function checkMaintenanceWindow(monitorId: string): Promise<boolean> {
  // Get monitor's org
  const monitor = await (prisma as any).monitor.findUnique({
    where: { id: monitorId },
    select: { orgId: true },
  });

  if (!monitor) {
    return false;
  }

  return isInMaintenanceWindow(monitorId, monitor.orgId);
}

/**
 * Get active windows (alias for getMaintenanceWindows)
 */
export async function getActiveWindows(orgId: string, monitorId?: string) {
  return getMaintenanceWindows(orgId, monitorId);
}
