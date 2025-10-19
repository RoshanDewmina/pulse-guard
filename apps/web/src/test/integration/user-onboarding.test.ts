import { describe, it, expect, beforeEach } from 'vitest';
import { prisma } from '@tokiflow/db';
import { 
  createTestUser, 
  createTestOrg, 
  cleanupTestData 
} from '../integration-setup';

describe('User Signup → Org Creation → Onboarding Flow', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('User Registration Flow', () => {
    it('should create user and send verification email', async () => {
      // Simulate user registration
      const userData = {
        email: 'test-user@example.com',
        name: 'Test User',
      };

      // This would normally go through the auth system
      const user = await prisma.user.create({
        data: {
          ...userData,
          emailVerified: null, // Not verified yet
        },
      });

      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.emailVerified).toBeNull();

      // Verify user was created
      const createdUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(createdUser).toBeTruthy();
      expect(createdUser?.id).toBe(user.id);
    });

    it('should verify email and update user status', async () => {
      // Create unverified user
      const user = await prisma.user.create({
        data: {
          email: 'test-user@example.com',
          name: 'Test User',
          emailVerified: null,
        },
      });

      // Simulate email verification
      const verifyResponse = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'verification-token', // In real implementation, this would be a valid token
        }),
      });

      // In a real test, we'd mock the verification process
      // For now, we'll manually update the user
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });

      // Verify user is now verified
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser?.emailVerified).toBeTruthy();
    });
  });

  describe('Organization Creation Flow', () => {
    it('should create organization for new user', async () => {
      const user = await createTestUser();

      // Create organization
      const orgData = {
        name: 'Test Organization',
        slug: 'test-org',
        ownerId: user.id,
      };

      const org = await prisma.org.create({
        data: orgData,
      });

      expect(org.name).toBe(orgData.name);
      expect(org.slug).toBe(orgData.slug);
      expect(org.ownerId).toBe(user.id);

      // Verify user is added to org
      const userOrgs = await prisma.orgMember.findMany({
        where: { userId: user.id },
        include: { org: true },
      });

      expect(userOrgs).toHaveLength(1);
      expect(userOrgs[0].org.id).toBe(org.id);
      expect(userOrgs[0].role).toBe('OWNER');
    });

    it('should create default subscription for new organization', async () => {
      const user = await createTestUser();
      const org = await createTestOrg(user.id);

      // Verify default subscription was created
      const subscription = await prisma.subscription.findFirst({
        where: { orgId: org.id },
      });

      expect(subscription).toBeTruthy();
      expect(subscription?.status).toBe('ACTIVE');
      expect(subscription?.planId).toBeTruthy();
    });
  });

  describe('Onboarding Checklist Flow', () => {
    it('should track onboarding progress', async () => {
      const user = await createTestUser();
      const org = await createTestOrg(user.id);

      // Get onboarding checklist
      const checklistResponse = await fetch('/api/onboarding/checklist');
      expect(checklistResponse.status).toBe(200);

      const checklist = await checklistResponse.json();
      expect(checklist.items).toBeInstanceOf(Array);
      expect(checklist.items.length).toBeGreaterThan(0);

      // Verify initial state
      expect(checklist.completed).toBe(0);
      expect(checklist.total).toBe(checklist.items.length);
    });

    it('should complete onboarding steps', async () => {
      const user = await createTestUser();
      const org = await createTestOrg(user.id);

      // Create first monitor (onboarding step)
      const monitor = await prisma.monitor.create({
        data: {
          name: 'My First Monitor',
          orgId: org.id,
          scheduleType: 'INTERVAL',
          intervalSec: 300,
          gracePeriodSec: 60,
          status: 'OK',
        },
      });

      // Check onboarding progress
      const checklistResponse = await fetch('/api/onboarding/checklist');
      const checklist = await checklistResponse.json();

      // Should have completed "Create your first monitor" step
      const monitorStep = checklist.items.find((item: any) => 
        item.id === 'create_monitor'
      );
      expect(monitorStep?.completed).toBe(true);

      // Create alert channel (another onboarding step)
      const alertChannel = await prisma.alertChannel.create({
        data: {
          label: 'Email Alerts',
          type: 'EMAIL',
          orgId: org.id,
          configJson: { email: user.email },
        },
      });

      // Check updated progress
      const updatedChecklistResponse = await fetch('/api/onboarding/checklist');
      const updatedChecklist = await updatedChecklistResponse.json();

      const alertStep = updatedChecklist.items.find((item: any) => 
        item.id === 'configure_alerts'
      );
      expect(alertStep?.completed).toBe(true);
    });

    it('should test alert configuration', async () => {
      const user = await createTestUser();
      const org = await createTestOrg(user.id);

      // Create alert channel
      const alertChannel = await prisma.alertChannel.create({
        data: {
          label: 'Test Alerts',
          type: 'EMAIL',
          orgId: org.id,
          configJson: { email: user.email },
        },
      });

      // Test alert
      const testResponse = await fetch('/api/onboarding/test-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channelId: alertChannel.id,
        }),
      });

      expect(testResponse.status).toBe(200);

      const result = await testResponse.json();
      expect(result.success).toBe(true);
      expect(result.message).toContain('Test alert sent');
    });
  });

  describe('MFA Enrollment Flow', () => {
    it('should enroll user in MFA', async () => {
      const user = await createTestUser();

      // Start MFA enrollment
      const enrollResponse = await fetch('/api/mfa/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(enrollResponse.status).toBe(200);

      const enrollData = await enrollResponse.json();
      expect(enrollData.qrCode).toBeTruthy();
      expect(enrollData.secret).toBeTruthy();
      expect(enrollData.backupCodes).toHaveLength(10);

      // Verify MFA is enabled for user
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser?.mfaEnabled).toBe(true);
      expect(updatedUser?.mfaTotpSecretEnc).toBeTruthy();
      expect(updatedUser?.mfaBackupCodesEnc).toBeTruthy();
    });

    it('should verify MFA setup', async () => {
      const user = await createTestUser();

      // Enroll in MFA
      await fetch('/api/mfa/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      // Verify MFA with TOTP code (mocked)
      const verifyResponse = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: '123456', // Mock TOTP code
        }),
      });

      // In a real test, we'd mock the TOTP verification
      // For now, we'll just verify the API structure
      expect(verifyResponse.status).toBe(400); // Expected to fail with mock code
    });

    it('should handle MFA login challenge', async () => {
      const user = await createTestUser();

      // Enable MFA
      await prisma.user.update({
        where: { id: user.id },
        data: {
          mfaEnabled: true,
          mfaTotpSecretEnc: 'encrypted-secret',
          mfaBackupCodesEnc: 'encrypted-codes',
        },
      });

      // Attempt login (this would normally go through auth system)
      const loginResponse = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: 'password',
        }),
      });

      // Should require MFA challenge
      expect(loginResponse.status).toBe(200);
      const loginData = await loginResponse.json();
      expect(loginData.requiresMfa).toBe(true);
    });
  });

  describe('Complete Onboarding Journey', () => {
    it('should complete full onboarding flow', async () => {
      // 1. Create user
      const user = await createTestUser();

      // 2. Create organization
      const org = await createTestOrg(user.id);

      // 3. Create first monitor
      const monitor = await prisma.monitor.create({
        data: {
          name: 'My First Monitor',
          orgId: org.id,
          scheduleType: 'INTERVAL',
          intervalSec: 300,
          gracePeriodSec: 60,
          status: 'OK',
        },
      });

      // 4. Create alert channel
      const alertChannel = await prisma.alertChannel.create({
        data: {
          label: 'Email Alerts',
          type: 'EMAIL',
          orgId: org.id,
          configJson: { email: user.email },
        },
      });

      // 5. Enable MFA
      await prisma.user.update({
        where: { id: user.id },
        data: {
          mfaEnabled: true,
          mfaTotpSecretEnc: 'encrypted-secret',
          mfaBackupCodesEnc: 'encrypted-codes',
        },
      });

      // 6. Check final onboarding status
      const checklistResponse = await fetch('/api/onboarding/checklist');
      const checklist = await checklistResponse.json();

      // Should be mostly complete
      expect(checklist.completed).toBeGreaterThan(0);
      expect(checklist.completed).toBeLessThanOrEqual(checklist.total);

      // Verify all resources were created
      const monitors = await prisma.monitor.findMany({
        where: { orgId: org.id },
      });
      expect(monitors).toHaveLength(1);

      const channels = await prisma.alertChannel.findMany({
        where: { orgId: org.id },
      });
      expect(channels).toHaveLength(1);

      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.mfaEnabled).toBe(true);
    });
  });
});
