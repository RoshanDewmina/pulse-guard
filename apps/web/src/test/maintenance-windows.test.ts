import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getMaintenanceWindows, POST as createMaintenanceWindow } from '@/app/api/maintenance-windows/route';
import { GET as getMaintenanceWindow, PATCH as updateMaintenanceWindow, DELETE as deleteMaintenanceWindow } from '@/app/api/maintenance-windows/[id]/route';
import { GET as checkMaintenanceWindow } from '@/app/api/maintenance-windows/check/route';
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

describe('Maintenance Windows API Endpoints', () => {
  let testOrgId: string;
  let testMonitorId: string;
  let testMaintenanceWindowId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.maintenanceWindow.deleteMany({
      where: { name: { contains: 'Test Maintenance' } },
    });
    await prisma.monitor.deleteMany({
      where: { name: { contains: 'Test Monitor' } },
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
        name: 'Test Monitor',
        token: 'test-token',
        scheduleType: 'INTERVAL',
        intervalSec: 300,
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

    // Create test maintenance window
    const maintenanceWindow = await prisma.maintenanceWindow.create({
      data: {
        id: 'test-maintenance-window-id',
        orgId: testOrgId,
        name: 'Test Maintenance Window',
        description: 'Test maintenance window for testing',
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        endAt: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
        isActive: true,
      },
    });
    testMaintenanceWindowId = maintenanceWindow.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.maintenanceWindow.deleteMany({
      where: { name: { contains: 'Test Maintenance' } },
    });
    await prisma.monitor.deleteMany({
      where: { name: { contains: 'Test Monitor' } },
    });
    await prisma.org.deleteMany({
      where: { name: 'Test Org' },
    });
  });

  describe('GET /api/maintenance-windows', () => {
    it('should get all maintenance windows for organization', async () => {
      const request = new NextRequest('http://localhost:3000/api/maintenance-windows?orgId=test-org-id');

      const response = await getMaintenanceWindows(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('startAt');
      expect(data[0]).toHaveProperty('endAt');
    });

    it('should filter maintenance windows by monitor', async () => {
      const request = new NextRequest(`http://localhost:3000/api/maintenance-windows?orgId=test-org-id&monitorId=${testMonitorId}`);

      const response = await getMaintenanceWindows(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('POST /api/maintenance-windows', () => {
    it('should create a new maintenance window', async () => {
      const startTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Day after tomorrow
      const endTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000); // Day after tomorrow + 2 hours

      const request = new NextRequest('http://localhost:3000/api/maintenance-windows', {
        method: 'POST',
        body: JSON.stringify({
          orgId: testOrgId,
          name: 'New Test Maintenance Window',
          description: 'A new test maintenance window',
          startAt: startTime.toISOString(),
          endAt: endTime.toISOString(),
        }),
      });

      const response = await createMaintenanceWindow(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('New Test Maintenance Window');
      expect(data.description).toBe('A new test maintenance window');
      expect(data.isActive).toBe(true);
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/maintenance-windows', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
        }),
      });

      const response = await createMaintenanceWindow(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Required fields missing');
    });

    it('should validate date range', async () => {
      const startTime = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const endTime = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // End before start

      const request = new NextRequest('http://localhost:3000/api/maintenance-windows', {
        method: 'POST',
        body: JSON.stringify({
          orgId: testOrgId,
          name: 'Invalid Date Range Maintenance Window',
          startAt: startTime.toISOString(),
          endAt: endTime.toISOString(),
        }),
      });

      const response = await createMaintenanceWindow(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('End time must be after start time');
    });
  });

  describe('GET /api/maintenance-windows/[id]', () => {
    it('should get a specific maintenance window', async () => {
      const request = new NextRequest(`http://localhost:3000/api/maintenance-windows/${testMaintenanceWindowId}`);

      const response = await getMaintenanceWindow(request, { params: Promise.resolve({ id: testMaintenanceWindowId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe(testMaintenanceWindowId);
      expect(data.name).toBe('Test Maintenance Window');
    });

    it('should return 404 for non-existent maintenance window', async () => {
      const request = new NextRequest('http://localhost:3000/api/maintenance-windows/non-existent-id');

      const response = await getMaintenanceWindow(request, { params: Promise.resolve({ id: 'non-existent-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Maintenance window not found');
    });
  });

  describe('PATCH /api/maintenance-windows/[id]', () => {
    it('should update a maintenance window', async () => {
      const newEndTime = new Date(Date.now() + 26 * 60 * 60 * 1000); // Tomorrow + 2 hours

      const request = new NextRequest(`http://localhost:3000/api/maintenance-windows/${testMaintenanceWindowId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Test Maintenance Window',
          endAt: newEndTime.toISOString(),
        }),
      });

      const response = await updateMaintenanceWindow(request, { params: Promise.resolve({ id: testMaintenanceWindowId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.name).toBe('Updated Test Maintenance Window');
    });
  });

  describe('DELETE /api/maintenance-windows/[id]', () => {
    it('should delete a maintenance window', async () => {
      const request = new NextRequest(`http://localhost:3000/api/maintenance-windows/${testMaintenanceWindowId}`, {
        method: 'DELETE',
      });

      const response = await deleteMaintenanceWindow(request, { params: Promise.resolve({ id: testMaintenanceWindowId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify it's deleted
      const deletedWindow = await prisma.maintenanceWindow.findUnique({
        where: { id: testMaintenanceWindowId },
      });
      expect(deletedWindow).toBeNull();
    });
  });

  describe('GET /api/maintenance-windows/check', () => {
    it('should check if monitor is in maintenance window', async () => {
      const request = new NextRequest(`http://localhost:3000/api/maintenance-windows/check?monitorId=${testMonitorId}`);

      const response = await checkMaintenanceWindow(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('inMaintenance');
      expect(data).toHaveProperty('maintenanceWindows');
      expect(Array.isArray(data.maintenanceWindows)).toBe(true);
    });

    it('should return false for monitor not in maintenance', async () => {
      // Create a maintenance window in the past
      await prisma.maintenanceWindow.create({
        data: {
          id: 'past-maintenance-window-id',
          orgId: testOrgId,
          name: 'Past Maintenance Window',
          startAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          endAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
          isActive: true,
        },
      });

      const request = new NextRequest(`http://localhost:3000/api/maintenance-windows/check?monitorId=${testMonitorId}`);

      const response = await checkMaintenanceWindow(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.inMaintenance).toBe(false);
    });
  });
});
