import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma, generateToken } from '@tokiflow/db';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@tokiflow/db', () => ({
  prisma: {
    membership: {
      findUnique: jest.fn(),
    },
    monitor: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
  },
  generateToken: jest.fn(() => 'pg_mockedtoken123'),
}));
jest.mock('@/lib/schedule', () => ({
  calculateNextDueAt: jest.fn(() => new Date(Date.now() + 3600000)),
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/monitors - Monitor Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET - List Monitors', () => {
    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { GET } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors?orgId=org-1');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 400 if orgId is missing', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      const { GET } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toBe('orgId is required');
    });

    it('should return 403 if user lacks access to organization', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

      const { GET } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors?orgId=org-1');
      const response = await GET(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toBe('Access denied');
    });

    it('should list monitors for authorized user', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
        role: 'OWNER',
      });

      const mockMonitors = [
        {
          id: 'mon-1',
          name: 'API Health Check',
          scheduleType: 'INTERVAL',
          intervalSec: 300,
          status: 'OK',
          _count: { Run: 100, Incident: 0 },
        },
        {
          id: 'mon-2',
          name: 'Database Backup',
          scheduleType: 'CRON',
          cronExpr: '0 2 * * *',
          status: 'OK',
          _count: { Run: 30, Incident: 1 },
        },
      ];

      (prisma.monitor.findMany as jest.Mock).mockResolvedValue(mockMonitors);

      const { GET } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors?orgId=org-1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.monitors).toHaveLength(2);
      expect(data.monitors[0].name).toBe('API Health Check');
      expect(data.monitors[1].name).toBe('Database Backup');
    });

    it('should filter monitors by status', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      (prisma.monitor.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'mon-1',
          status: 'FAILING',
          _count: { Run: 10, Incident: 1 },
        },
      ]);

      const { GET } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors?orgId=org-1&status=FAILING');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prisma.monitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            orgId: 'org-1',
            status: 'FAILING',
          }),
        })
      );
    });

    it('should respect limit parameter', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      (prisma.monitor.findMany as jest.Mock).mockResolvedValue([]);

      const { GET } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors?orgId=org-1&limit=50');
      await GET(request);

      expect(prisma.monitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 50,
        })
      );
    });
  });

  describe('POST - Create Monitor', () => {
    beforeEach(() => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);
    });

    it('should return 401 if not authenticated', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Monitor' }),
      });
      const response = await POST(request);

      expect(response.status).toBe(401);
    });

    it('should return 403 if user lacks access', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue(null);

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          name: 'Test Monitor',
          scheduleType: 'INTERVAL',
          intervalSec: 300,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
    });

    it('should validate required fields', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          // Missing required fields
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it('should create INTERVAL monitor successfully', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      (prisma.monitor.count as jest.Mock).mockResolvedValue(3);

      const mockCreatedMonitor = {
        id: 'mon-new',
        token: 'pg_mockedtoken123',
        name: 'API Health Check',
        scheduleType: 'INTERVAL',
        intervalSec: 300,
        graceSec: 300,
        status: 'OK',
        captureOutput: false,
        tags: ['api', 'production'],
      };

      (prisma.monitor.create as jest.Mock).mockResolvedValue(mockCreatedMonitor);

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          name: 'API Health Check',
          scheduleType: 'INTERVAL',
          intervalSec: 300,
          graceSec: 300,
          tags: ['api', 'production'],
          captureOutput: false,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.monitor.name).toBe('API Health Check');
      expect(data.monitor.token).toBe('pg_mockedtoken123');
      expect(data.monitor.scheduleType).toBe('INTERVAL');

      // Verify monitor was created with correct data
      expect(prisma.monitor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: 'org-1',
            name: 'API Health Check',
            scheduleType: 'INTERVAL',
            intervalSec: 300,
            token: 'pg_mockedtoken123',
          }),
        })
      );
    });

    it('should create CRON monitor successfully', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      (prisma.monitor.count as jest.Mock).mockResolvedValue(2);

      const mockCreatedMonitor = {
        id: 'mon-cron',
        token: 'pg_crontoken456',
        name: 'Daily Backup',
        scheduleType: 'CRON',
        cronExpr: '0 2 * * *',
        timezone: 'America/New_York',
        graceSec: 600,
      };

      (prisma.monitor.create as jest.Mock).mockResolvedValue(mockCreatedMonitor);

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          name: 'Daily Backup',
          scheduleType: 'CRON',
          cronExpr: '0 2 * * *',
          timezone: 'America/New_York',
          graceSec: 600,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.monitor.name).toBe('Daily Backup');
      expect(data.monitor.scheduleType).toBe('CRON');
      expect(data.monitor.cronExpr).toBe('0 2 * * *');
    });

    it('should enforce monitor limit based on subscription', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
        Org: {
          SubscriptionPlan: {
            plan: 'FREE',
            monitorLimit: 5,
          },
        },
      });

      (prisma.monitor.count as jest.Mock).mockResolvedValue(5); // At limit

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          name: 'Over Limit Monitor',
          scheduleType: 'INTERVAL',
          intervalSec: 300,
        }),
      });
      const response = await POST(request);

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('monitor limit');
    });

    it('should set default values correctly', async () => {
      (prisma.membership.findUnique as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        orgId: 'org-1',
      });

      (prisma.monitor.count as jest.Mock).mockResolvedValue(0);
      (prisma.monitor.create as jest.Mock).mockResolvedValue({
        id: 'mon-1',
        graceSec: 300, // Default
        timezone: 'UTC', // Default
        tags: [], // Default
        captureOutput: false, // Default
      });

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          name: 'Minimal Monitor',
          scheduleType: 'INTERVAL',
          intervalSec: 60,
        }),
      });
      await POST(request);

      expect(prisma.monitor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            graceSec: 300,
            timezone: 'UTC',
            tags: [],
            captureOutput: false,
          }),
        })
      );
    });
  });
});

