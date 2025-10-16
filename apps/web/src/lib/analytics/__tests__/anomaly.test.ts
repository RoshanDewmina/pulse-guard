import { detectDurationAnomaly } from '@/lib/analytics/anomaly';

describe('detectDurationAnomaly', () => {
  it('should not detect anomaly for first run', async () => {
    const monitor = {
      durationMean: null,
      durationM2: null,
      durationMedian: null,
      durationMin: null,
      durationMax: null,
      durationCount: 0,
    };

    const result = await detectDurationAnomaly(monitor, 1000);

    expect(result.isAnomaly).toBe(false);
  });

  it('should detect anomaly when duration exceeds threshold', async () => {
    const monitor = {
      durationMean: 1000, // 1 second average
      durationM2: 5000000, // Corresponds to ~100ms stddev with 50 samples
      durationMedian: 1000,
      durationMin: 800,
      durationMax: 1200,
      durationCount: 50,
    };

    // Test with very high duration (5x normal)
    const result = await detectDurationAnomaly(monitor, 5000);

    expect(result.isAnomaly).toBe(true);
    expect(result.type).toBe('duration');
  });

  it('should not detect anomaly for normal duration', async () => {
    const monitor = {
      durationMean: 1000,
      durationM2: 5000000,
      durationMedian: 1000,
      durationMin: 800,
      durationMax: 1200,
      durationCount: 50,
    };

    // Duration within normal range
    const result = await detectDurationAnomaly(monitor, 1100);

    expect(result.isAnomaly).toBe(false);
  });

  it('should handle edge case with sufficient data', async () => {
    const monitor = {
      durationMean: 1000,
      durationM2: 5000, // Small variance
      durationMedian: 1000,
      durationMin: 950,
      durationMax: 1050,
      durationCount: 20,
    };

    // Significantly higher duration should be detected
    const result = await detectDurationAnomaly(monitor, 3000);

    expect(result.isAnomaly).toBe(true);
  });
});

