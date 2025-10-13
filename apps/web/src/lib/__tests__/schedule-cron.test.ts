import { calculateNextDueAt, isRunLate } from '@/lib/schedule';

describe('Schedule Calculations', () => {
  describe('calculateNextDueAt', () => {
    it('should calculate next run for INTERVAL schedule', () => {
      const from = new Date('2025-01-01T00:00:00Z');
      const next = calculateNextDueAt({
        scheduleType: 'INTERVAL',
        intervalSec: 3600, // 1 hour
        cronExpr: null,
        timezone: 'UTC',
        from,
      });

      expect(next.getTime()).toBe(from.getTime() + 3600 * 1000);
    });

    it('should calculate next run for simple CRON schedule', () => {
      const from = new Date('2025-01-01T12:00:00Z'); // Noon
      const next = calculateNextDueAt({
        scheduleType: 'CRON',
        intervalSec: null,
        cronExpr: '0 0 * * *', // Daily at midnight
        timezone: 'UTC',
        from,
      });

      // Should be later than current time
      expect(next.getTime()).toBeGreaterThan(from.getTime());
      
      // Should be within 24 hours
      expect(next.getTime()).toBeLessThan(from.getTime() + 24 * 60 * 60 * 1000);
    });

    it('should calculate next run for CRON schedule (every 5 minutes)', () => {
      const from = new Date('2025-01-01T12:03:00Z');
      const next = calculateNextDueAt({
        scheduleType: 'CRON',
        intervalSec: null,
        cronExpr: '*/5 * * * *', // Every 5 minutes
        timezone: 'UTC',
        from,
      });

      // Should be later than current time
      expect(next.getTime()).toBeGreaterThan(from.getTime());
      
      // Should be within 5 minutes
      expect(next.getTime()).toBeLessThan(from.getTime() + 5 * 60 * 1000);
    });

    it('should use current time as default from', () => {
      const before = Date.now();
      const next = calculateNextDueAt({
        scheduleType: 'INTERVAL',
        intervalSec: 60,
        cronExpr: null,
        timezone: 'UTC',
      });
      const after = Date.now();

      expect(next.getTime()).toBeGreaterThanOrEqual(before + 60000);
      expect(next.getTime()).toBeLessThanOrEqual(after + 60000 + 100); // Allow 100ms variance
    });
  });

  describe('isRunLate', () => {
    it('should return false if run is not late', () => {
      const nextDueAt = new Date('2025-01-01T12:00:00Z');
      const now = new Date('2025-01-01T11:58:00Z'); // 2 minutes before
      const graceSec = 300; // 5 minute grace period

      expect(isRunLate(nextDueAt, graceSec, now)).toBe(false);
    });

    it('should return false if run is within grace period', () => {
      const nextDueAt = new Date('2025-01-01T12:00:00Z');
      const now = new Date('2025-01-01T12:03:00Z'); // 3 minutes after
      const graceSec = 300; // 5 minute grace period

      expect(isRunLate(nextDueAt, graceSec, now)).toBe(false);
    });

    it('should return true if run exceeds grace period', () => {
      const nextDueAt = new Date('2025-01-01T12:00:00Z');
      const now = new Date('2025-01-01T12:06:00Z'); // 6 minutes after
      const graceSec = 300; // 5 minute grace period

      expect(isRunLate(nextDueAt, graceSec, now)).toBe(true);
    });

    it('should handle zero grace period', () => {
      const nextDueAt = new Date('2025-01-01T12:00:00Z');
      const now = new Date('2025-01-01T12:00:01Z'); // 1 second after
      const graceSec = 0;

      expect(isRunLate(nextDueAt, graceSec, now)).toBe(true);
    });

    it('should use current time as default now', () => {
      const nextDueAt = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
      const graceSec = 60; // 1 minute grace

      expect(isRunLate(nextDueAt, graceSec)).toBe(true);
    });
  });
});
