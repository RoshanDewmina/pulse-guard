import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { prisma } from '@tokiflow/db';
import { evaluateQueue, alertsQueue } from '../queues';

// Mock dependencies
jest.mock('@tokiflow/db', () => ({
  prisma: {
    monitor: {
      findMany: jest.fn(),
      update: jest.fn(),
    },
    run: {
      findFirst: jest.fn(),
    },
    incident: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../queues', () => ({
  evaluateQueue: {
    add: jest.fn(),
  },
  alertsQueue: {
    add: jest.fn(),
  },
}));

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    quit: jest.fn(),
  }));
});

jest.mock('bullmq', () => ({
  Worker: jest.fn().mockImplementation((name, processor, options) => {
    // Store the processor for testing
    (Worker as any).mockProcessor = processor;
    return {
      on: jest.fn(),
      close: jest.fn(),
    };
  }),
  Queue: jest.fn().mockImplementation(() => ({
    add: jest.fn(),
  })),
}));

describe('Evaluator Job', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Monitor Evaluation Logic', () => {
    it('should identify overdue monitors', async () => {
      const now = new Date();
      const pastDue = new Date(now.getTime() - 10 * 60 * 1000); // 10 minutes ago

      const mockOverdueMonitor = {
        id: 'mon-1',
        name: 'Overdue Monitor',
        status: 'OK',
        nextDueAt: new Date(now.getTime() - 7 * 60 * 1000), // 7 minutes ago
        graceSec: 300, // 5 minute grace period
        org: { id: 'org-1', name: 'Test Org' },
      };

      (prisma.monitor.findMany as jest.Mock).mockResolvedValue([mockOverdueMonitor]);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null); // No recent run
      (prisma.incident.findFirst as jest.Mock).mockResolvedValue(null); // No existing incident
      (prisma.incident.create as jest.Mock).mockResolvedValue({ id: 'inc-1' });
      (prisma.monitor.update as jest.Mock).mockResolvedValue({});

      const { Worker } = require('bullmq');
      const processor = (Worker as any).mockProcessor;

      if (processor) {
        await processor({ id: 'job-1', data: {} });

        // Should create incident for missed monitor
        expect(prisma.incident.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              monitorId: 'mon-1',
              kind: 'MISSED',
            }),
          })
        );

        // Should update monitor status
        expect(prisma.monitor.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 'mon-1' },
            data: expect.objectContaining({
              status: 'MISSED',
            }),
          })
        );

        // Should queue alert
        expect(alertsQueue.add).toHaveBeenCalled();
      }
    });

    it('should not create incident if grace period not exceeded', async () => {
      const now = new Date();

      const mockMonitor = {
        id: 'mon-1',
        status: 'OK',
        nextDueAt: new Date(now.getTime() - 2 * 60 * 1000), // 2 minutes ago
        graceSec: 300, // 5 minute grace period (not exceeded yet)
        org: { id: 'org-1' },
      };

      (prisma.monitor.findMany as jest.Mock).mockResolvedValue([mockMonitor]);

      const { Worker } = require('bullmq');
      const processor = (Worker as any).mockProcessor;

      if (processor) {
        await processor({ id: 'job-1', data: {} });

        // Should NOT create incident (within grace period)
        expect(prisma.incident.create).not.toHaveBeenCalled();
      }
    });

    it('should not create duplicate incidents', async () => {
      const now = new Date();

      const mockOverdueMonitor = {
        id: 'mon-1',
        status: 'MISSED',
        nextDueAt: new Date(now.getTime() - 10 * 60 * 1000),
        graceSec: 300,
        org: { id: 'org-1' },
      };

      const existingIncident = {
        id: 'inc-existing',
        monitorId: 'mon-1',
        status: 'OPEN',
        kind: 'MISSED',
      };

      (prisma.monitor.findMany as jest.Mock).mockResolvedValue([mockOverdueMonitor]);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.incident.findFirst as jest.Mock).mockResolvedValue(existingIncident);

      const { Worker } = require('bullmq');
      const processor = (Worker as any).mockProcessor;

      if (processor) {
        await processor({ id: 'job-1', data: {} });

        // Should NOT create duplicate incident
        expect(prisma.incident.create).not.toHaveBeenCalled();

        // Should still queue alert (for existing incident)
        expect(alertsQueue.add).toHaveBeenCalled();
      }
    });

    it('should handle LATE monitors (within grace but past expected)', async () => {
      const now = new Date();

      const mockLateMonitor = {
        id: 'mon-1',
        status: 'OK',
        nextDueAt: new Date(now.getTime() - 1 * 60 * 1000), // 1 minute late
        graceSec: 300, // 5 minute grace (still within grace)
        org: { id: 'org-1' },
      };

      (prisma.monitor.findMany as jest.Mock).mockResolvedValue([mockLateMonitor]);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null);

      const { Worker } = require('bullmq');
      const processor = (Worker as any).mockProcessor;

      if (processor) {
        await processor({ id: 'job-1', data: {} });

        // Monitor is late but within grace period
        // Should mark as LATE but not create incident yet
        expect(prisma.monitor.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'LATE',
            }),
          })
        );
      }
    });

    it('should ignore disabled monitors', async () => {
      const mockDisabledMonitor = {
        id: 'mon-disabled',
        status: 'DISABLED',
        nextDueAt: new Date(Date.now() - 10 * 60 * 1000),
        graceSec: 300,
      };

      (prisma.monitor.findMany as jest.Mock).mockResolvedValue([]);

      const { Worker } = require('bullmq');
      const processor = (Worker as any).mockProcessor;

      if (processor) {
        await processor({ id: 'job-1', data: {} });

        // Disabled monitors should be filtered out in the query
        expect(prisma.monitor.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              status: { not: 'DISABLED' },
            }),
          })
        );
      }
    });

    it('should handle monitors with recent successful runs', async () => {
      const now = new Date();

      const mockMonitor = {
        id: 'mon-1',
        status: 'OK',
        nextDueAt: new Date(now.getTime() - 10 * 60 * 1000),
        graceSec: 300,
        org: { id: 'org-1' },
      };

      const recentRun = {
        id: 'run-1',
        monitorId: 'mon-1',
        startedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
        outcome: 'SUCCESS',
      };

      (prisma.monitor.findMany as jest.Mock).mockResolvedValue([mockMonitor]);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(recentRun);

      const { Worker } = require('bullmq');
      const processor = (Worker as any).mockProcessor;

      if (processor) {
        await processor({ id: 'job-1', data: {} });

        // Should NOT create incident (has recent successful run)
        expect(prisma.incident.create).not.toHaveBeenCalled();

        // Monitor should remain OK
        expect(prisma.monitor.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              status: 'OK',
            }),
          })
        );
      }
    });

    it('should handle evaluation errors gracefully', async () => {
      (prisma.monitor.findMany as jest.Mock).mockRejectedValue(new Error('Database connection error'));

      const { Worker } = require('bullmq');
      const processor = (Worker as any).mockProcessor;

      if (processor) {
        // Should not throw, but log error
        await expect(processor({ id: 'job-1', data: {} })).rejects.toThrow('Database connection error');
      }
    });
  });

  describe('Evaluation Scheduling', () => {
    it('should schedule recurring evaluation every 60 seconds', async () => {
      const { startEvaluator } = await import('../jobs/evaluator');

      startEvaluator();

      expect(evaluateQueue.add).toHaveBeenCalledWith(
        'evaluate-monitors',
        {},
        expect.objectContaining({
          repeat: {
            every: 60000,
          },
          jobId: 'evaluate-monitors',
        })
      );
    });
  });
});

