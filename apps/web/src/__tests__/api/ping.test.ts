import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { prisma } from '@tokiflow/db';
import { rateLimit } from '@/lib/rate-limit';

// Mock dependencies
jest.mock('@tokiflow/db', () => ({
  prisma: {
    monitor: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    run: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    incident: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/rate-limit');
jest.mock('@/lib/schedule', () => ({
  calculateNextDueAt: jest.fn(() => new Date(Date.now() + 3600000)),
}));
jest.mock('@/lib/s3', () => ({
  uploadOutput: jest.fn(() => Promise.resolve('output-key-123')),
  redactOutput: jest.fn((output) => output),
  truncateOutput: jest.fn((output) => output),
}));
jest.mock('@/lib/analytics/welford', () => ({
  updateWelfordStats: jest.fn(() => ({
    count: 1,
    mean: 1000,
    m2: 0,
    min: 1000,
    max: 1000,
  })),
}));
jest.mock('@/lib/analytics/anomaly', () => ({
  checkForAnomalies: jest.fn(() => false),
}));

const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>;

describe('/api/ping/[token] - Core Monitoring Endpoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimit.mockReturnValue({
      allowed: true,
      limit: 60,
      remaining: 59,
      resetAt: Date.now() + 60000,
    });
  });

  describe('Rate Limiting', () => {
    it('should return 429 when rate limit exceeded', async () => {
      mockRateLimit.mockReturnValue({
        allowed: false,
        limit: 60,
        remaining: 0,
        resetAt: Date.now() + 30000,
      });

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token');
      const response = await GET(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(response.status).toBe(429);
      const data = await response.json();
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.limit).toBe(60);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('60');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
    });

    it('should enforce 60 requests per minute limit', async () => {
      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token');
      await GET(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(mockRateLimit).toHaveBeenCalledWith('test-token', 60, 60000);
    });
  });

  describe('Monitor Validation', () => {
    it('should return 404 when monitor not found', async () => {
      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue(null);

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/invalid-token');
      const response = await GET(request, { params: Promise.resolve({ token: 'invalid-token' }) });

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('Monitor not found');
    });

    it('should return 403 when monitor is disabled', async () => {
      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue({
        id: 'mon-1',
        token: 'test-token',
        status: 'DISABLED',
        Org: { SubscriptionPlan: null },
      });

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token');
      const response = await GET(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Monitor is disabled');
    });
  });

  describe('Success State', () => {
    it('should record successful ping with default state', async () => {
      const mockMonitor = {
        id: 'mon-1',
        token: 'test-token',
        status: 'OK',
        captureOutput: false,
        durationCount: 0,
        Org: { SubscriptionPlan: { plan: 'PRO' } },
      };

      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue(mockMonitor);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.run.create as jest.Mock).mockResolvedValue({ id: 'run-1' });
      (prisma.monitor.update as jest.Mock).mockResolvedValue(mockMonitor);

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token');
      const response = await GET(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('success');

      // Verify run was created
      expect(prisma.run.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            monitorId: 'mon-1',
            outcome: 'SUCCESS',
          }),
        })
      );
    });

    it('should handle explicit success state with duration', async () => {
      const mockMonitor = {
        id: 'mon-1',
        token: 'test-token',
        status: 'OK',
        captureOutput: false,
        durationCount: 5,
        durationMean: 1000,
        durationM2: 100,
        durationMin: 500,
        durationMax: 1500,
        Org: { SubscriptionPlan: null },
      };

      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue(mockMonitor);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.run.create as jest.Mock).mockResolvedValue({ id: 'run-1' });
      (prisma.monitor.update as jest.Mock).mockResolvedValue(mockMonitor);

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token?state=success&durationMs=1200');
      const response = await GET(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe('success');

      // Verify duration was recorded
      expect(prisma.run.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            durationMs: 1200,
          }),
        })
      );
    });

    it('should handle exit code parameter', async () => {
      const mockMonitor = {
        id: 'mon-1',
        status: 'OK',
        captureOutput: false,
        durationCount: 0,
        Org: { SubscriptionPlan: null },
      };

      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue(mockMonitor);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.run.create as jest.Mock).mockResolvedValue({ id: 'run-1' });
      (prisma.monitor.update as jest.Mock).mockResolvedValue(mockMonitor);

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token?state=success&exitCode=0');
      const response = await GET(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(response.status).toBe(200);
      expect(prisma.run.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            exitCode: 0,
          }),
        })
      );
    });
  });

  describe('Fail State', () => {
    it('should record failed ping', async () => {
      const mockMonitor = {
        id: 'mon-1',
        status: 'OK',
        captureOutput: false,
        durationCount: 0,
        Org: { SubscriptionPlan: null },
      };

      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue(mockMonitor);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.run.create as jest.Mock).mockResolvedValue({ id: 'run-1' });
      (prisma.incident.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.incident.create as jest.Mock).mockResolvedValue({ id: 'inc-1' });
      (prisma.monitor.update as jest.Mock).mockResolvedValue(mockMonitor);

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token?state=fail&exitCode=1');
      const response = await GET(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(response.status).toBe(200);

      // Verify incident was created
      expect(prisma.incident.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            monitorId: 'mon-1',
            kind: 'FAIL',
          }),
        })
      );
    });
  });

  describe('Start State', () => {
    it('should create STARTED run', async () => {
      const mockMonitor = {
        id: 'mon-1',
        status: 'OK',
        captureOutput: false,
        Org: { SubscriptionPlan: null },
      };

      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue(mockMonitor);
      (prisma.run.create as jest.Mock).mockResolvedValue({ id: 'run-1' });

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token?state=start');
      const response = await GET(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(response.status).toBe(200);
      expect(prisma.run.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            outcome: 'STARTED',
          }),
        })
      );
    });
  });

  describe('Output Capture', () => {
    it('should capture output when enabled (POST)', async () => {
      const mockMonitor = {
        id: 'mon-1',
        status: 'OK',
        captureOutput: true,
        captureLimitKb: 32,
        durationCount: 0,
        Org: { SubscriptionPlan: null },
      };

      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue(mockMonitor);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.run.create as jest.Mock).mockResolvedValue({ id: 'run-1' });
      (prisma.monitor.update as jest.Mock).mockResolvedValue(mockMonitor);

      const { uploadOutput } = await import('@/lib/s3');

      const { POST } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'Job completed successfully\nProcessed 100 records',
      });
      const response = await POST(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(response.status).toBe(200);
      expect(uploadOutput).toHaveBeenCalled();
    });

    it('should not capture output when disabled', async () => {
      const mockMonitor = {
        id: 'mon-1',
        status: 'OK',
        captureOutput: false,
        durationCount: 0,
        Org: { SubscriptionPlan: null },
      };

      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue(mockMonitor);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.run.create as jest.Mock).mockResolvedValue({ id: 'run-1' });
      (prisma.monitor.update as jest.Mock).mockResolvedValue(mockMonitor);

      const { uploadOutput } = await import('@/lib/s3');

      const { POST } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token', {
        method: 'POST',
        headers: { 'content-type': 'text/plain' },
        body: 'Output should be ignored',
      });
      await POST(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(uploadOutput).not.toHaveBeenCalled();
    });
  });

  describe('Monitor Status Updates', () => {
    it('should update monitor status to OK after successful ping', async () => {
      const mockMonitor = {
        id: 'mon-1',
        status: 'FAILING',
        captureOutput: false,
        durationCount: 0,
        Org: { SubscriptionPlan: null },
      };

      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue(mockMonitor);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.run.create as jest.Mock).mockResolvedValue({ id: 'run-1' });
      (prisma.monitor.update as jest.Mock).mockResolvedValue({ ...mockMonitor, status: 'OK' });

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token?state=success');
      await GET(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(prisma.monitor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'mon-1' },
          data: expect.objectContaining({
            status: 'OK',
          }),
        })
      );
    });

    it('should update monitor status to FAILING after failed ping', async () => {
      const mockMonitor = {
        id: 'mon-1',
        status: 'OK',
        captureOutput: false,
        durationCount: 0,
        Org: { SubscriptionPlan: null },
      };

      (prisma.monitor.findUnique as jest.Mock).mockResolvedValue(mockMonitor);
      (prisma.run.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.run.create as jest.Mock).mockResolvedValue({ id: 'run-1' });
      (prisma.incident.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.incident.create as jest.Mock).mockResolvedValue({ id: 'inc-1' });
      (prisma.monitor.update as jest.Mock).mockResolvedValue({ ...mockMonitor, status: 'FAILING' });

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token?state=fail');
      await GET(request, { params: Promise.resolve({ token: 'test-token' }) });

      expect(prisma.monitor.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'FAILING',
          }),
        })
      );
    });
  });
});

