import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { GET } from '@/app/api/health/route';
import { NextRequest } from 'next/server';
import { prisma } from '@tokiflow/db';
import { redis } from '@/lib/redis';

/**
 * Integration Test: Health Check Endpoint
 * 
 * Tests the /api/health endpoint which validates:
 * - Database connectivity
 * - Redis connectivity
 * - Email service configuration
 * 
 * This is a basic smoke test to verify the API is responding.
 */

// Mock database and redis for testing
jest.mock('@tokiflow/db', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock('@/lib/redis', () => ({
  redis: {
    ping: jest.fn(),
  },
}));

describe('Health Check Integration', () => {
  beforeAll(() => {
    // Mock successful database and redis checks
    (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ result: 1 }]);
    (redis.ping as jest.Mock).mockResolvedValue('PONG');
  });
  describe('GET /api/health', () => {
    it('should return healthy status', async () => {
      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET();
      
      expect(response.status).toBe(200);
      const body = await response.json();
      
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('timestamp');
      expect(body).toHaveProperty('checks');
      expect(body.checks).toHaveProperty('database');
      expect(body.checks).toHaveProperty('redis');
      expect(body.checks).toHaveProperty('email');
    });

    it('should have healthy database', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.checks.database.status).toBe('healthy');
      expect(body.checks.database.latency).toBeGreaterThanOrEqual(0);
    });

    it('should have healthy redis', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.checks.redis.status).toBe('healthy');
      expect(body.checks.redis.latency).toBeGreaterThanOrEqual(0);
    });

    it('should have email service configured', async () => {
      const response = await GET();
      const body = await response.json();

      expect(body.checks.email.status).toBe('configured');
    });

    it('should include timestamp', async () => {
      const response = await GET();
      const body = await response.json();

      const timestamp = new Date(body.timestamp);
      expect(timestamp.getTime()).not.toBeNaN();
      expect(timestamp.getTime()).toBeLessThan(Date.now() + 1000); // Within 1 second
    });
  });
});

