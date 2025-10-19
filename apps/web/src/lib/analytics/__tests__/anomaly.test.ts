import { describe, it, expect, vi, beforeEach } from 'vitest';
import { detectDurationAnomaly, detectOutputSizeAnomaly, createAnomalyIncident, checkForAnomalies } from '../anomaly';
import { prisma } from '@tokiflow/db';

// Mock Prisma
vi.mock('@tokiflow/db', () => ({
  prisma: {
    run: {
      findMany: vi.fn(),
    },
    incident: {
      findFirst: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    monitor: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock crypto
vi.mock('crypto', () => ({
  randomUUID: () => 'test-uuid-123',
}));

describe('anomaly detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('detectDurationAnomaly', () => {
    it('should return no anomaly for insufficient data', () => {
      const monitor = {
        durationCount: 5, // Less than 10
        durationMean: 1000,
        durationM2: 10000,
        durationMedian: 1000,
        durationMin: 800,
        durationMax: 1200,
      };

      const result = detectDurationAnomaly(monitor, 2000);
      
      expect(result.isAnomaly).toBe(false);
      expect(result.actual).toBe(2000);
    });

    it('should return no anomaly for normal duration', () => {
      const monitor = {
        durationCount: 20,
        durationMean: 1000,
        durationM2: 10000, // Variance = 10000/20 = 500, StdDev = ~22.36
        durationMedian: 1000,
        durationMin: 800,
        durationMax: 1200,
      };

      const result = detectDurationAnomaly(monitor, 1100); // Within normal range
      
      expect(result.isAnomaly).toBe(false);
      expect(result.actual).toBe(1100);
    });

    it('should detect critical anomaly (both z-score and median)', () => {
      const monitor = {
        durationCount: 20,
        durationMean: 1000,
        durationM2: 10000, // Variance = 500, StdDev = ~22.36
        durationMedian: 1000,
        durationMin: 800,
        durationMax: 1200,
      };

      const result = detectDurationAnomaly(monitor, 2000); // 2x median, high z-score
      
      expect(result.isAnomaly).toBe(true);
      expect(result.type).toBe('duration');
      expect(result.severity).toBe('critical');
      expect(result.actual).toBe(2000);
      expect(result.expected).toBe(1000);
      expect(result.zScore).toBeGreaterThan(3);
      expect(result.threshold).toBe(3.0);
      expect(result.message).toContain('2000ms');
    });

    it('should detect warning anomaly (z-score only)', () => {
      const monitor = {
        durationCount: 20,
        durationMean: 1000,
        durationM2: 10000, // Variance = 500, StdDev = ~22.36
        durationMedian: 1000,
        durationMin: 800,
        durationMax: 1200,
      };

      const result = detectDurationAnomaly(monitor, 1700); // High z-score but not 2x median
      
      expect(result.isAnomaly).toBe(true);
      expect(result.type).toBe('duration');
      expect(result.severity).toBe('warning');
      expect(result.actual).toBe(1700);
      expect(result.zScore).toBeGreaterThan(3);
    });

    it('should detect slow degradation anomaly', () => {
      const monitor = {
        durationCount: 20,
        durationMean: 1000,
        durationM2: 10000, // Variance = 500, StdDev = ~22.36
        durationMedian: 1000,
        durationMin: 800,
        durationMax: 1200,
      };

      const upperBound = 1000 + (3 * 22.36); // ~1670
      const result = detectDurationAnomaly(monitor, 1800); // Above upper bound
      
      expect(result.isAnomaly).toBe(true);
      expect(result.type).toBe('duration');
      expect(result.severity).toBe('warning');
      expect(result.actual).toBe(1800);
      expect(result.message).toContain('significantly higher than expected range');
    });

    it('should handle null statistics gracefully', () => {
      const monitor = {
        durationCount: 20,
        durationMean: null,
        durationM2: null,
        durationMedian: null,
        durationMin: null,
        durationMax: null,
      };

      const result = detectDurationAnomaly(monitor, 2000);
      
      expect(result.isAnomaly).toBe(false);
      expect(result.actual).toBe(2000);
    });

    it('should handle zero standard deviation', () => {
      const monitor = {
        durationCount: 20,
        durationMean: 1000,
        durationM2: 0, // Zero variance
        durationMedian: 1000,
        durationMin: 1000,
        durationMax: 1000,
      };

      const result = detectDurationAnomaly(monitor, 2000);
      
      // Should not detect anomaly due to zero stddev
      expect(result.isAnomaly).toBe(false);
    });
  });

  describe('detectOutputSizeAnomaly', () => {
    it('should return no anomaly for null size', async () => {
      const result = await detectOutputSizeAnomaly('monitor-1', null);
      
      expect(result.isAnomaly).toBe(false);
      expect(result.actual).toBe(0);
    });

    it('should return no anomaly for insufficient data', async () => {
      (prisma.run.findMany as any).mockResolvedValue([
        { sizeBytes: 1000 },
        { sizeBytes: 1100 },
      ]); // Only 2 runs

      const result = await detectOutputSizeAnomaly('monitor-1', 500);
      
      expect(result.isAnomaly).toBe(false);
      expect(result.actual).toBe(500);
    });

    it('should detect output size drop anomaly', async () => {
      (prisma.run.findMany as any).mockResolvedValue([
        { sizeBytes: 1000 },
        { sizeBytes: 1100 },
        { sizeBytes: 1200 },
        { sizeBytes: 1050 },
        { sizeBytes: 1150 },
        { sizeBytes: 1000 },
        { sizeBytes: 1100 },
      ]); // Average ~1100

      const result = await detectOutputSizeAnomaly('monitor-1', 200); // 80% drop
      
      expect(result.isAnomaly).toBe(true);
      expect(result.type).toBe('output_size');
      expect(result.severity).toBe('warning');
      expect(result.actual).toBe(200);
      expect(result.expected).toBeCloseTo(1100, 0);
      expect(result.message).toContain('dropped');
    });

    it('should not detect anomaly for normal size', async () => {
      (prisma.run.findMany as any).mockResolvedValue([
        { sizeBytes: 1000 },
        { sizeBytes: 1100 },
        { sizeBytes: 1200 },
        { sizeBytes: 1050 },
        { sizeBytes: 1150 },
        { sizeBytes: 1000 },
        { sizeBytes: 1100 },
      ]); // Average ~1100

      const result = await detectOutputSizeAnomaly('monitor-1', 1000); // Normal size
      
      expect(result.isAnomaly).toBe(false);
      expect(result.actual).toBe(1000);
    });

    it('should filter out zero sizes', async () => {
      (prisma.run.findMany as any).mockResolvedValue([
        { sizeBytes: 1000 },
        { sizeBytes: 0 }, // Should be filtered out
        { sizeBytes: 1100 },
        { sizeBytes: 0 }, // Should be filtered out
        { sizeBytes: 1200 },
        { sizeBytes: 1050 },
        { sizeBytes: 1150 },
      ]);

      const result = await detectOutputSizeAnomaly('monitor-1', 200);
      
      expect(result.isAnomaly).toBe(true);
      expect(result.actual).toBe(200);
    });
  });

  describe('createAnomalyIncident', () => {
    it('should create new incident when none exists', async () => {
      (prisma.incident.findFirst as any).mockResolvedValue(null);
      (prisma.incident.create as any).mockResolvedValue({ id: 'incident-1' });

      const anomaly = {
        isAnomaly: true,
        type: 'duration' as const,
        severity: 'critical' as const,
        expected: 1000,
        actual: 2000,
        zScore: 4.5,
        message: 'Test anomaly',
      };

      await createAnomalyIncident('monitor-1', 'run-1', anomaly);

      expect(prisma.incident.create).toHaveBeenCalledWith({
        data: {
          id: 'test-uuid-123',
          monitorId: 'monitor-1',
          kind: 'ANOMALY',
          summary: 'Test anomaly',
          details: expect.stringContaining('"type":"duration"'),
          dedupeHash: expect.stringContaining('anomaly-monitor-1-duration'),
        },
      });
    });

    it('should update existing incident when recent one exists', async () => {
      const existingIncident = { id: 'incident-1' };
      (prisma.incident.findFirst as any).mockResolvedValue(existingIncident);
      (prisma.incident.update as any).mockResolvedValue(existingIncident);

      const anomaly = {
        isAnomaly: true,
        type: 'duration' as const,
        severity: 'critical' as const,
        expected: 1000,
        actual: 2000,
        zScore: 4.5,
        message: 'Test anomaly',
      };

      await createAnomalyIncident('monitor-1', 'run-1', anomaly);

      expect(prisma.incident.update).toHaveBeenCalledWith({
        where: { id: 'incident-1' },
        data: {
          summary: 'Test anomaly',
          details: expect.stringContaining('"type":"duration"'),
        },
      });
    });
  });

  describe('checkForAnomalies', () => {
    it('should check both duration and output size anomalies', async () => {
      const monitor = {
        id: 'monitor-1',
        durationCount: 20,
        durationMean: 1000,
        durationM2: 10000,
        durationMedian: 1000,
        durationMin: 800,
        durationMax: 1200,
      };

      (prisma.monitor.findUnique as any).mockResolvedValue(monitor);
      (prisma.run.findMany as any).mockResolvedValue([
        { sizeBytes: 1000 },
        { sizeBytes: 1100 },
        { sizeBytes: 1200 },
        { sizeBytes: 1050 },
        { sizeBytes: 1150 },
        { sizeBytes: 1000 },
        { sizeBytes: 1100 },
      ]);
      (prisma.incident.findFirst as any).mockResolvedValue(null);
      (prisma.incident.create as any).mockResolvedValue({ id: 'incident-1' });

      await checkForAnomalies('monitor-1', 'run-1', 2000, 200);

      // Should create incidents for both duration and output size anomalies
      expect(prisma.incident.create).toHaveBeenCalledTimes(2);
    });

    it('should handle missing monitor gracefully', async () => {
      (prisma.monitor.findUnique as any).mockResolvedValue(null);

      await checkForAnomalies('monitor-1', 'run-1', 2000, 200);

      expect(prisma.incident.create).not.toHaveBeenCalled();
    });

    it('should skip null duration and size', async () => {
      const monitor = {
        id: 'monitor-1',
        durationCount: 20,
        durationMean: 1000,
        durationM2: 10000,
        durationMedian: 1000,
        durationMin: 800,
        durationMax: 1200,
      };

      (prisma.monitor.findUnique as any).mockResolvedValue(monitor);

      await checkForAnomalies('monitor-1', 'run-1', null, null);

      expect(prisma.incident.create).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle very high z-scores', () => {
      const monitor = {
        durationCount: 20,
        durationMean: 1000,
        durationM2: 100, // Very low variance, StdDev = ~2.24
        durationMedian: 1000,
        durationMin: 950,
        durationMax: 1050,
      };

      const result = detectDurationAnomaly(monitor, 2000); // Very high z-score
      
      expect(result.isAnomaly).toBe(true);
      expect(result.severity).toBe('critical');
      expect(result.zScore).toBeGreaterThan(10);
    });

    it('should handle very low durations', () => {
      const monitor = {
        durationCount: 20,
        durationMean: 1000,
        durationM2: 10000,
        durationMedian: 1000,
        durationMin: 800,
        durationMax: 1200,
      };

      const result = detectDurationAnomaly(monitor, 100); // Very low duration
      
      expect(result.isAnomaly).toBe(true);
      expect(result.zScore).toBeLessThan(-3);
    });

    it('should handle zero duration', () => {
      const monitor = {
        durationCount: 20,
        durationMean: 1000,
        durationM2: 10000,
        durationMedian: 1000,
        durationMin: 800,
        durationMax: 1200,
      };

      const result = detectDurationAnomaly(monitor, 0);
      
      expect(result.isAnomaly).toBe(true);
      expect(result.actual).toBe(0);
    });
  });
});
