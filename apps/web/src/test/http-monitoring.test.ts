import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { PATCH as updateHTTPConfig, GET as getHTTPConfig } from '@/app/api/monitors/[id]/http/route';
import { POST as testHTTP } from '@/app/api/monitors/[id]/http/test/route';
import { prisma } from '@tokiflow/db';

// Mock NextAuth
const mockSession = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
  },
};

jest.mock('next-auth', () => ({
  getServerSession: jest.fn(() => Promise.resolve(mockSession)),
}));

// Mock fetch for HTTP requests
global.fetch = jest.fn();

describe('HTTP Monitoring API Endpoints', () => {
  let testOrgId: string;
  let testMonitorId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.monitor.deleteMany({
      where: { name: { contains: 'Test HTTP Monitor' } },
    });
    await prisma.org.deleteMany({
      where: { name: 'Test Org' },
    });

    // Create test organization
    const org = await prisma.org.create({
      data: {
        id: 'test-org-id',
        name: 'Test Org',
        slug: 'test-org',
      },
    });
    testOrgId = org.id;

    // Create test monitor
    const monitor = await prisma.monitor.create({
      data: {
        id: 'test-monitor-id',
        orgId: testOrgId,
        name: 'Test HTTP Monitor',
        token: 'test-token',
        scheduleType: 'INTERVAL',
        intervalSec: 300,
        monitorType: 'HTTP_CHECK',
        httpMethod: 'GET',
        expectedStatusCode: 200,
      },
    });
    testMonitorId = monitor.id;

    // Create membership
    await prisma.membership.create({
      data: {
        id: 'test-membership-id',
        userId: 'test-user-id',
        orgId: testOrgId,
        role: 'ADMIN',
        updatedAt: new Date(),
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.monitor.deleteMany({
      where: { name: { contains: 'Test HTTP Monitor' } },
    });
    await prisma.org.deleteMany({
      where: { name: 'Test Org' },
    });
  });

  describe('PATCH /api/monitors/[id]/http', () => {
    it('should update HTTP monitoring configuration', async () => {
      const request = new NextRequest(`http://localhost:3000/api/monitors/${testMonitorId}/http`, {
        method: 'PATCH',
        body: JSON.stringify({
          httpMethod: 'POST',
          httpHeaders: { 'Content-Type': 'application/json' },
          httpBody: '{"test": "data"}',
          expectedStatusCode: 201,
          responseTimeSla: 5000,
          responseAssertions: [
            { type: 'status_code', expected: 201 },
            { type: 'response_time', max: 5000 },
          ],
        }),
      });

      const response = await updateHTTPConfig(request, { params: Promise.resolve({ id: testMonitorId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.httpMethod).toBe('POST');
      expect(data.httpHeaders).toEqual({ 'Content-Type': 'application/json' });
      expect(data.httpBody).toBe('{"test": "data"}');
      expect(data.expectedStatusCode).toBe(201);
      expect(data.responseTimeSla).toBe(5000);
    });

    it('should validate HTTP method', async () => {
      const request = new NextRequest(`http://localhost:3000/api/monitors/${testMonitorId}/http`, {
        method: 'PATCH',
        body: JSON.stringify({
          httpMethod: 'INVALID',
        }),
      });

      const response = await updateHTTPConfig(request, { params: Promise.resolve({ id: testMonitorId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid HTTP method');
    });

    it('should validate status code', async () => {
      const request = new NextRequest(`http://localhost:3000/api/monitors/${testMonitorId}/http`, {
        method: 'PATCH',
        body: JSON.stringify({
          expectedStatusCode: 999,
        }),
      });

      const response = await updateHTTPConfig(request, { params: Promise.resolve({ id: testMonitorId }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Status code must be between 100 and 599');
    });
  });

  describe('GET /api/monitors/[id]/http', () => {
    it('should get HTTP monitoring configuration', async () => {
      const request = new NextRequest(`http://localhost:3000/api/monitors/${testMonitorId}/http`);

      const response = await getHTTPConfig(request, { params: Promise.resolve({ id: testMonitorId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('httpMethod');
      expect(data).toHaveProperty('expectedStatusCode');
      expect(data.httpMethod).toBe('GET');
      expect(data.expectedStatusCode).toBe(200);
    });
  });

  describe('POST /api/monitors/[id]/http/test', () => {
    it('should test HTTP monitoring configuration', async () => {
      // Mock successful HTTP response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ success: true }),
        text: () => Promise.resolve('{"success": true}'),
      });

      const request = new NextRequest(`http://localhost:3000/api/monitors/${testMonitorId}/http/test`, {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://httpbin.org/status/200',
          method: 'GET',
          headers: { 'User-Agent': 'Test' },
          timeout: 10000,
        }),
      });

      const response = await testHTTP(request, { params: Promise.resolve({ id: testMonitorId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('responseTime');
      expect(data).toHaveProperty('statusCode');
      expect(data.statusCode).toBe(200);
    });

    it('should handle HTTP errors', async () => {
      // Mock failed HTTP response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Map(),
        json: () => Promise.resolve({ error: 'Not found' }),
        text: () => Promise.resolve('Not found'),
      });

      const request = new NextRequest(`http://localhost:3000/api/monitors/${testMonitorId}/http/test`, {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://httpbin.org/status/404',
          method: 'GET',
        }),
      });

      const response = await testHTTP(request, { params: Promise.resolve({ id: testMonitorId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.statusCode).toBe(404);
    });

    it('should handle network errors', async () => {
      // Mock network error
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const request = new NextRequest(`http://localhost:3000/api/monitors/${testMonitorId}/http/test`, {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://invalid-url.com',
          method: 'GET',
        }),
      });

      const response = await testHTTP(request, { params: Promise.resolve({ id: testMonitorId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Network error');
    });
  });
});
