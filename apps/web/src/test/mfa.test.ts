import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as enrollMFA } from '@/app/api/mfa/enroll/route';
import { POST as verifyMFA } from '@/app/api/mfa/verify/route';
import { POST as disableMFA } from '@/app/api/mfa/disable/route';
import { POST as regenerateCodes } from '@/app/api/mfa/regenerate-codes/route';
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

// Mock crypto functions
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => Buffer.from('test-random-bytes')),
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  hash: jest.fn((data: string) => Promise.resolve(`hashed-${data}`)),
  compareSync: jest.fn((data: string, hash: string) => hash === `hashed-${data}`),
}));

// Mock encryption
jest.mock('@tokiflow/shared', () => ({
  encrypt: jest.fn((data: string) => `encrypted-${data}`),
  decrypt: jest.fn((data: string) => data.replace('encrypted-', '')),
}));

// Mock QR code generation
jest.mock('qrcode', () => ({
  toDataURL: jest.fn(() => Promise.resolve('data:image/png;base64,test-qr-code')),
}));

// Mock TOTP
jest.mock('@otplib/preset-default', () => ({
  authenticator: {
    generateSecret: jest.fn(() => 'test-secret'),
    keyuri: jest.fn(() => 'otpauth://totp/test@example.com?secret=test-secret'),
    verify: jest.fn(() => true),
  },
}));

describe('MFA API Endpoints', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' },
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
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' },
    });
  });

  describe('POST /api/mfa/enroll', () => {
    it('should enroll user in MFA successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/mfa/enroll', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await enrollMFA(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('secret');
      expect(data).toHaveProperty('qrCode');
      expect(data).toHaveProperty('manualEntryKey');
      expect(data.secret).toBe('test-secret');
      expect(data.qrCode).toBe('data:image/png;base64,test-qr-code');
    });

    it('should return error if MFA already enabled', async () => {
      // Enable MFA first
      await prisma.user.update({
        where: { id: 'test-user-id' },
        data: { mfaEnabled: true },
      });

      const request = new NextRequest('http://localhost:3000/api/mfa/enroll', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      const response = await enrollMFA(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MFA is already enabled');
    });
  });

  describe('POST /api/mfa/verify', () => {
    beforeEach(async () => {
      // Set up user with MFA secret but not enabled
      await prisma.user.update({
        where: { id: 'test-user-id' },
        data: {
          mfaTotpSecretEnc: 'encrypted-test-secret',
          mfaEnabled: false,
        },
      });
    });

    it('should verify TOTP code and enable MFA', async () => {
      const request = new NextRequest('http://localhost:3000/api/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({
          code: '123456',
          isBackupCode: false,
        }),
      });

      const response = await verifyMFA(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('backupCodes');
      expect(data.backupCodes).toHaveLength(10);

      // Verify MFA is enabled
      const user = await prisma.user.findUnique({
        where: { id: 'test-user-id' },
      });
      expect(user?.mfaEnabled).toBe(true);
    });

    it('should verify backup code', async () => {
      // Set up user with MFA enabled and backup codes
      const backupCodes = ['backup1', 'backup2', 'backup3'];
      const hashedCodes = await Promise.all(
        backupCodes.map(code => `hashed-${code}`)
      );

      await prisma.user.update({
        where: { id: 'test-user-id' },
        data: {
          mfaEnabled: true,
          mfaBackupCodesEnc: 'encrypted-' + JSON.stringify(hashedCodes),
        },
      });

      const request = new NextRequest('http://localhost:3000/api/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({
          code: 'backup1',
          isBackupCode: true,
        }),
      });

      const response = await verifyMFA(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('POST /api/mfa/disable', () => {
    beforeEach(async () => {
      // Set up user with MFA enabled
      await prisma.user.update({
        where: { id: 'test-user-id' },
        data: {
          mfaEnabled: true,
          mfaTotpSecretEnc: 'encrypted-test-secret',
          mfaBackupCodesEnc: 'encrypted-[]',
        },
      });
    });

    it('should disable MFA with valid TOTP code', async () => {
      const request = new NextRequest('http://localhost:3000/api/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({
          code: '123456',
          isBackupCode: false,
        }),
      });

      const response = await disableMFA(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify MFA is disabled
      const user = await prisma.user.findUnique({
        where: { id: 'test-user-id' },
      });
      expect(user?.mfaEnabled).toBe(false);
      expect(user?.mfaTotpSecretEnc).toBeNull();
      expect(user?.mfaBackupCodesEnc).toBeNull();
    });
  });

  describe('POST /api/mfa/regenerate-codes', () => {
    beforeEach(async () => {
      // Set up user with MFA enabled
      await prisma.user.update({
        where: { id: 'test-user-id' },
        data: {
          mfaEnabled: true,
          mfaTotpSecretEnc: 'encrypted-test-secret',
          mfaBackupCodesEnc: 'encrypted-[]',
        },
      });
    });

    it('should regenerate backup codes', async () => {
      const request = new NextRequest('http://localhost:3000/api/mfa/regenerate-codes', {
        method: 'POST',
        body: JSON.stringify({
          code: '123456',
        }),
      });

      const response = await regenerateCodes(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('backupCodes');
      expect(data.backupCodes).toHaveLength(10);
    });
  });
});
