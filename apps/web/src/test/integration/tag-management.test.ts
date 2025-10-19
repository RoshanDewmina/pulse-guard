import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@tokiflow/db';
import { 
  createTestUser, 
  createTestOrg, 
  createTestMonitor,
  createTestTag,
  cleanupTestData 
} from '../integration-setup';

describe('Tag Management → Monitor Assignment → Filtering Flow', () => {
  let testUser: any;
  let testOrg: any;

  beforeEach(async () => {
    await cleanupTestData();
    testUser = await createTestUser();
    testOrg = await createTestOrg(testUser.id);
  });

  describe('Tag CRUD Operations', () => {
    it('should create, read, update, and delete tags', async () => {
      // 1. Create tag
      const createResponse = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'production',
          color: '#ff0000',
        }),
      });

      expect(createResponse.status).toBe(201);
      const createdTag = await createResponse.json();

      expect(createdTag.name).toBe('production');
      expect(createdTag.color).toBe('#ff0000');
      expect(createdTag.orgId).toBe(testOrg.id);

      // 2. Read tag
      const getResponse = await fetch(`/api/tags/${createdTag.id}`);
      expect(getResponse.status).toBe(200);
      const retrievedTag = await getResponse.json();

      expect(retrievedTag.id).toBe(createdTag.id);
      expect(retrievedTag.name).toBe('production');

      // 3. Update tag
      const updateResponse = await fetch(`/api/tags/${createdTag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'prod',
          color: '#00ff00',
        }),
      });

      expect(updateResponse.status).toBe(200);
      const updatedTag = await updateResponse.json();

      expect(updatedTag.name).toBe('prod');
      expect(updatedTag.color).toBe('#00ff00');

      // 4. Delete tag
      const deleteResponse = await fetch(`/api/tags/${createdTag.id}`, {
        method: 'DELETE',
      });

      expect(deleteResponse.status).toBe(204);

      // 5. Verify deletion
      const getDeletedResponse = await fetch(`/api/tags/${createdTag.id}`);
      expect(getDeletedResponse.status).toBe(404);
    });

    it('should list all tags for organization', async () => {
      // Create multiple tags
      const tag1 = await createTestTag(testOrg.id, { name: 'test-frontend' });
      const tag2 = await createTestTag(testOrg.id, { name: 'test-backend' });
      const tag3 = await createTestTag(testOrg.id, { name: 'test-database' });

      // List tags
      const listResponse = await fetch('/api/tags');
      expect(listResponse.status).toBe(200);
      const tags = await listResponse.json();

      expect(tags).toHaveLength(3);
      expect(tags.map((t: any) => t.name)).toContain('test-frontend');
      expect(tags.map((t: any) => t.name)).toContain('test-backend');
      expect(tags.map((t: any) => t.name)).toContain('test-database');
    });

    it('should enforce unique tag names per organization', async () => {
      // Create first tag
      await createTestTag(testOrg.id, { name: 'test-unique' });

      // Try to create duplicate tag
      const duplicateResponse = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'test-unique',
        }),
      });

      expect(duplicateResponse.status).toBe(400);
      const errorData = await duplicateResponse.json();
      expect(errorData.error).toContain('already exists');
    });

    it('should allow same tag name in different organizations', async () => {
      // Create second organization
      const otherOrg = await createTestOrg(testUser.id, { name: 'test-org-2' });

      // Create tag in first org
      const tag1 = await createTestTag(testOrg.id, { name: 'shared-name' });

      // Create tag with same name in second org
      const tag2 = await createTestTag(otherOrg.id, { name: 'shared-name' });

      expect(tag1.name).toBe(tag2.name);
      expect(tag1.orgId).not.toBe(tag2.orgId);
    });
  });

  describe('Monitor-Tag Assignment', () => {
    it('should assign and unassign tags to monitors', async () => {
      // Create monitor and tags
      const monitor = await createTestMonitor(testOrg.id, { name: 'test-monitor' });
      const tag1 = await createTestTag(testOrg.id, { name: 'test-production' });
      const tag2 = await createTestTag(testOrg.id, { name: 'test-critical' });

      // Assign tags to monitor
      const assignResponse1 = await fetch(`/api/monitors/${monitor.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: tag1.id,
        }),
      });

      expect(assignResponse1.status).toBe(200);

      const assignResponse2 = await fetch(`/api/monitors/${monitor.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: tag2.id,
        }),
      });

      expect(assignResponse2.status).toBe(200);

      // Verify assignments
      const monitorTags = await prisma.monitorTag.findMany({
        where: { monitorId: monitor.id },
        include: { Tag: true },
      });

      expect(monitorTags).toHaveLength(2);
      expect(monitorTags.map(mt => mt.Tag.name)).toContain('test-production');
      expect(monitorTags.map(mt => mt.Tag.name)).toContain('test-critical');

      // Unassign one tag
      const unassignResponse = await fetch(`/api/monitors/${monitor.id}/tags/${tag1.id}`, {
        method: 'DELETE',
      });

      expect(unassignResponse.status).toBe(204);

      // Verify unassignment
      const remainingTags = await prisma.monitorTag.findMany({
        where: { monitorId: monitor.id },
        include: { Tag: true },
      });

      expect(remainingTags).toHaveLength(1);
      expect(remainingTags[0].Tag.name).toBe('test-critical');
    });

    it('should prevent duplicate tag assignments', async () => {
      const monitor = await createTestMonitor(testOrg.id);
      const tag = await createTestTag(testOrg.id);

      // Assign tag first time
      const assignResponse1 = await fetch(`/api/monitors/${monitor.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id }),
      });

      expect(assignResponse1.status).toBe(200);

      // Try to assign same tag again
      const assignResponse2 = await fetch(`/api/monitors/${monitor.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id }),
      });

      expect(assignResponse2.status).toBe(400);
      const errorData = await assignResponse2.json();
      expect(errorData.error).toContain('already assigned');
    });

    it('should handle tag assignment to non-existent monitor', async () => {
      const tag = await createTestTag(testOrg.id);

      const assignResponse = await fetch('/api/monitors/non-existent/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tagId: tag.id }),
      });

      expect(assignResponse.status).toBe(404);
    });
  });

  describe('Monitor Filtering by Tags', () => {
    it('should filter monitors by single tag', async () => {
      // Create monitors with different tags
      const monitor1 = await createTestMonitor(testOrg.id, { name: 'test-prod-monitor' });
      const monitor2 = await createTestMonitor(testOrg.id, { name: 'test-staging-monitor' });
      const monitor3 = await createTestMonitor(testOrg.id, { name: 'test-dev-monitor' });

      const prodTag = await createTestTag(testOrg.id, { name: 'test-production' });
      const stagingTag = await createTestTag(testOrg.id, { name: 'test-staging' });

      // Assign tags
      await prisma.monitorTag.create({
        data: { monitorId: monitor1.id, tagId: prodTag.id },
      });
      await prisma.monitorTag.create({
        data: { monitorId: monitor2.id, tagId: stagingTag.id },
      });

      // Filter by production tag
      const filterResponse = await fetch(`/api/monitors?tag=${prodTag.id}`);
      expect(filterResponse.status).toBe(200);
      const filteredData = await filterResponse.json();

      expect(filteredData.monitors).toHaveLength(1);
      expect(filteredData.monitors[0].name).toBe('test-prod-monitor');
    });

    it('should filter monitors by multiple tags', async () => {
      // Create monitors with different tag combinations
      const monitor1 = await createTestMonitor(testOrg.id, { name: 'test-prod-critical' });
      const monitor2 = await createTestMonitor(testOrg.id, { name: 'test-prod-normal' });
      const monitor3 = await createTestMonitor(testOrg.id, { name: 'test-staging-critical' });

      const prodTag = await createTestTag(testOrg.id, { name: 'test-production' });
      const criticalTag = await createTestTag(testOrg.id, { name: 'test-critical' });

      // Assign tags
      await prisma.monitorTag.createMany([
        { monitorId: monitor1.id, tagId: prodTag.id },
        { monitorId: monitor1.id, tagId: criticalTag.id },
        { monitorId: monitor2.id, tagId: prodTag.id },
        { monitorId: monitor3.id, tagId: criticalTag.id },
      ]);

      // Filter by both production and critical tags
      const filterResponse = await fetch(`/api/monitors?tag=${prodTag.id}&tag=${criticalTag.id}`);
      expect(filterResponse.status).toBe(200);
      const filteredData = await filterResponse.json();

      expect(filteredData.monitors).toHaveLength(1);
      expect(filteredData.monitors[0].name).toBe('test-prod-critical');
    });

    it('should return all monitors when no tags specified', async () => {
      // Create monitors
      const monitor1 = await createTestMonitor(testOrg.id, { name: 'test-monitor-1' });
      const monitor2 = await createTestMonitor(testOrg.id, { name: 'test-monitor-2' });

      // Get all monitors
      const allResponse = await fetch('/api/monitors');
      expect(allResponse.status).toBe(200);
      const allData = await allResponse.json();

      expect(allData.monitors).toHaveLength(2);
      expect(allData.monitors.map((m: any) => m.name)).toContain('test-monitor-1');
      expect(allData.monitors.map((m: any) => m.name)).toContain('test-monitor-2');
    });

    it('should return empty list for non-existent tag', async () => {
      const filterResponse = await fetch('/api/monitors?tag=non-existent');
      expect(filterResponse.status).toBe(200);
      const filteredData = await filterResponse.json();

      expect(filteredData.monitors).toHaveLength(0);
    });
  });

  describe('Tag Usage Statistics', () => {
    it('should track tag usage across monitors', async () => {
      // Create tags
      const popularTag = await createTestTag(testOrg.id, { name: 'test-popular' });
      const rareTag = await createTestTag(testOrg.id, { name: 'test-rare' });

      // Create monitors and assign tags
      const monitor1 = await createTestMonitor(testOrg.id, { name: 'test-monitor-1' });
      const monitor2 = await createTestMonitor(testOrg.id, { name: 'test-monitor-2' });
      const monitor3 = await createTestMonitor(testOrg.id, { name: 'test-monitor-3' });

      // Assign popular tag to multiple monitors
      await prisma.monitorTag.createMany([
        { monitorId: monitor1.id, tagId: popularTag.id },
        { monitorId: monitor2.id, tagId: popularTag.id },
        { monitorId: monitor3.id, tagId: popularTag.id },
      ]);

      // Assign rare tag to one monitor
      await prisma.monitorTag.create({
        data: { monitorId: monitor1.id, tagId: rareTag.id },
      });

      // Get tag usage statistics
      const statsResponse = await fetch('/api/tags/usage');
      expect(statsResponse.status).toBe(200);
      const stats = await statsResponse.json();

      const popularTagStats = stats.find((s: any) => s.tagId === popularTag.id);
      const rareTagStats = stats.find((s: any) => s.tagId === rareTag.id);

      expect(popularTagStats?.usageCount).toBe(3);
      expect(rareTagStats?.usageCount).toBe(1);
    });
  });

  describe('Tag Cleanup and Cascading', () => {
    it('should clean up monitor-tag relationships when tag is deleted', async () => {
      const monitor = await createTestMonitor(testOrg.id);
      const tag = await createTestTag(testOrg.id);

      // Assign tag to monitor
      await prisma.monitorTag.create({
        data: { monitorId: monitor.id, tagId: tag.id },
      });

      // Verify assignment exists
      const beforeDelete = await prisma.monitorTag.findMany({
        where: { tagId: tag.id },
      });
      expect(beforeDelete).toHaveLength(1);

      // Delete tag
      const deleteResponse = await fetch(`/api/tags/${tag.id}`, {
        method: 'DELETE',
      });
      expect(deleteResponse.status).toBe(204);

      // Verify monitor-tag relationship was cleaned up
      const afterDelete = await prisma.monitorTag.findMany({
        where: { tagId: tag.id },
      });
      expect(afterDelete).toHaveLength(0);
    });

    it('should clean up monitor-tag relationships when monitor is deleted', async () => {
      const monitor = await createTestMonitor(testOrg.id);
      const tag = await createTestTag(testOrg.id);

      // Assign tag to monitor
      await prisma.monitorTag.create({
        data: { monitorId: monitor.id, tagId: tag.id },
      });

      // Verify assignment exists
      const beforeDelete = await prisma.monitorTag.findMany({
        where: { monitorId: monitor.id },
      });
      expect(beforeDelete).toHaveLength(1);

      // Delete monitor
      await prisma.monitor.delete({
        where: { id: monitor.id },
      });

      // Verify monitor-tag relationship was cleaned up
      const afterDelete = await prisma.monitorTag.findMany({
        where: { monitorId: monitor.id },
      });
      expect(afterDelete).toHaveLength(0);
    });
  });

  describe('Tag Validation and Error Handling', () => {
    it('should validate tag name requirements', async () => {
      // Try to create tag with empty name
      const emptyNameResponse = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: '' }),
      });

      expect(emptyNameResponse.status).toBe(400);
      const errorData = await emptyNameResponse.json();
      expect(errorData.error).toContain('required');

      // Try to create tag with too long name
      const longNameResponse = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'a'.repeat(256) }),
      });

      expect(longNameResponse.status).toBe(400);
    });

    it('should validate tag color format', async () => {
      // Try to create tag with invalid color
      const invalidColorResponse = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'test-tag',
          color: 'invalid-color',
        }),
      });

      expect(invalidColorResponse.status).toBe(400);
    });

    it('should handle non-existent tag operations', async () => {
      // Try to get non-existent tag
      const getResponse = await fetch('/api/tags/non-existent');
      expect(getResponse.status).toBe(404);

      // Try to update non-existent tag
      const updateResponse = await fetch('/api/tags/non-existent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'updated' }),
      });
      expect(updateResponse.status).toBe(404);

      // Try to delete non-existent tag
      const deleteResponse = await fetch('/api/tags/non-existent', {
        method: 'DELETE',
      });
      expect(deleteResponse.status).toBe(404);
    });
  });
});
