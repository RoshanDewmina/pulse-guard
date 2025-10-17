import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';
import crypto from 'crypto';

// Mock dependencies
jest.mock('next-auth');
jest.mock('@tokiflow/db', () => ({
  prisma: {
    membership: {
      findFirst: jest.fn(),
    },
    apiKey: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

describe('/api/api-keys - GET (List API Keys)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { GET } = await import('@/app/api/api-keys/route');
    const request = new NextRequest('http://localhost:3000/api/api-keys');
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it('should list API keys for organization', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
      orgId: 'org-1',
      Org: { name: 'Test Org' },
    });

    (prisma.apiKey.findMany as jest.Mock).mockResolvedValue([
      {
        id: 'key-1',
        name: 'Production API',
        tokenHash: 'abcd1234567890',
        lastUsedAt: new Date('2024-10-01'),
        createdAt: new Date('2024-01-01'),
        User: { name: 'Test User', email: 'test@example.com' },
      },
    ]);

    const { GET } = await import('@/app/api/api-keys/route');
    const request = new NextRequest('http://localhost:3000/api/api-keys');
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.apiKeys).toHaveLength(1);
    expect(data.apiKeys[0].keyPreview).toBe('abcd****');
    expect(data.apiKeys[0].name).toBe('Production API');
  });
});

describe('/api/api-keys - POST (Create API Key)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock crypto for consistent key generation in tests
    jest.spyOn(crypto, 'randomBytes').mockImplementation((size: number) => {
      return Buffer.from('0'.repeat(size * 2), 'hex');
    });
  });

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { POST } = await import('@/app/api/api-keys/route');
    const request = new NextRequest('http://localhost:3000/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Key' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it('should return 404 if user is not owner/admin', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    (prisma.membership.findFirst as jest.Mock).mockResolvedValue(null);

    const { POST } = await import('@/app/api/api-keys/route');
    const request = new NextRequest('http://localhost:3000/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Key' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(404);
  });

  it('should return 429 if API key limit reached', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
      orgId: 'org-1',
      Org: { name: 'Test Org' },
    });

    (prisma.apiKey.count as jest.Mock).mockResolvedValue(20);

    const { POST } = await import('@/app/api/api-keys/route');
    const request = new NextRequest('http://localhost:3000/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Key' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error).toContain('Maximum number');
  });

  it('should create API key with hashed token', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    (prisma.membership.findFirst as jest.Mock).mockResolvedValue({
      orgId: 'org-1',
      Org: { name: 'Test Org' },
    });

    (prisma.apiKey.count as jest.Mock).mockResolvedValue(5);

    const mockCreatedKey = {
      id: 'pk_0000',
      name: 'Test Key',
      tokenHash: 'hashed-token',
      createdAt: new Date(),
      User: { name: 'Test User', email: 'test@example.com' },
    };

    (prisma.apiKey.create as jest.Mock).mockResolvedValue(mockCreatedKey);

    const { POST } = await import('@/app/api/api-keys/route');
    const request = new NextRequest('http://localhost:3000/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test Key' }),
    });
    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.apiKey.key).toBeDefined();
    expect(data.apiKey.key).toMatch(/^pk_[a-f0-9]+_[a-f0-9]+$/);
    expect(data.message).toContain('cannot be retrieved again');

    // Verify key was hashed before storage
    const createCall = (prisma.apiKey.create as jest.Mock).mock.calls[0][0];
    expect(createCall.data.tokenHash).toBeDefined();
    expect(createCall.data.tokenHash).not.toContain('pk_');
  });
});

describe('/api/api-keys/[id] - DELETE (Revoke API Key)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if not authenticated', async () => {
    mockGetServerSession.mockResolvedValue(null);

    const { DELETE } = await import('@/app/api/api-keys/[id]/route');
    const request = new NextRequest('http://localhost:3000/api/api-keys/key-1');
    const response = await DELETE(request, { params: Promise.resolve({ id: 'key-1' }) });

    expect(response.status).toBe(401);
  });

  it('should return 404 if API key not found', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue(null);

    const { DELETE } = await import('@/app/api/api-keys/[id]/route');
    const request = new NextRequest('http://localhost:3000/api/api-keys/key-1');
    const response = await DELETE(request, { params: Promise.resolve({ id: 'key-1' }) });

    expect(response.status).toBe(404);
  });

  it('should return 403 if user lacks permission', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'key-1',
      Org: {
        Membership: [], // User not in org
      },
    });

    const { DELETE } = await import('@/app/api/api-keys/[id]/route');
    const request = new NextRequest('http://localhost:3000/api/api-keys/key-1');
    const response = await DELETE(request, { params: Promise.resolve({ id: 'key-1' }) });

    expect(response.status).toBe(403);
  });

  it('should successfully revoke API key', async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    } as any);

    (prisma.apiKey.findUnique as jest.Mock).mockResolvedValue({
      id: 'key-1',
      Org: {
        Membership: [{ userId: 'user-1', role: 'OWNER' }],
      },
    });

    (prisma.apiKey.delete as jest.Mock).mockResolvedValue({});

    const { DELETE } = await import('@/app/api/api-keys/[id]/route');
    const request = new NextRequest('http://localhost:3000/api/api-keys/key-1');
    const response = await DELETE(request, { params: Promise.resolve({ id: 'key-1' }) });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.keyId).toBe('key-1');
    expect(prisma.apiKey.delete).toHaveBeenCalledWith({
      where: { id: 'key-1' },
    });
  });
});



