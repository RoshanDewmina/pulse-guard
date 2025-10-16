import { updateWelfordStats } from '@/lib/analytics/welford';

describe('updateWelfordStats', () => {
  it('updates stats with new value', () => {
    const stats = updateWelfordStats({
      count: 0,
      mean: null,
      m2: null,
      min: null,
      max: null,
      newValue: 100,
    });
    expect(stats.count).toBe(1);
    expect(stats.mean).toBe(100);
  });
});




