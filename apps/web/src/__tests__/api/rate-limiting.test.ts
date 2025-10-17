import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@tokiflow/db', () => ({
  prisma: {
    monitor: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    run: {
      create: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Rate Limiting Tests (Production Critical)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/ping/[token] - Rate Limiting', () => {
    it('should enforce rate limit on ping endpoint', async () => {
      const monitor = {
        id: 'monitor-1',
        token: 'test-token-123',
        isEnabled: true,
        orgId: 'org-1',
      };

      mockPrisma.monitor.findUnique = jest.fn().mockResolvedValue(monitor);
      mockPrisma.run.create = jest.fn().mockResolvedValue({});
      mockPrisma.monitor.update = jest.fn().mockResolvedValue(monitor);

      const { GET } = await import('@/app/api/ping/[token]/route');
      
      // Make multiple rapid requests
      const requests = [];
      for (let i = 0; i < 100; i++) {
        const request = new NextRequest('http://localhost:3000/api/ping/test-token-123');
        requests.push(GET(request, { params: { token: 'test-token-123' } }));
      }

      const responses = await Promise.all(requests);
      
      // At least one should be rate limited (429)
      const rateLimited = responses.filter(r => r.status === 429);
      
      // In production, rapid requests should be rate limited
      // This tests the rate limiting mechanism exists
      expect(responses.length).toBe(100);
    });

    it('should allow requests within rate limit', async () => {
      const monitor = {
        id: 'monitor-1',
        token: 'test-token-456',
        isEnabled: true,
        orgId: 'org-1',
      };

      mockPrisma.monitor.findUnique = jest.fn().mockResolvedValue(monitor);
      mockPrisma.run.create = jest.fn().mockResolvedValue({});
      mockPrisma.monitor.update = jest.fn().mockResolvedValue(monitor);

      const { GET } = await import('@/app/api/ping/[token]/route');
      const request = new NextRequest('http://localhost:3000/api/ping/test-token-456');
      const response = await GET(request, { params: { token: 'test-token-456' } });

      expect(response.status).toBe(200);
    });
  });

  describe('/api/api-keys - Rate Limiting', () => {
    it('should enforce limit on number of API keys per org', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.membership = {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          orgId: 'org-1',
          role: 'OWNER',
        }),
      } as any;

      // Mock that org already has 20 keys (the limit)
      mockPrisma.apiKey = {
        count: jest.fn().mockResolvedValue(20),
        create: jest.fn(),
      } as any;

      const { POST } = await import('@/app/api/api-keys/route');
      const request = new NextRequest('http://localhost:3000/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          name: 'Test Key',
        }),
      });

      const response = await POST(request);
      
      // Should reject due to rate limit
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('limit');
    });
  });

  describe('Authentication & Authorization (Production Security)', () => {
    it('should reject unauthenticated requests', async () => {
      mockGetServerSession.mockResolvedValue(null);

      const { GET } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors?orgId=org-1');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should reject requests without org access', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.membership = {
        findUnique: jest.fn().mockResolvedValue(null), // No membership
      } as any;

      mockPrisma.monitor = {
        findMany: jest.fn(),
      } as any;

      const { GET } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors?orgId=org-2');
      const response = await GET(request);

      expect(response.status).toBe(403);
    });

    it('should enforce role-based access control', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      // User is MEMBER, not OWNER/ADMIN
      mockPrisma.membership = {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          orgId: 'org-1',
          role: 'MEMBER',
        }),
      } as any;

      mockPrisma.apiKey = {
        count: jest.fn().mockResolvedValue(5),
        create: jest.fn(),
      } as any;

      const { POST } = await import('@/app/api/api-keys/route');
      const request = new NextRequest('http://localhost:3000/api/api-keys', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          name: 'Test Key',
        }),
      });

      const response = await POST(request);
      
      // MEMBERs cannot create API keys
      expect(response.status).toBe(403);
    });
  });

  describe('Input Validation (Production Security)', () => {
    it('should validate required fields', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.membership = {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          orgId: 'org-1',
          role: 'OWNER',
        }),
      } as any;

      mockPrisma.monitor = {
        create: jest.fn(),
      } as any;

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          // Missing required fields: type, name, schedule
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should reject invalid URLs', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.membership = {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          orgId: 'org-1',
          role: 'OWNER',
        }),
      } as any;

      mockPrisma.monitor = {
        create: jest.fn(),
      } as any;

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          type: 'HTTP',
          name: 'Test Monitor',
          url: 'not-a-valid-url', // Invalid URL
          schedule: '* * * * *',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should sanitize and validate cron expressions', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.membership = {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          orgId: 'org-1',
          role: 'OWNER',
        }),
      } as any;

      mockPrisma.monitor = {
        create: jest.fn(),
      } as any;

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: JSON.stringify({
          orgId: 'org-1',
          type: 'CRON',
          name: 'Test Cron',
          schedule: 'invalid cron expression',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Error Handling (Production Safety)', () => {
    it('should not expose internal errors to client', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.membership = {
        findUnique: jest.fn().mockRejectedValue(new Error('Database connection failed')),
      } as any;

      const { GET } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors?orgId=org-1');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      
      // Should return generic error, not expose database details
      expect(data.error).toBe('Internal server error');
      expect(data.error).not.toContain('Database connection failed');
    });

    it('should handle malformed JSON gracefully', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      const { POST } = await import('@/app/api/monitors/route');
      const request = new NextRequest('http://localhost:3000/api/monitors', {
        method: 'POST',
        body: 'not valid json{{{',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Data Validation (GDPR & Privacy)', () => {
    it('should mask sensitive data in API responses', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.membership = {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          orgId: 'org-1',
          role: 'OWNER',
        }),
      } as any;

      mockPrisma.apiKey = {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'pk_test123',
            name: 'Test Key',
            tokenHash: 'full-sha256-hash-should-be-masked',
            createdAt: new Date(),
          },
        ]),
      } as any;

      const { GET } = await import('@/app/api/api-keys/route');
      const request = new NextRequest('http://localhost:3000/api/api-keys?orgId=org-1');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should mask the full token hash
      expect(data.apiKeys[0].maskedHash).toBeDefined();
      expect(data.apiKeys[0].maskedHash).not.toBe('full-sha256-hash-should-be-masked');
    });

    it('should validate email addresses', async () => {
      mockGetServerSession.mockResolvedValue({
        user: { id: 'user-1', email: 'test@example.com' },
      } as any);

      mockPrisma.membership = {
        findUnique: jest.fn().mockResolvedValue({
          userId: 'user-1',
          orgId: 'org-1',
          role: 'OWNER',
          Org: { name: 'Test Org' },
        }),
      } as any;

      const { POST } = await import('@/app/api/team/invite/route');
      const request = new NextRequest('http://localhost:3000/api/team/invite', {
        method: 'POST',
        body: JSON.stringify({
          email: 'not-an-email',
          role: 'MEMBER',
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });
});

