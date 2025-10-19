import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getAuditLogs } from '@/app/api/audit-logs/route';
import { createAuditLog, getAuditLogs as getAuditLogsLib, AuditAction } from '@/lib/audit';
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

describe('Audit Logging API Endpoints', () => {
  let testOrgId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({
      where: { orgId: 'test-org-id' },
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

    // Create test user
    await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: new Date(),
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany({
      where: { orgId: 'test-org-id' },
    });
    await prisma.org.deleteMany({
      where: { name: 'Test Org' },
    });
  });

  describe('createAuditLog', () => {
    it('should create an audit log entry', async () => {
      const auditLog = await createAuditLog({
        action: AuditAction.USER_CREATED,
        orgId: testOrgId,
        userId: 'test-user-id',
        meta: { test: 'data' },
      });

      expect(auditLog).toHaveProperty('id');
      expect(auditLog.action).toBe(AuditAction.USER_CREATED);
      expect(auditLog.orgId).toBe(testOrgId);
      expect(auditLog.userId).toBe('test-user-id');
      expect(auditLog.meta).toEqual({ test: 'data' });
    });

    it('should create audit log with target ID', async () => {
      const auditLog = await createAuditLog({
        action: AuditAction.MONITOR_CREATED,
        orgId: testOrgId,
        userId: 'test-user-id',
        targetId: 'test-monitor-id',
        meta: { name: 'Test Monitor' },
      });

      expect(auditLog.targetId).toBe('test-monitor-id');
    });

    it('should handle system actions without user ID', async () => {
      const auditLog = await createAuditLog({
        action: AuditAction.SYSTEM_STARTUP,
        orgId: testOrgId,
        meta: { version: '1.0.0' },
      });

      expect(auditLog.userId).toBeNull();
      expect(auditLog.action).toBe(AuditAction.SYSTEM_STARTUP);
    });
  });

  describe('GET /api/audit-logs', () => {
    beforeEach(async () => {
      // Create test audit logs
      await createAuditLog({
        action: AuditAction.USER_CREATED,
        orgId: testOrgId,
        userId: 'test-user-id',
        meta: { email: 'test@example.com' },
      });

      await createAuditLog({
        action: AuditAction.MONITOR_CREATED,
        orgId: testOrgId,
        userId: 'test-user-id',
        targetId: 'monitor-1',
        meta: { name: 'Test Monitor 1' },
      });

      await createAuditLog({
        action: AuditAction.INCIDENT_CREATED,
        orgId: testOrgId,
        userId: 'test-user-id',
        targetId: 'incident-1',
        meta: { monitorId: 'monitor-1', severity: 'high' },
      });
    });

    it('should get all audit logs for organization', async () => {
      const request = new NextRequest(`http://localhost:3000/api/audit-logs?orgId=${testOrgId}`);

      const response = await getAuditLogs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('logs');
      expect(data).toHaveProperty('total');
      expect(data).toHaveProperty('limit');
      expect(data).toHaveProperty('offset');
      expect(data).toHaveProperty('hasMore');
      expect(Array.isArray(data.logs)).toBe(true);
      expect(data.logs.length).toBeGreaterThan(0);
    });

    it('should filter audit logs by action', async () => {
      const request = new NextRequest(`http://localhost:3000/api/audit-logs?orgId=${testOrgId}&action=${AuditAction.USER_CREATED}`);

      const response = await getAuditLogs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs.length).toBe(1);
      expect(data.logs[0].action).toBe(AuditAction.USER_CREATED);
    });

    it('should filter audit logs by user', async () => {
      const request = new NextRequest(`http://localhost:3000/api/audit-logs?orgId=${testOrgId}&userId=test-user-id`);

      const response = await getAuditLogs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs.length).toBe(3);
      expect(data.logs.every(log => log.userId === 'test-user-id')).toBe(true);
    });

    it('should filter audit logs by date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const request = new NextRequest(`http://localhost:3000/api/audit-logs?orgId=${testOrgId}&startDate=${startDate}&endDate=${endDate}`);

      const response = await getAuditLogs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs.length).toBe(3);
    });

    it('should support pagination', async () => {
      const request = new NextRequest(`http://localhost:3000/api/audit-logs?orgId=${testOrgId}&limit=2&offset=0`);

      const response = await getAuditLogs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.logs.length).toBe(2);
      expect(data.limit).toBe(2);
      expect(data.offset).toBe(0);
      expect(data.hasMore).toBe(true);
    });

    it('should export audit logs as CSV', async () => {
      const request = new NextRequest(`http://localhost:3000/api/audit-logs?orgId=${testOrgId}&format=csv`);

      const response = await getAuditLogs(request);
      const csvContent = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/csv');
      expect(csvContent).toContain('Timestamp,User,User Email,Action,Target ID,Metadata,Organization ID');
      expect(csvContent).toContain('USER_CREATED');
    });

    it('should export audit logs as JSON', async () => {
      const request = new NextRequest(`http://localhost:3000/api/audit-logs?orgId=${testOrgId}&format=json`);

      const response = await getAuditLogs(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      expect(data).toHaveProperty('logs');
      expect(Array.isArray(data.logs)).toBe(true);
    });
  });

  describe('getAuditLogs (library function)', () => {
    beforeEach(async () => {
      // Create test audit logs
      await createAuditLog({
        action: AuditAction.USER_CREATED,
        orgId: testOrgId,
        userId: 'test-user-id',
        meta: { email: 'test@example.com' },
      });

      await createAuditLog({
        action: AuditAction.MONITOR_CREATED,
        orgId: testOrgId,
        userId: 'test-user-id',
        targetId: 'monitor-1',
        meta: { name: 'Test Monitor 1' },
      });
    });

    it('should get audit logs with filters', async () => {
      const logs = await getAuditLogsLib({
        orgId: testOrgId,
        action: AuditAction.USER_CREATED,
        limit: 10,
        offset: 0,
      });

      expect(logs.length).toBe(1);
      expect(logs[0].action).toBe(AuditAction.USER_CREATED);
    });

    it('should get audit logs with date range', async () => {
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = new Date();

      const logs = await getAuditLogsLib({
        orgId: testOrgId,
        startDate,
        endDate,
        limit: 10,
        offset: 0,
      });

      expect(logs.length).toBe(2);
    });
  });
});
