import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../tags/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@tokiflow/db', () => ({
  prisma: {
    membership: {
      findFirst: vi.fn(),
    },
    tag: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';

describe('Tags API endpoints', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  };

  const mockMembership = {
    orgId: 'org-123',
    userId: 'user-123',
    role: 'ADMIN',
    Org: {
      id: 'org-123',
      name: 'Test Org',
    },
  };

  const mockTag = {
    id: 'tag-123',
    orgId: 'org-123',
    name: 'production',
    createdAt: new Date('2023-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as any).mockResolvedValue(mockSession);
  });

  describe('GET /api/tags', () => {
    it('should return tags for organization', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue(mockMembership);
      (prisma.tag.findMany as any).mockResolvedValue([mockTag]);

      const request = new NextRequest('http://localhost:3000/api/tags?orgId=org-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual([mockTag]);
      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: { orgId: 'org-123' },
        orderBy: { name: 'asc' },
      });
    });

    it('should return error if orgId not provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/tags');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('orgId is required');
    });

    it('should return error if user not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tags?orgId=org-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return error if user not member of organization', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tags?orgId=org-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Organization not found');
    });

    it('should handle database errors', async () => {
      (prisma.membership.findFirst as any).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/tags?orgId=org-123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('POST /api/tags', () => {
    it('should create new tag successfully', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue(mockMembership);
      (prisma.tag.findUnique as any).mockResolvedValue(null);
      (prisma.tag.create as any).mockResolvedValue(mockTag);

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'production' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toEqual(mockTag);
      expect(prisma.tag.create).toHaveBeenCalledWith({
        data: {
          orgId: 'org-123',
          name: 'production',
        },
      });
    });

    it('should return error if tag already exists', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue(mockMembership);
      (prisma.tag.findUnique as any).mockResolvedValue(mockTag);

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'production' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Tag already exists');
    });

    it('should return error if user not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'production' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('should return error if no organization found', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'production' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('No organization found');
    });

    it('should return error for invalid input', async () => {
      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: '' }), // Empty name
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should return error for name too long', async () => {
      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'a'.repeat(51) }), // Too long
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should handle database errors', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue(mockMembership);
      (prisma.tag.findUnique as any).mockResolvedValue(null);
      (prisma.tag.create as any).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'production' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in tag names', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue(mockMembership);
      (prisma.tag.findUnique as any).mockResolvedValue(null);
      (prisma.tag.create as any).mockResolvedValue({
        ...mockTag,
        name: 'test-tag_123',
      });

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'test-tag_123' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('test-tag_123');
    });

    it('should handle case sensitivity in tag names', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue(mockMembership);
      (prisma.tag.findUnique as any).mockResolvedValue(null);
      (prisma.tag.create as any).mockResolvedValue({
        ...mockTag,
        name: 'Production',
      });

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: 'Production' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('Production');
    });

    it('should handle unicode characters in tag names', async () => {
      (prisma.membership.findFirst as any).mockResolvedValue(mockMembership);
      (prisma.tag.findUnique as any).mockResolvedValue(null);
      (prisma.tag.create as any).mockResolvedValue({
        ...mockTag,
        name: '测试标签',
      });

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({ name: '测试标签' }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('测试标签');
    });
  });
});
