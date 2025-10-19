import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getTags, POST as createTag } from '@/app/api/tags/route';
import { DELETE as deleteTag } from '@/app/api/tags/[id]/route';
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

describe('Tags API Endpoints', () => {
  let testOrgId: string;
  let testMonitorId: string;
  let testTagId: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.monitorTag.deleteMany({
      where: { tagId: { contains: 'test-tag' } },
    });
    await prisma.tag.deleteMany({
      where: { name: { contains: 'Test Tag' } },
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

    // Create test tag
    const tag = await prisma.tag.create({
      data: {
        id: 'test-tag-id',
        orgId: testOrgId,
        name: 'Test Tag',
      },
    });
    testTagId = tag.id;

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
    await prisma.monitorTag.deleteMany({
      where: { tagId: { contains: 'test-tag' } },
    });
    await prisma.tag.deleteMany({
      where: { name: { contains: 'Test Tag' } },
    });
    await prisma.monitor.deleteMany({
      where: { name: { contains: 'Test Monitor' } },
    });
    await prisma.org.deleteMany({
      where: { name: 'Test Org' },
    });
  });

  describe('GET /api/tags', () => {
    it('should get all tags for organization', async () => {
      const request = new NextRequest(`http://localhost:3000/api/tags?orgId=${testOrgId}`);

      const response = await getTags(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('id');
      expect(data[0]).toHaveProperty('name');
      expect(data[0]).toHaveProperty('orgId');
      expect(data[0].orgId).toBe(testOrgId);
    });

    it('should return empty array if no tags exist', async () => {
      // Delete the test tag
      await prisma.tag.delete({
        where: { id: testTagId },
      });

      const request = new NextRequest(`http://localhost:3000/api/tags?orgId=${testOrgId}`);

      const response = await getTags(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(0);
    });
  });

  describe('POST /api/tags', () => {
    it('should create a new tag', async () => {
      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'New Test Tag',
          orgId: testOrgId,
        }),
      });

      const response = await createTag(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty('id');
      expect(data.name).toBe('New Test Tag');
      expect(data.orgId).toBe(testOrgId);

      // Verify tag was created in database
      const createdTag = await prisma.tag.findUnique({
        where: { id: data.id },
      });
      expect(createdTag).not.toBeNull();
      expect(createdTag?.name).toBe('New Test Tag');
    });

    it('should validate required fields', async () => {
      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({
          // Missing name and orgId
        }),
      });

      const response = await createTag(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid input');
    });

    it('should validate tag name length', async () => {
      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'a'.repeat(101), // Too long
          orgId: testOrgId,
        }),
      });

      const response = await createTag(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Invalid input');
    });

    it('should prevent duplicate tag names within organization', async () => {
      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Tag', // Same as existing tag
          orgId: testOrgId,
        }),
      });

      const response = await createTag(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Tag with this name already exists');
    });

    it('should allow same tag name in different organizations', async () => {
      // Create another organization
      const anotherOrg = await prisma.org.create({
        data: {
          id: 'another-org-id',
          name: 'Another Org',
          slug: 'another-org',
        },
      });

      // Create membership for another org
      await prisma.membership.create({
        data: {
          id: 'another-membership-id',
          userId: 'test-user-id',
          orgId: anotherOrg.id,
          role: 'ADMIN',
          updatedAt: new Date(),
        },
      });

      const request = new NextRequest('http://localhost:3000/api/tags', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Tag', // Same name as existing tag in different org
          orgId: anotherOrg.id,
        }),
      });

      const response = await createTag(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.name).toBe('Test Tag');
      expect(data.orgId).toBe(anotherOrg.id);

      // Clean up
      await prisma.tag.deleteMany({
        where: { orgId: anotherOrg.id },
      });
      await prisma.org.delete({
        where: { id: anotherOrg.id },
      });
    });
  });

  describe('DELETE /api/tags/[id]', () => {
    it('should delete a tag', async () => {
      const request = new NextRequest(`http://localhost:3000/api/tags/${testTagId}`, {
        method: 'DELETE',
      });

      const response = await deleteTag(request, { params: Promise.resolve({ id: testTagId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify tag was deleted
      const deletedTag = await prisma.tag.findUnique({
        where: { id: testTagId },
      });
      expect(deletedTag).toBeNull();
    });

    it('should return 404 for non-existent tag', async () => {
      const request = new NextRequest('http://localhost:3000/api/tags/non-existent-id', {
        method: 'DELETE',
      });

      const response = await deleteTag(request, { params: Promise.resolve({ id: 'non-existent-id' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Tag not found');
    });

    it('should delete associated monitor-tag relationships', async () => {
      // Create a monitor-tag relationship
      await prisma.monitorTag.create({
        data: {
          monitorId: testMonitorId,
          tagId: testTagId,
        },
      });

      const request = new NextRequest(`http://localhost:3000/api/tags/${testTagId}`, {
        method: 'DELETE',
      });

      const response = await deleteTag(request, { params: Promise.resolve({ id: testTagId }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify monitor-tag relationship was deleted
      const monitorTag = await prisma.monitorTag.findFirst({
        where: { tagId: testTagId },
      });
      expect(monitorTag).toBeNull();
    });
  });

  describe('Tag Usage Tracking', () => {
    it('should track tag usage with monitors', async () => {
      // Create a monitor-tag relationship
      await prisma.monitorTag.create({
        data: {
          monitorId: testMonitorId,
          tagId: testTagId,
        },
      });

      const request = new NextRequest(`http://localhost:3000/api/tags?orgId=${testOrgId}`);

      const response = await getTags(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      const tag = data.find((t: any) => t.id === testTagId);
      expect(tag).toBeDefined();
      expect(tag._count).toBeDefined();
      expect(tag._count.MonitorTag).toBe(1);
    });
  });
});
