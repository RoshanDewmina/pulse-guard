import { describe, it, expect } from 'vitest';
import {
  updateWelfordStats,
  getWelfordStats,
  calculateZScore,
  isOutlier,
  calculateMedian,
  calculatePercentile,
  type WelfordUpdateInput,
} from '../welford';

describe('Welford algorithm', () => {
  describe('updateWelfordStats', () => {
    it('should handle first value correctly', () => {
      const input: WelfordUpdateInput = {
        count: 0,
        mean: null,
        m2: null,
        min: null,
        max: null,
        newValue: 10,
      };

      const result = updateWelfordStats(input);

      expect(result.count).toBe(1);
      expect(result.mean).toBe(10);
      expect(result.m2).toBe(0);
      expect(result.variance).toBeNull();
      expect(result.stddev).toBeNull();
      expect(result.min).toBe(10);
      expect(result.max).toBe(10);
    });

    it('should update statistics correctly with multiple values', () => {
      const values = [10, 20, 30, 40, 50];
      let stats = {
        count: 0,
        mean: null,
        m2: null,
        min: null,
        max: null,
      };

      // Process each value
      for (const value of values) {
        const input: WelfordUpdateInput = {
          ...stats,
          newValue: value,
        };
        stats = updateWelfordStats(input);
      }

      expect(stats.count).toBe(5);
      expect(stats.mean).toBe(30); // (10+20+30+40+50)/5
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
      expect(stats.variance).toBeCloseTo(200, 1); // Population variance
      expect(stats.stddev).toBeCloseTo(14.14, 1);
    });

    it('should match traditional calculation for known dataset', () => {
      // Known dataset: [1, 2, 3, 4, 5]
      // Mean: 3, Variance: 2, StdDev: ~1.414
      const values = [1, 2, 3, 4, 5];
      let stats = {
        count: 0,
        mean: null,
        m2: null,
        min: null,
        max: null,
      };

      for (const value of values) {
        const input: WelfordUpdateInput = {
          ...stats,
          newValue: value,
        };
        stats = updateWelfordStats(input);
      }

      expect(stats.count).toBe(5);
      expect(stats.mean).toBe(3);
      expect(stats.variance).toBeCloseTo(2, 1);
      expect(stats.stddev).toBeCloseTo(1.414, 2);
    });

    it('should handle negative values correctly', () => {
      const values = [-5, -3, -1, 1, 3, 5];
      let stats = {
        count: 0,
        mean: null,
        m2: null,
        min: null,
        max: null,
      };

      for (const value of values) {
        const input: WelfordUpdateInput = {
          ...stats,
          newValue: value,
        };
        stats = updateWelfordStats(input);
      }

      expect(stats.count).toBe(6);
      expect(stats.mean).toBe(0);
      expect(stats.min).toBe(-5);
      expect(stats.max).toBe(5);
      expect(stats.variance).toBeCloseTo(11.67, 1);
    });

    it('should handle decimal values correctly', () => {
      const values = [1.5, 2.5, 3.5, 4.5, 5.5];
      let stats = {
        count: 0,
        mean: null,
        m2: null,
        min: null,
        max: null,
      };

      for (const value of values) {
        const input: WelfordUpdateInput = {
          ...stats,
          newValue: value,
        };
        stats = updateWelfordStats(input);
      }

      expect(stats.count).toBe(5);
      expect(stats.mean).toBe(3.5);
      expect(stats.min).toBe(1.5);
      expect(stats.max).toBe(5.5);
    });
  });

  describe('getWelfordStats', () => {
    it('should calculate stats from stored values', () => {
      const stats = getWelfordStats(5, 30, 200, 10, 50);

      expect(stats.count).toBe(5);
      expect(stats.mean).toBe(30);
      expect(stats.m2).toBe(200);
      expect(stats.variance).toBe(40); // 200/5
      expect(stats.stddev).toBeCloseTo(6.32, 1); // sqrt(40)
      expect(stats.min).toBe(10);
      expect(stats.max).toBe(50);
    });

    it('should handle single value case', () => {
      const stats = getWelfordStats(1, 10, 0, 10, 10);

      expect(stats.count).toBe(1);
      expect(stats.mean).toBe(10);
      expect(stats.variance).toBeNull();
      expect(stats.stddev).toBeNull();
    });

    it('should handle null values', () => {
      const stats = getWelfordStats(0, null, null, null, null);

      expect(stats.count).toBe(0);
      expect(stats.mean).toBeNull();
      expect(stats.m2).toBeNull();
      expect(stats.variance).toBeNull();
      expect(stats.stddev).toBeNull();
      expect(stats.min).toBeNull();
      expect(stats.max).toBeNull();
    });
  });

  describe('calculateZScore', () => {
    it('should calculate z-score correctly', () => {
      expect(calculateZScore(10, 5, 2)).toBe(2.5); // (10-5)/2
      expect(calculateZScore(5, 10, 2)).toBe(-2.5); // (5-10)/2
      expect(calculateZScore(10, 10, 2)).toBe(0); // (10-10)/2
    });

    it('should return null for zero standard deviation', () => {
      expect(calculateZScore(10, 5, 0)).toBeNull();
    });

    it('should return null for NaN standard deviation', () => {
      expect(calculateZScore(10, 5, NaN)).toBeNull();
    });

    it('should handle negative z-scores', () => {
      expect(calculateZScore(1, 5, 2)).toBe(-2); // (1-5)/2
    });
  });

  describe('isOutlier', () => {
    it('should identify outliers correctly', () => {
      expect(isOutlier(10, 5, 1, 3)).toBe(true); // z-score = 5 > 3
      expect(isOutlier(8, 5, 1, 3)).toBe(true); // z-score = 3 = 3 (threshold)
      expect(isOutlier(7, 5, 1, 3)).toBe(false); // z-score = 2 < 3
      expect(isOutlier(5, 5, 1, 3)).toBe(false); // z-score = 0 < 3
    });

    it('should use default threshold of 3.0', () => {
      expect(isOutlier(10, 5, 1)).toBe(true); // z-score = 5 > 3
      expect(isOutlier(8, 5, 1)).toBe(true); // z-score = 3 = 3
      expect(isOutlier(7, 5, 1)).toBe(false); // z-score = 2 < 3
    });

    it('should return false for zero standard deviation', () => {
      expect(isOutlier(10, 5, 0)).toBe(false);
    });

    it('should handle custom thresholds', () => {
      expect(isOutlier(8, 5, 1, 2)).toBe(true); // z-score = 3 > 2
      expect(isOutlier(8, 5, 1, 4)).toBe(false); // z-score = 3 < 4
    });
  });

  describe('calculateMedian', () => {
    it('should calculate median for odd number of values', () => {
      expect(calculateMedian([1, 2, 3, 4, 5])).toBe(3);
      expect(calculateMedian([5, 1, 3, 2, 4])).toBe(3); // unsorted
    });

    it('should calculate median for even number of values', () => {
      expect(calculateMedian([1, 2, 3, 4])).toBe(2.5);
      expect(calculateMedian([4, 1, 3, 2])).toBe(2.5); // unsorted
    });

    it('should handle single value', () => {
      expect(calculateMedian([42])).toBe(42);
    });

    it('should return null for empty array', () => {
      expect(calculateMedian([])).toBeNull();
    });

    it('should handle duplicate values', () => {
      expect(calculateMedian([1, 1, 2, 2, 3])).toBe(2);
      expect(calculateMedian([1, 1, 2, 2])).toBe(1.5);
    });

    it('should handle negative values', () => {
      expect(calculateMedian([-5, -3, -1, 1, 3])).toBe(-1);
      expect(calculateMedian([-3, -1, 1, 3])).toBe(0);
    });
  });

  describe('calculatePercentile', () => {
    it('should calculate percentiles correctly', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      
      expect(calculatePercentile(values, 0)).toBe(1); // Min
      expect(calculatePercentile(values, 50)).toBe(5.5); // Median
      expect(calculatePercentile(values, 100)).toBe(10); // Max
    });

    it('should handle quartiles', () => {
      const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      
      expect(calculatePercentile(values, 25)).toBeCloseTo(3.75, 1); // Q1
      expect(calculatePercentile(values, 50)).toBe(6.5); // Q2 (median)
      expect(calculatePercentile(values, 75)).toBeCloseTo(9.25, 1); // Q3
    });

    it('should handle single value', () => {
      expect(calculatePercentile([42], 50)).toBe(42);
    });

    it('should return null for empty array', () => {
      expect(calculatePercentile([], 50)).toBeNull();
    });

    it('should throw error for invalid percentiles', () => {
      expect(() => calculatePercentile([1, 2, 3], -1)).toThrow('Percentile must be between 0 and 100');
      expect(() => calculatePercentile([1, 2, 3], 101)).toThrow('Percentile must be between 0 and 100');
    });

    it('should handle unsorted arrays', () => {
      const values = [5, 1, 9, 3, 7];
      expect(calculatePercentile(values, 50)).toBe(5); // Should sort internally
    });
  });

  describe('integration tests', () => {
    it('should maintain accuracy over many updates', () => {
      // Simulate 1000 random values and compare with traditional calculation
      const values: number[] = [];
      let stats = {
        count: 0,
        mean: null,
        m2: null,
        min: null,
        max: null,
      };

      // Generate random values between 0 and 100
      for (let i = 0; i < 1000; i++) {
        const value = Math.random() * 100;
        values.push(value);
        
        const input: WelfordUpdateInput = {
          ...stats,
          newValue: value,
        };
        stats = updateWelfordStats(input);
      }

      // Calculate traditional mean and variance
      const traditionalMean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const traditionalVariance = values.reduce((sum, val) => sum + Math.pow(val - traditionalMean, 2), 0) / values.length;

      expect(stats.count).toBe(1000);
      expect(stats.mean).toBeCloseTo(traditionalMean, 5);
      expect(stats.variance).toBeCloseTo(traditionalVariance, 5);
      expect(stats.min).toBe(Math.min(...values));
      expect(stats.max).toBe(Math.max(...values));
    });

    it('should handle real-world duration data', () => {
      // Simulate job duration data (in milliseconds)
      const durations = [
        1200, 1180, 1220, 1190, 1210, // Normal range
        1205, 1195, 1208, 1202, 1198, // More normal
        1500, // Slightly high
        1200, 1190, 1210, 1205, 1195, // Back to normal
        2000, // Anomaly!
      ];

      let stats = {
        count: 0,
        mean: null,
        m2: null,
        min: null,
        max: null,
      };

      for (const duration of durations) {
        const input: WelfordUpdateInput = {
          ...stats,
          newValue: duration,
        };
        stats = updateWelfordStats(input);
      }

      expect(stats.count).toBe(durations.length);
      expect(stats.mean).toBeCloseTo(1230, 0); // Should be around 1230ms
      expect(stats.stddev).toBeCloseTo(200, 50); // Should have some variance
      expect(stats.min).toBe(1180);
      expect(stats.max).toBe(2000);

      // Test anomaly detection
      const lastDuration = durations[durations.length - 1]; // 2000ms
      const zScore = calculateZScore(lastDuration, stats.mean!, stats.stddev!);
      expect(zScore).toBeGreaterThan(3); // Should be an outlier
      expect(isOutlier(lastDuration, stats.mean!, stats.stddev!)).toBe(true);
    });
  });
});
