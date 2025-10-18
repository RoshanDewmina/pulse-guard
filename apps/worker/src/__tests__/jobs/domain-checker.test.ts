import { describe, it, expect, beforeEach, mock } from 'bun:test';
import type { Job } from 'bullmq';

// Mock the whois-checker module
const mockCheckDomainExpiration = mock(() => Promise.resolve({
  domain: 'example.com',
  registrar: 'Test Registrar',
  expiresAt: new Date('2025-12-31'),
  daysUntilExpiry: 60,
  autoRenew: true,
  nameservers: ['ns1.example.com', 'ns2.example.com'],
  status: ['clientTransferProhibited'],
}));

mock.module('../../lib/whois-checker', () => ({
  checkDomainExpiration: mockCheckDomainExpiration,
  needsDomainAlert: (days: number, thresholds: number[], lastAlertDays?: number) => {
    if (lastAlertDays === undefined) {
      return thresholds.some(t => days <= t);
    }
    const relevantThresholds = thresholds.filter(t => t >= days);
    const highestCrossed = relevantThresholds.length > 0 ? Math.max(...relevantThresholds) : null;
    return highestCrossed !== null && highestCrossed < lastAlertDays;
  },
}));

// Mock Prisma
const mockPrismaUpdate = mock(() => Promise.resolve({}));
const mockPrismaUpsert = mock(() => Promise.resolve({}));
const mockPrismaCreate = mock(() => Promise.resolve({}));
const mockPrismaFindMany = mock(() => Promise.resolve([]));

mock.module('@tokiflow/db', () => ({
  prisma: {
    domainExpiration: {
      upsert: mockPrismaUpsert,
      findMany: mockPrismaFindMany,
    },
    incident: {
      create: mockPrismaCreate,
    },
    monitor: {
      findMany: mockPrismaFindMany,
      findFirst: mock(() => Promise.resolve({
        id: 'test-monitor-id',
        url: 'https://example.com',
        name: 'Test Monitor',
        checkDomain: true,
        domainAlertThresholds: [60, 30, 14],
        orgId: 'test-org-id',
      })),
    },
  },
}));

// Mock logger
mock.module('../../lib/logger', () => ({
  logger: {
    info: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
  },
}));

// Import after mocking
const { processDomainCheckJob } = await import('../../jobs/domain-checker');

describe('Domain Checker Worker', () => {
  beforeEach(() => {
    mockCheckDomainExpiration.mockClear();
    mockPrismaUpsert.mockClear();
    mockPrismaCreate.mockClear();
    mockPrismaFindMany.mockClear();
  });

  describe('processDomainCheckJob', () => {
    it('should check domain and update database', async () => {
      const mockJob = {
        data: { monitorId: 'test-monitor-id' },
      } as Job;

      await processDomainCheckJob(mockJob);

      expect(mockCheckDomainExpiration).toHaveBeenCalledWith('example.com');
      expect(mockPrismaUpsert).toHaveBeenCalled();
    });

    it('should create incident when domain is expiring soon', async () => {
      // Mock domain expiring in 29 days (crosses 30-day threshold)
      mockCheckDomainExpiration.mockResolvedValueOnce({
        domain: 'example.com',
        registrar: 'Test Registrar',
        expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 29,
        autoRenew: false,
        nameservers: ['ns1.example.com'],
        status: ['ok'],
      });

      // Mock previous check (last alerted at 60 days)
      mockPrismaFindMany.mockResolvedValueOnce([
        {
          daysUntilExpiry: 60,
          lastAlertDays: 60,
        },
      ]);

      const mockJob = {
        data: { monitorId: 'test-monitor-id' },
      } as Job;

      await processDomainCheckJob(mockJob);

      expect(mockPrismaCreate).toHaveBeenCalled();
    });

    it('should not create duplicate incidents for same threshold', async () => {
      // Mock domain at 29 days
      mockCheckDomainExpiration.mockResolvedValueOnce({
        domain: 'example.com',
        registrar: 'Test Registrar',
        expiresAt: new Date(Date.now() + 29 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: 29,
        autoRenew: false,
        nameservers: [],
        status: [],
      });

      // Mock previous check already alerted at 29 days
      mockPrismaFindMany.mockResolvedValueOnce([
        {
          daysUntilExpiry: 29,
          lastAlertDays: 30,
        },
      ]);

      const mockJob = {
        data: { monitorId: 'test-monitor-id' },
      } as Job;

      await processDomainCheckJob(mockJob);

      // Should not create incident
      expect(mockPrismaCreate).not.toHaveBeenCalled();
    });

    it('should handle domain that has already expired', async () => {
      // Mock expired domain
      mockCheckDomainExpiration.mockResolvedValueOnce({
        domain: 'example.com',
        registrar: 'Test Registrar',
        expiresAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        daysUntilExpiry: -5,
        autoRenew: false,
        nameservers: [],
        status: [],
      });

      mockPrismaFindMany.mockResolvedValueOnce([]);

      const mockJob = {
        data: { monitorId: 'test-monitor-id' },
      } as Job;

      await processDomainCheckJob(mockJob);

      expect(mockPrismaUpsert).toHaveBeenCalled();
      expect(mockPrismaCreate).toHaveBeenCalled();
    });

    it('should handle WHOIS check errors gracefully', async () => {
      mockCheckDomainExpiration.mockRejectedValueOnce(new Error('WHOIS lookup failed'));

      const mockJob = {
        data: { monitorId: 'test-monitor-id' },
      } as Job;

      // Should not throw
      await processDomainCheckJob(mockJob);

      // Should still try to update database with error
      expect(mockPrismaUpsert).toHaveBeenCalled();
    });

    it('should handle monitors with domain checking disabled', async () => {
      // Mock monitor with checkDomain = false
      const { prisma } = await import('@tokiflow/db');
      const mockFindFirst = prisma.monitor.findFirst as any;
      mockFindFirst.mockResolvedValueOnce({
        id: 'test-monitor-id',
        url: 'https://example.com',
        name: 'Test Monitor',
        checkDomain: false,
        domainAlertThresholds: [60, 30, 14],
        orgId: 'test-org-id',
      });

      const mockJob = {
        data: { monitorId: 'test-monitor-id' },
      } as Job;

      await processDomainCheckJob(mockJob);

      // Should not check domain
      expect(mockCheckDomainExpiration).not.toHaveBeenCalled();
    });
  });
});

