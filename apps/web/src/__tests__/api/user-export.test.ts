import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@tokiflow/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    monitor: {
      findMany: jest.fn(),
    },
    run: {
      findMany: jest.fn(),
    },
    incident: {
      findMany: jest.fn(),
    },
    alertChannel: {
      findMany: jest.fn(),
    },
    rule: {
      findMany: jest.fn(),
    },
    membership: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    account: {
      deleteMany: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/user/export - GET (Data Export)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { GET } = await import('@/app/api/user/export/route');
    const request = new NextRequest('http://localhost:3000/api/user/export');
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('should export complete user data when authenticated', async () => {
    const mockUser = {
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      image: 'https://example.com/avatar.png',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      Account: [
        {
          provider: 'google',
          providerId: '12345',
          createdAt: new Date('2024-01-01'),
        },
      ],
      Membership: [
        {
          role: 'OWNER',
          createdAt: new Date('2024-01-01'),
          Org: {
            id: 'org-1',
            name: 'Test Organization',
            createdAt: new Date('2024-01-01'),
          },
        },
      ],
    };

    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.monitor.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'mon-1',
        name: 'Test Monitor',
        scheduleType: 'CRON',
        cronExpr: '0 * * * *',
        createdAt: new Date(),
      },
    ]);
    (prisma.run.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.incident.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.alertChannel.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.rule.findMany as jest.Mock).mockResolvedValue([]);

    const { GET } = await import('@/app/api/user/export/route');
    const request = new NextRequest('http://localhost:3000/api/user/export');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data.user).toBeDefined();
    expect(data.user.id).toBe('user-1');
    expect(data.user.email).toBe('test@example.com');
    expect(data.accounts).toHaveLength(1);
    expect(data.memberships).toHaveLength(1);
    expect(data.monitors).toHaveLength(1);
    expect(data.exportMetadata).toBeDefined();
    expect(data.exportMetadata.exportedBy).toBe('test@example.com');
  });
});

describe('/api/user/export - DELETE (Account Deletion)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { DELETE } = await import('@/app/api/user/export/route');
    const request = new NextRequest('http://localhost:3000/api/user/export?confirm=DELETE_MY_ACCOUNT');
    const response = await DELETE(request);

    expect(response.status).toBe(401);
  });

  it('should return 400 if confirmation is missing', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    const { DELETE } = await import('@/app/api/user/export/route');
    const request = new NextRequest('http://localhost:3000/api/user/export');
    const response = await DELETE(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Confirmation required');
  });

  it('should prevent deletion if user is sole owner', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    (prisma.membership.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'mem-1',
        userId: 'user-1',
        role: 'OWNER',
        Org: {
          id: 'org-1',
          name: 'Test Organization',
          Membership: [{ role: 'OWNER' }], // Only one owner
        },
      },
    ]);

    const { DELETE } = await import('@/app/api/user/export/route');
    const request = new NextRequest('http://localhost:3000/api/user/export?confirm=DELETE_MY_ACCOUNT');
    const response = await DELETE(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe('Cannot delete account');
    expect(data.message).toContain('sole owner');
  });

  it('should successfully delete account if not sole owner', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    (prisma.membership.findMany as jest.Mock).mockResolvedValue([]);
    (prisma.membership.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.account.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.user.delete as jest.Mock).mockResolvedValue({});

    const { DELETE } = await import('@/app/api/user/export/route');
    const request = new NextRequest('http://localhost:3000/api/user/export?confirm=DELETE_MY_ACCOUNT');
    const response = await DELETE(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.message).toContain('successfully deleted');

    // Verify deletion calls
    expect(prisma.membership.deleteMany).toHaveBeenCalled();
    expect(prisma.account.deleteMany).toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });
});



