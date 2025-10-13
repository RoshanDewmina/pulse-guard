/**
 * Maintenance Window Scheduler
 * 
 * Evaluate if current time is within a maintenance window
 */

// Local minimal type to avoid depending on Prisma types in web layer
type MaintenanceWindow = {
  id: string;
  monitorId: string | null;
  orgId: string;
  name: string;
  startTime: Date;
  endTime: Date;
  recurring: boolean;
  rrule?: string | null;
  enabled: boolean;
};
import { prisma } from '@tokiflow/db';

/**
 * Check if current time is within any active maintenance window for a monitor
 * 
 * @param monitorId - Monitor ID
 * @param orgId - Organization ID
 * @returns True if in maintenance window
 */
export async function isInMaintenanceWindow(
  monitorId: string,
  orgId: string
): Promise<boolean> {
  const now = new Date();

  // Find active maintenance windows
  const windows = await prisma.maintenanceWindow.findMany({
    where: {
      OR: [
        { monitorId }, // Specific to this monitor
        { monitorId: null, orgId }, // Org-wide window
      ],
      enabled: true,
    },
  });

  for (const window of windows) {
    if (isTimeInWindow(now, window)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if a specific time is within a maintenance window
 * 
 * @param time - Time to check
 * @param window - Maintenance window
 * @returns True if time is in window
 */
export function isTimeInWindow(time: Date, window: MaintenanceWindow): boolean {
  // For non-recurring windows, simple date comparison
  if (!window.recurring) {
    return time >= window.startTime && time <= window.endTime;
  }

  // For recurring windows, we need to evaluate the RRULE
  // This is a simplified implementation
  // Full implementation would use a library like 'rrule'
  
  // For now, handle simple weekly recurrence
  if (window.rrule?.includes('FREQ=WEEKLY')) {
    const dayOfWeek = time.getDay();
    const startHour = window.startTime.getHours();
    const startMinute = window.startTime.getMinutes();
    const endHour = window.endTime.getHours();
    const endMinute = window.endTime.getMinutes();
    
    const currentMinutes = time.getHours() * 60 + time.getMinutes();
    const windowStartMinutes = startHour * 60 + startMinute;
    const windowEndMinutes = endHour * 60 + endMinute;

    // Check if day matches (parse BYDAY from RRULE)
    const dayMatch = window.rrule.includes('BYDAY');
    if (dayMatch) {
      // Example: FREQ=WEEKLY;BYDAY=SU
      const matches = window.rrule.match(/BYDAY=([A-Z,]+)/);
      if (matches) {
        const days = matches[1].split(',');
        const dayNames = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
        const currentDayName = dayNames[dayOfWeek];
        
        if (!days.includes(currentDayName)) {
          return false;
        }
      }
    }

    // Check if time is within window
    return currentMinutes >= windowStartMinutes && currentMinutes <= windowEndMinutes;
  }

  // For daily recurrence
  if (window.rrule?.includes('FREQ=DAILY')) {
    const startHour = window.startTime.getHours();
    const startMinute = window.startTime.getMinutes();
    const endHour = window.endTime.getHours();
    const endMinute = window.endTime.getMinutes();
    
    const currentMinutes = time.getHours() * 60 + time.getMinutes();
    const windowStartMinutes = startHour * 60 + startMinute;
    const windowEndMinutes = endHour * 60 + endMinute;

    return currentMinutes >= windowStartMinutes && currentMinutes <= windowEndMinutes;
  }

  return false;
}

/**
 * Get active maintenance windows for display
 * 
 * @param monitorId - Monitor ID (optional)
 * @param orgId - Organization ID
 * @returns List of windows with active status
 */
export async function getActiveWindows(
  orgId: string,
  monitorId?: string
): Promise<Array<MaintenanceWindow & { isActive: boolean }>> {
  const windows = await prisma.maintenanceWindow.findMany({
    where: {
      orgId,
      ...(monitorId ? { OR: [{ monitorId }, { monitorId: null }] } : {}),
      enabled: true,
    },
    orderBy: {
      startTime: 'asc',
    },
  });

  const now = new Date();

  return windows.map(window => ({
    ...window,
    isActive: isTimeInWindow(now, window),
  }));
}

/**
 * Create a maintenance window
 */
export async function createMaintenanceWindow(data: {
  orgId: string;
  monitorId?: string;
  name: string;
  startTime: Date;
  endTime: Date;
  recurring?: boolean;
  rrule?: string;
}) {
  return await prisma.maintenanceWindow.create({
    data,
  });
}

/**
 * Delete a maintenance window
 */
export async function deleteMaintenanceWindow(id: string) {
  return await prisma.maintenanceWindow.delete({
    where: { id },
  });
}



