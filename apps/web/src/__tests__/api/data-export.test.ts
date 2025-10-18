/**
 * @jest-environment node
 */

import { POST as handleDataExportRequest } from '@/app/api/user/export/route';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('@tokiflow/db', () => ({
  prisma: {
    dataExport: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('@/lib/queues', () => ({
  dataExportQueue: {
    add: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
  AuditAction: {
    USER_DATA_EXPORTED: 'user.data_exported',
  },
}));

describe('Data Export API', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/user/export', () => {
    it('should reject unauthenticated requests', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/user/export', {
        method: 'POST',
      });

      const response = await handleDataExportRequest(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should enforce rate limit (1 export per 24 hours)', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      // Mock recent export within 24 hours
      const recentExport = {
        id: 'export-123',
        userId: 'user-123',
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      };
      (prisma.dataExport.findFirst as jest.Mock).mockResolvedValue(recentExport);

      const request = new NextRequest('http://localhost:3000/api/user/export', {
        method: 'POST',
      });

      const response = await handleDataExportRequest(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
      expect(data.message).toContain('24 hours');
    });

    it('should create data export and queue background job', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);
      (prisma.dataExport.findFirst as jest.Mock).mockResolvedValue(null);

      const mockDataExport = {
        id: 'export-456',
        userId: 'user-123',
        status: 'PENDING',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      (prisma.dataExport.create as jest.Mock).mockResolvedValue(mockDataExport);
      (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
        orgId: 'org-123',
        userId: 'user-123',
      });

      const request = new NextRequest('http://localhost:3000/api/user/export', {
        method: 'POST',
      });

      const response = await handleDataExportRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.export).toBeDefined();
      expect(data.export.id).toBe('export-456');
      expect(data.export.status).toBe('PENDING');

      // Verify export was created
      expect(prisma.dataExport.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          status: 'PENDING',
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should allow export after 24 hours have passed', async () => {
      (getServerSession as jest.Mock).mockResolvedValue(mockSession);

      // Mock old export (more than 24 hours ago)
      const oldExport = {
        id: 'export-old',
        userId: 'user-123',
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25 hours ago
      };
      (prisma.dataExport.findFirst as jest.Mock).mockResolvedValue(null); // No recent exports

      const mockDataExport = {
        id: 'export-new',
        userId: 'user-123',
        status: 'PENDING',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
      (prisma.dataExport.create as jest.Mock).mockResolvedValue(mockDataExport);
      (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
        orgId: 'org-123',
        userId: 'user-123',
      });

      const request = new NextRequest('http://localhost:3000/api/user/export', {
        method: 'POST',
      });

      const response = await handleDataExportRequest(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
});

