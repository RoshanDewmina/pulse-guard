import { detectDurationAnomaly } from '@/lib/analytics/anomaly';

describe('detectDurationAnomaly', () => {
  it('should not detect anomaly for first run', async () => {
    const monitor = {
      id: 'mon-1',
      durationMean: null,
      durationStddev: null,
      durationCount: 0,
    };

    const result = await detectDurationAnomaly(monitor, 1000);

    expect(result.isAnomaly).toBe(false);
    expect(result.reason).toBe('insufficient_data');
    expect(result.message).toContain('Need at least');
  });

  it('should detect anomaly when duration exceeds 3 standard deviations', async () => {
    const monitor = {
      id: 'mon-1',
      durationMean: 1000, // 1 second average
      durationStddev: 100, // 0.1 second stddev
      durationCount: 50,
    };

    // 1000 + (3 * 100) = 1300ms is the threshold
    // Test with 1400ms (above threshold)
    const result = await detectDurationAnomaly(monitor, 1400);

    expect(result.isAnomaly).toBe(true);
    expect(result.reason).toBe('slow_duration');
    expect(result.zScore).toBeGreaterThan(3);
  });

  it('should not detect anomaly for normal duration', async () => {
    const monitor = {
      id: 'mon-1',
      durationMean: 1000,
      durationStddev: 200,
      durationCount: 50,
    };

    // Duration within 2 standard deviations
    const result = await detectDurationAnomaly(monitor, 1200);

    expect(result.isAnomaly).toBe(false);
    expect(result.reason).toBe('normal');
  });

  it('should handle edge case with zero stddev', async () => {
    const monitor = {
      id: 'mon-1',
      durationMean: 1000,
      durationStddev: 0, // All runs took exactly the same time
      durationCount: 10,
    };

    // Even 1ms difference should be anomaly with 0 stddev
    const result = await detectDurationAnomaly(monitor, 1001);

    expect(result.isAnomaly).toBe(true);
  });
});

