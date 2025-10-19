import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { prisma } from '@tokiflow/db';
import { createAuditLog, AuditAction } from '@/lib/audit';

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

// Mock external dependencies
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('test-random-bytes')),
}));

jest.mock('bcryptjs', () => ({
  hash: jest.fn((data: string) => Promise.resolve(`hashed-${data}`)),
  compareSync: jest.fn((data: string, hash: string) => hash === `hashed-${data}`),
}));

jest.mock('@tokiflow/shared', () => ({
  encrypt: jest.fn((data: string) => `encrypted-${data}`),
  decrypt: jest.fn((data: string) => data.replace('encrypted-', '')),
}));

jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,test-qr-code')),
}));

jest.mock('@otplib/preset-default', () => ({
  authenticator: {
    generateSecret: jest.fn(() => 'test-secret'),
    keyuri: jest.fn(() => 'otpauth://totp/test@example.com?secret=test-secret'),
    verify: jest.fn(() => true),
  },
}));

global.fetch = jest.fn();

describe('Integration Tests - Complete Feature Flow', () => {
  let testOrgId: string;
  let testMonitorId: string;
  let testTagId: string;
  let testMaintenanceWindowId: string;
  let testSAMLConfigId: string;

  beforeEach(async () => {
    // Clean up all test data
    await prisma.auditLog.deleteMany({ where: { orgId: 'test-org-id' } });
    await prisma.monitorTag.deleteMany({ where: { tagId: { contains: 'test' } } });
    await prisma.tag.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.maintenanceWindow.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.sAMLConfig.deleteMany({ where: { orgId: 'test-org-id' } });
    await prisma.monitor.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.membership.deleteMany({ where: { orgId: 'test-org-id' } });
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    await prisma.org.deleteMany({ where: { name: 'Test Org' } });

    // Create test organization
    const org = await prisma.org.create({
      data: {
        id: 'test-org-id',
        name: 'Test Org',
        slug: 'test-org',
      },
    });
    testOrgId = org.id;

    // Create test user
    await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        emailVerified: new Date(),
      },
    });

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
    // Clean up all test data
    await prisma.auditLog.deleteMany({ where: { orgId: 'test-org-id' } });
    await prisma.monitorTag.deleteMany({ where: { tagId: { contains: 'test' } } });
    await prisma.tag.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.maintenanceWindow.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.sAMLConfig.deleteMany({ where: { orgId: 'test-org-id' } });
    await prisma.monitor.deleteMany({ where: { name: { contains: 'Test' } } });
    await prisma.membership.deleteMany({ where: { orgId: 'test-org-id' } });
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
    await prisma.org.deleteMany({ where: { name: 'Test Org' } });
  });

  describe('Complete Monitoring Setup Flow', () => {
    it('should complete full monitoring setup with all features', async () => {
      // Step 1: Create a monitor with HTTP monitoring
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
          responseTimeSla: 5000,
          httpHeaders: { 'User-Agent': 'Saturn-Monitor' },
          responseAssertions: [
            { type: 'status_code', expected: 200 },
            { type: 'response_time', max: 5000 },
          ],
        },
      });
      testMonitorId = monitor.id;

      // Verify monitor was created
      expect(monitor.monitorType).toBe('HTTP_CHECK');
      expect(monitor.httpMethod).toBe('GET');
      expect(monitor.expectedStatusCode).toBe(200);

      // Step 2: Create tags and associate with monitor
      const tag1 = await prisma.tag.create({
        data: {
          id: 'test-tag-1',
          orgId: testOrgId,
          name: 'Production',
        },
      });

      const tag2 = await prisma.tag.create({
        data: {
          id: 'test-tag-2',
          orgId: testOrgId,
          name: 'Critical',
        },
      });

      // Associate tags with monitor
      await prisma.monitorTag.createMany({
        data: [
          { monitorId: testMonitorId, tagId: tag1.id },
          { monitorId: testMonitorId, tagId: tag2.id },
        ],
      });

      // Verify tag associations
      const monitorTags = await prisma.monitorTag.findMany({
        where: { monitorId: testMonitorId },
        include: { Tag: true },
      });
      expect(monitorTags).toHaveLength(2);
      expect(monitorTags.map(mt => mt.Tag.name)).toContain('Production');
      expect(monitorTags.map(mt => mt.Tag.name)).toContain('Critical');

      // Step 3: Set up anomaly detection tuning
      await prisma.monitor.update({
        where: { id: testMonitorId },
        data: {
          anomalyZScoreThreshold: 2.5,
          anomalyMedianMultiplier: 3.0,
          anomalyOutputDropFraction: 0.3,
        },
      });

      // Verify anomaly settings
      const updatedMonitor = await prisma.monitor.findUnique({
        where: { id: testMonitorId },
      });
      expect(updatedMonitor?.anomalyZScoreThreshold).toBe(2.5);
      expect(updatedMonitor?.anomalyMedianMultiplier).toBe(3.0);
      expect(updatedMonitor?.anomalyOutputDropFraction).toBe(0.3);

      // Step 4: Create maintenance window
      const maintenanceWindow = await prisma.maintenanceWindow.create({
        data: {
          id: 'test-maintenance-window-id',
          orgId: testOrgId,
          name: 'Scheduled Maintenance',
          description: 'Database maintenance window',
          startAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
          endAt: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
          isActive: true,
        },
      });
      testMaintenanceWindowId = maintenanceWindow.id;

      // Verify maintenance window
      expect(maintenanceWindow.name).toBe('Scheduled Maintenance');
      expect(maintenanceWindow.isActive).toBe(true);

      // Step 5: Set up MFA for user
      await prisma.user.update({
        where: { id: 'test-user-id' },
        data: {
          mfaEnabled: true,
          mfaTotpSecretEnc: 'encrypted-test-secret',
          mfaBackupCodesEnc: 'encrypted-[]',
          mfaLastVerifiedAt: new Date(),
        },
      });

      // Verify MFA setup
      const user = await prisma.user.findUnique({
        where: { id: 'test-user-id' },
      });
      expect(user?.mfaEnabled).toBe(true);
      expect(user?.mfaTotpSecretEnc).toBe('encrypted-test-secret');

      // Step 6: Configure SAML
      const samlConfig = await prisma.sAMLConfig.create({
        data: {
          id: 'test-saml-config-id',
          orgId: testOrgId,
          name: 'Enterprise SAML',
          idpUrl: 'https://enterprise-idp.com/sso/saml',
          idpCert: '-----BEGIN CERTIFICATE-----\nENTERPRISE_CERT\n-----END CERTIFICATE-----',
          spCert: '-----BEGIN CERTIFICATE-----\nSP_CERT\n-----END CERTIFICATE-----',
          spKey: '-----BEGIN PRIVATE KEY-----\nSP_KEY\n-----END PRIVATE KEY-----',
          spEntityId: 'urn:enterprise:sp',
          acsUrl: 'https://app.example.com/api/auth/callback/saml',
          sloUrl: 'https://app.example.com/api/auth/signout/saml',
          nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
          attributeMapping: {
            email: 'email',
            name: 'name',
            firstName: 'given_name',
            lastName: 'family_name',
          },
          isEnabled: true,
        },
      });
      testSAMLConfigId = samlConfig.id;

      // Verify SAML configuration
      expect(samlConfig.name).toBe('Enterprise SAML');
      expect(samlConfig.isEnabled).toBe(true);
      expect(samlConfig.spEntityId).toBe('urn:enterprise:sp');

      // Step 7: Create audit logs for all actions
      const auditLogs = [
        {
          action: AuditAction.MONITOR_CREATED,
          orgId: testOrgId,
          userId: 'test-user-id',
          targetId: testMonitorId,
          meta: { name: 'Test HTTP Monitor', type: 'HTTP_CHECK' },
        },
        {
          action: AuditAction.TAG_CREATED,
          orgId: testOrgId,
          userId: 'test-user-id',
          targetId: tag1.id,
          meta: { name: 'Production' },
        },
        {
          action: AuditAction.TAG_CREATED,
          orgId: testOrgId,
          userId: 'test-user-id',
          targetId: tag2.id,
          meta: { name: 'Critical' },
        },
        {
          action: AuditAction.MAINTENANCE_WINDOW_CREATED,
          orgId: testOrgId,
          userId: 'test-user-id',
          targetId: testMaintenanceWindowId,
          meta: { name: 'Scheduled Maintenance' },
        },
        {
          action: AuditAction.MFA_ENABLED,
          orgId: testOrgId,
          userId: 'test-user-id',
          meta: { step: 'enrollment_completed' },
        },
        {
          action: AuditAction.ORG_UPDATED,
          orgId: testOrgId,
          userId: 'test-user-id',
          meta: { type: 'saml_config_created', name: 'Enterprise SAML' },
        },
      ];

      for (const logData of auditLogs) {
        await createAuditLog(logData);
      }

      // Verify audit logs were created
      const createdAuditLogs = await prisma.auditLog.findMany({
        where: { orgId: testOrgId },
        orderBy: { createdAt: 'asc' },
      });
      expect(createdAuditLogs).toHaveLength(6);
      expect(createdAuditLogs[0].action).toBe(AuditAction.MONITOR_CREATED);
      expect(createdAuditLogs[1].action).toBe(AuditAction.TAG_CREATED);
      expect(createdAuditLogs[2].action).toBe(AuditAction.TAG_CREATED);
      expect(createdAuditLogs[3].action).toBe(AuditAction.MAINTENANCE_WINDOW_CREATED);
      expect(createdAuditLogs[4].action).toBe(AuditAction.MFA_ENABLED);
      expect(createdAuditLogs[5].action).toBe(AuditAction.ORG_UPDATED);

      // Step 8: Test HTTP monitoring with mock response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ success: true }),
        text: () => Promise.resolve('{"success": true}'),
      });

      // Simulate HTTP test
      const testResponse = await fetch('https://httpbin.org/status/200', {
        method: 'GET',
        headers: { 'User-Agent': 'Saturn-Monitor' },
      });

      expect(testResponse.ok).toBe(true);
      expect(testResponse.status).toBe(200);

      // Step 9: Verify complete setup
      const completeSetup = {
        monitor: await prisma.monitor.findUnique({
          where: { id: testMonitorId },
          include: {
            MonitorTag: {
              include: { Tag: true },
            },
          },
        }),
        tags: await prisma.tag.findMany({
          where: { orgId: testOrgId },
        }),
        maintenanceWindows: await prisma.maintenanceWindow.findMany({
          where: { orgId: testOrgId },
        }),
        samlConfig: await prisma.sAMLConfig.findUnique({
          where: { orgId: testOrgId },
        }),
        user: await prisma.user.findUnique({
          where: { id: 'test-user-id' },
        }),
        auditLogs: await prisma.auditLog.findMany({
          where: { orgId: testOrgId },
        }),
      };

      // Verify all components are properly configured
      expect(completeSetup.monitor).not.toBeNull();
      expect(completeSetup.monitor?.monitorType).toBe('HTTP_CHECK');
      expect(completeSetup.monitor?.MonitorTag).toHaveLength(2);
      expect(completeSetup.tags).toHaveLength(2);
      expect(completeSetup.maintenanceWindows).toHaveLength(1);
      expect(completeSetup.samlConfig).not.toBeNull();
      expect(completeSetup.user?.mfaEnabled).toBe(true);
      expect(completeSetup.auditLogs).toHaveLength(6);

      console.log('✅ Complete monitoring setup flow test passed');
      console.log(`   - Monitor: ${completeSetup.monitor?.name} (${completeSetup.monitor?.monitorType})`);
      console.log(`   - Tags: ${completeSetup.tags.length} tags created`);
      console.log(`   - Maintenance Windows: ${completeSetup.maintenanceWindows.length} windows`);
      console.log(`   - SAML: ${completeSetup.samlConfig ? 'Configured' : 'Not configured'}`);
      console.log(`   - MFA: ${completeSetup.user?.mfaEnabled ? 'Enabled' : 'Disabled'}`);
      console.log(`   - Audit Logs: ${completeSetup.auditLogs.length} entries`);
    });

    it('should handle maintenance window checks correctly', async () => {
      // Create a monitor
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

      // Create an active maintenance window
      const now = new Date();
      const maintenanceWindow = await prisma.maintenanceWindow.create({
        data: {
          id: 'test-maintenance-window-id',
          orgId: testOrgId,
          name: 'Current Maintenance',
          startAt: new Date(now.getTime() - 30 * 60 * 1000), // 30 minutes ago
          endAt: new Date(now.getTime() + 30 * 60 * 1000), // 30 minutes from now
          isActive: true,
        },
      });

      // Check if monitor is in maintenance
      const activeWindows = await prisma.maintenanceWindow.findMany({
        where: {
          orgId: testOrgId,
          isActive: true,
          startAt: { lte: now },
          endAt: { gte: now },
        },
      });

      expect(activeWindows).toHaveLength(1);
      expect(activeWindows[0].id).toBe(maintenanceWindow.id);

      // Simulate incident creation (should be suppressed during maintenance)
      const shouldCreateIncident = activeWindows.length === 0;
      expect(shouldCreateIncident).toBe(false); // Should not create incident during maintenance
    });

    it('should handle tag filtering and search', async () => {
      // Create multiple tags
      const tags = await Promise.all([
        prisma.tag.create({
          data: { id: 'tag-1', orgId: testOrgId, name: 'Production' },
        }),
        prisma.tag.create({
          data: { id: 'tag-2', orgId: testOrgId, name: 'Staging' },
        }),
        prisma.tag.create({
          data: { id: 'tag-3', orgId: testOrgId, name: 'Critical' },
        }),
        prisma.tag.create({
          data: { id: 'tag-4', orgId: testOrgId, name: 'Low Priority' },
        }),
      ]);

      // Create monitors with different tag combinations
      const monitor1 = await prisma.monitor.create({
        data: {
          id: 'monitor-1',
          orgId: testOrgId,
          name: 'Production API',
          token: 'token-1',
          scheduleType: 'INTERVAL',
          intervalSec: 300,
        },
      });

      const monitor2 = await prisma.monitor.create({
        data: {
          id: 'monitor-2',
          orgId: testOrgId,
          name: 'Staging API',
          token: 'token-2',
          scheduleType: 'INTERVAL',
          intervalSec: 300,
        },
      });

      // Associate tags with monitors
      await prisma.monitorTag.createMany({
        data: [
          { monitorId: monitor1.id, tagId: tags[0].id }, // Production
          { monitorId: monitor1.id, tagId: tags[2].id }, // Critical
          { monitorId: monitor2.id, tagId: tags[1].id }, // Staging
        ],
      });

      // Test tag filtering
      const productionMonitors = await prisma.monitor.findMany({
        where: {
          orgId: testOrgId,
          MonitorTag: {
            some: {
              Tag: {
                name: 'Production',
              },
            },
          },
        },
        include: {
          MonitorTag: {
            include: { Tag: true },
          },
        },
      });

      expect(productionMonitors).toHaveLength(1);
      expect(productionMonitors[0].name).toBe('Production API');
      expect(productionMonitors[0].MonitorTag.map(mt => mt.Tag.name)).toContain('Production');
      expect(productionMonitors[0].MonitorTag.map(mt => mt.Tag.name)).toContain('Critical');

      // Test tag search
      const criticalTags = await prisma.tag.findMany({
        where: {
          orgId: testOrgId,
          name: {
            contains: 'Critical',
            mode: 'insensitive',
          },
        },
      });

      expect(criticalTags).toHaveLength(1);
      expect(criticalTags[0].name).toBe('Critical');
    });
  });
});
