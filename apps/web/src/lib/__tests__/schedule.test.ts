import { calculateNextDueAt } from '@/lib/schedule';

describe('calculateNextDueAt', () => {
  it('computes next due for INTERVAL schedule', () => {
    const from = new Date('2025-01-01T00:00:00Z');
    const next = calculateNextDueAt({
      scheduleType: 'INTERVAL',
      intervalSec: 300,
      cronExpr: null,
      timezone: 'UTC',
      from,
    });
    expect(next.getTime()).toBe(from.getTime() + 300 * 1000);
  });
});



