import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@tokiflow/db';
import { 
  createTestUser, 
  createTestOrg, 
  createTestMonitor, 
  createTestAlertChannel,
  generateTestToken,
  cleanupTestData 
} from '../integration-setup';

describe('Monitor → Ping → Incident → Alert Flow', () => {
  let testUser: any;
  let testOrg: any;
  let testMonitor: any;
  let testChannel: any;
  let monitorToken: string;

  beforeEach(async () => {
    await cleanupTestData();
    
    // Create test data
    testUser = await createTestUser();
    testOrg = await createTestOrg(testUser.id);
    testMonitor = await createTestMonitor(testOrg.id, {
      scheduleType: 'INTERVAL',
      intervalSec: 300, // 5 minutes
      gracePeriodSec: 60, // 1 minute grace
    });
    testChannel = await createTestAlertChannel(testOrg.id);
    monitorToken = generateTestToken(testMonitor.id);
  });

  describe('Successful Monitor Flow', () => {
    it('should handle successful ping and update monitor status', async () => {
      // Send successful ping
      const pingResponse = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: monitorToken,
          status: 'success',
          durationMs: 1500,
          output: 'Job completed successfully',
        }),
      });

      expect(pingResponse.status).toBe(200);

      // Verify monitor was updated
      const updatedMonitor = await prisma.monitor.findUnique({
        where: { id: testMonitor.id },
      });

      expect(updatedMonitor?.status).toBe('OK');
      expect(updatedMonitor?.lastRunAt).toBeTruthy();
      expect(updatedMonitor?.lastDurationMs).toBe(1500);

      // Verify run was recorded
      const runs = await prisma.run.findMany({
        where: { monitorId: testMonitor.id },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(runs).toHaveLength(1);
      expect(runs[0].outcome).toBe('SUCCESS');
      expect(runs[0].durationMs).toBe(1500);
      expect(runs[0].output).toBe('Job completed successfully');
    });

    it('should handle multiple successful pings and update statistics', async () => {
      // Send multiple successful pings
      for (let i = 0; i < 5; i++) {
        const pingResponse = await fetch('/api/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: monitorToken,
            status: 'success',
            durationMs: 1000 + i * 100, // Varying durations
            output: `Job ${i + 1} completed`,
          }),
        });

        expect(pingResponse.status).toBe(200);
      }

      // Verify monitor statistics
      const updatedMonitor = await prisma.monitor.findUnique({
        where: { id: testMonitor.id },
      });

      expect(updatedMonitor?.status).toBe('OK');
      expect(updatedMonitor?.durationCount).toBe(5);
      expect(updatedMonitor?.durationMean).toBeCloseTo(1200, 0); // Average of 1000-1400
      expect(updatedMonitor?.durationMin).toBe(1000);
      expect(updatedMonitor?.durationMax).toBe(1400);

      // Verify all runs were recorded
      const runs = await prisma.run.findMany({
        where: { monitorId: testMonitor.id },
        orderBy: { createdAt: 'asc' },
      });

      expect(runs).toHaveLength(5);
      runs.forEach((run, index) => {
        expect(run.outcome).toBe('SUCCESS');
        expect(run.durationMs).toBe(1000 + index * 100);
      });
    });
  });

  describe('Failed Monitor Flow', () => {
    it('should handle failed ping and create incident', async () => {
      // Send failed ping
      const pingResponse = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: monitorToken,
          status: 'failed',
          durationMs: 5000,
          exitCode: 1,
          output: 'Job failed with error',
        }),
      });

      expect(pingResponse.status).toBe(200);

      // Verify monitor status
      const updatedMonitor = await prisma.monitor.findUnique({
        where: { id: testMonitor.id },
      });

      expect(updatedMonitor?.status).toBe('FAILING');

      // Verify incident was created
      const incidents = await prisma.incident.findMany({
        where: { monitorId: testMonitor.id },
        orderBy: { openedAt: 'desc' },
      });

      expect(incidents).toHaveLength(1);
      expect(incidents[0].kind).toBe('FAIL');
      expect(incidents[0].status).toBe('OPEN');
      expect(incidents[0].summary).toContain('Job failed');
      expect(incidents[0].details).toBe('Job failed with error');

      // Verify run was recorded
      const runs = await prisma.run.findMany({
        where: { monitorId: testMonitor.id },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });

      expect(runs).toHaveLength(1);
      expect(runs[0].outcome).toBe('FAIL');
      expect(runs[0].exitCode).toBe(1);
    });

    it('should handle missed ping and create incident', async () => {
      // Wait for grace period to pass (simulate missed ping)
      const gracePeriodMs = testMonitor.gracePeriodSec * 1000;
      await new Promise(resolve => setTimeout(resolve, gracePeriodMs + 1000));

      // Trigger evaluator to check for missed pings
      // This would normally be done by the evaluator job
      const evaluatorResponse = await fetch('/api/_internal/evaluator/run', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer internal-token' },
      });

      // Verify incident was created for missed ping
      const incidents = await prisma.incident.findMany({
        where: { monitorId: testMonitor.id },
        orderBy: { openedAt: 'desc' },
      });

      expect(incidents).toHaveLength(1);
      expect(incidents[0].kind).toBe('MISSED');
      expect(incidents[0].status).toBe('OPEN');
      expect(incidents[0].summary).toContain('did not run on time');
    });
  });

  describe('Alert Flow', () => {
    it('should send alert when incident is created', async () => {
      // Create incident
      const incident = await prisma.incident.create({
        data: {
          monitorId: testMonitor.id,
          kind: 'FAIL',
          status: 'OPEN',
          summary: 'Test incident',
          details: 'Test details',
          openedAt: new Date(),
        },
      });

      // Trigger alert dispatch
      const alertResponse = await fetch('/api/_internal/alerts/dispatch', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer internal-token'
        },
        body: JSON.stringify({
          incidentId: incident.id,
          channelId: testChannel.id,
        }),
      });

      expect(alertResponse.status).toBe(200);

      // Verify alert was sent (in real implementation, this would check email logs, etc.)
      // For now, we just verify the API call succeeded
    });

    it('should handle incident acknowledgment', async () => {
      // Create incident
      const incident = await prisma.incident.create({
        data: {
          monitorId: testMonitor.id,
          kind: 'FAIL',
          status: 'OPEN',
          summary: 'Test incident',
          details: 'Test details',
          openedAt: new Date(),
        },
      });

      // Acknowledge incident
      const ackResponse = await fetch(`/api/incidents/${incident.id}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(ackResponse.status).toBe(200);

      // Verify incident was acknowledged
      const updatedIncident = await prisma.incident.findUnique({
        where: { id: incident.id },
      });

      expect(updatedIncident?.status).toBe('ACKED');
      expect(updatedIncident?.acknowledgedAt).toBeTruthy();
    });

    it('should handle incident resolution', async () => {
      // Create incident
      const incident = await prisma.incident.create({
        data: {
          monitorId: testMonitor.id,
          kind: 'FAIL',
          status: 'OPEN',
          summary: 'Test incident',
          details: 'Test details',
          openedAt: new Date(),
        },
      });

      // Resolve incident
      const resolveResponse = await fetch(`/api/incidents/${incident.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(resolveResponse.status).toBe(200);

      // Verify incident was resolved
      const updatedIncident = await prisma.incident.findUnique({
        where: { id: incident.id },
      });

      expect(updatedIncident?.status).toBe('RESOLVED');
      expect(updatedIncident?.resolvedAt).toBeTruthy();
    });
  });

  describe('Anomaly Detection Flow', () => {
    it('should detect duration anomaly and create incident', async () => {
      // First, establish baseline with normal runs
      for (let i = 0; i < 10; i++) {
        await fetch('/api/ping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: monitorToken,
            status: 'success',
            durationMs: 1000, // Normal duration
            output: `Baseline run ${i + 1}`,
          }),
        });
      }

      // Send anomalous run (much longer than normal)
      const anomalyResponse = await fetch('/api/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: monitorToken,
          status: 'success',
          durationMs: 10000, // 10x normal duration
          output: 'Anomalous run',
        }),
      });

      expect(anomalyResponse.status).toBe(200);

      // Verify anomaly incident was created
      const incidents = await prisma.incident.findMany({
        where: { monitorId: testMonitor.id },
        orderBy: { openedAt: 'desc' },
      });

      expect(incidents).toHaveLength(1);
      expect(incidents[0].kind).toBe('ANOMALY');
      expect(incidents[0].status).toBe('OPEN');
      expect(incidents[0].summary).toContain('anomaly');
    });
  });

  describe('Tag Management Flow', () => {
    it('should create tag and assign to monitor', async () => {
      // Create tag
      const tag = await createTestTag(testOrg.id, {
        name: 'test-production',
      });

      // Assign tag to monitor
      const assignResponse = await fetch(`/api/monitors/${testMonitor.id}/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagId: tag.id,
        }),
      });

      expect(assignResponse.status).toBe(200);

      // Verify tag was assigned
      const monitorTags = await prisma.monitorTag.findMany({
        where: { monitorId: testMonitor.id },
        include: { Tag: true },
      });

      expect(monitorTags).toHaveLength(1);
      expect(monitorTags[0].Tag.name).toBe('test-production');
    });

    it('should filter monitors by tag', async () => {
      // Create tags
      const productionTag = await createTestTag(testOrg.id, {
        name: 'test-production',
      });
      const stagingTag = await createTestTag(testOrg.id, {
        name: 'test-staging',
      });

      // Create monitors with different tags
      const prodMonitor = await createTestMonitor(testOrg.id, {
        name: 'test-prod-monitor',
      });
      const stagingMonitor = await createTestMonitor(testOrg.id, {
        name: 'test-staging-monitor',
      });

      // Assign tags
      await prisma.monitorTag.create({
        data: { monitorId: prodMonitor.id, tagId: productionTag.id },
      });
      await prisma.monitorTag.create({
        data: { monitorId: stagingMonitor.id, tagId: stagingTag.id },
      });

      // Filter by production tag
      const filteredResponse = await fetch(`/api/monitors?tag=${productionTag.id}`);
      expect(filteredResponse.status).toBe(200);

      const filteredData = await filteredResponse.json();
      expect(filteredData.monitors).toHaveLength(1);
      expect(filteredData.monitors[0].name).toBe('test-prod-monitor');
    });
  });
});
