import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST as enrollPost } from '../mfa/enroll/route';
import { POST as verifyPost } from '../mfa/verify/route';
import { GET as statusGet } from '../mfa/status/route';
import { POST as disablePost } from '../mfa/disable/route';
import { POST as regeneratePost } from '../mfa/regenerate-codes/route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('@tokiflow/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@tokiflow/shared', () => ({
  encrypt: vi.fn((text: string) => `encrypted_${text}`),
  decrypt: vi.fn((text: string) => text.replace('encrypted_', '')),
}));

vi.mock('@otplib/preset-default', () => ({
  authenticator: {
    generateSecret: vi.fn(() => 'JBSWY3DPEHPK3PXP'),
    keyuri: vi.fn((user: string, service: string, secret: string) => 
      `otpauth://totp/${service}:${user}?secret=${secret}&issuer=${service}`
    ),
    verify: vi.fn(({ token, secret }) => token === '123456'),
  },
}));

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,test-qr-code')),
  },
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn((code: string) => Promise.resolve(`hashed_${code}`)),
    compareSync: vi.fn((code: string, hash: string) => hash === `hashed_${code}`),
  },
}));

vi.mock('crypto', () => ({
  randomBytes: vi.fn((size: number) => Buffer.from('test'.repeat(size))),
}));

import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';
import { encrypt, decrypt } from '@tokiflow/shared';
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';
import bcrypt from 'bcryptjs';

describe('MFA API endpoints', () => {
  const mockSession = {
    user: {
      id: 'user-123',
      email: 'test@example.com',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getServerSession as any).mockResolvedValue(mockSession);
  });

  describe('POST /api/mfa/enroll', () => {
    it('should enroll user in MFA successfully', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: false,
        mfaTotpSecretEnc: null,
      });
      (prisma.user.update as any).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/mfa/enroll', {
        method: 'POST',
      });

      const response = await enrollPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('secret', 'JBSWY3DPEHPK3PXP');
      expect(data).toHaveProperty('qrCode', 'data:image/png;base64,test-qr-code');
      expect(data).toHaveProperty('manualEntryKey', 'JBSWY3DPEHPK3PXP');
      expect(encrypt).toHaveBeenCalledWith('JBSWY3DPEHPK3PXP');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          mfaTotpSecretEnc: 'encrypted_JBSWY3DPEHPK3PXP',
          mfaEnabled: false,
        },
      });
    });

    it('should return error if user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/mfa/enroll', {
        method: 'POST',
      });

      const response = await enrollPost(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should return error if MFA already enabled', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: true,
        mfaTotpSecretEnc: 'existing-secret',
      });

      const request = new NextRequest('http://localhost:3000/api/mfa/enroll', {
        method: 'POST',
      });

      const response = await enrollPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MFA is already enabled');
    });

    it('should return error if not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/mfa/enroll', {
        method: 'POST',
      });

      const response = await enrollPost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/mfa/verify', () => {
    it('should verify TOTP code and complete enrollment', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: false,
        mfaTotpSecretEnc: 'encrypted_secret',
        mfaBackupCodesEnc: null,
      });
      (prisma.user.update as any).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: '123456' }),
      });

      const response = await verifyPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('backupCodes');
      expect(data.backupCodes).toHaveLength(10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          mfaEnabled: true,
          mfaBackupCodesEnc: expect.stringContaining('encrypted_'),
          mfaLastVerifiedAt: expect.any(Date),
        },
      });
    });

    it('should verify TOTP code for existing MFA user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: true,
        mfaTotpSecretEnc: 'encrypted_secret',
        mfaBackupCodesEnc: 'encrypted_codes',
      });
      (prisma.user.update as any).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: '123456' }),
      });

      const response = await verifyPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).not.toHaveProperty('backupCodes');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { mfaLastVerifiedAt: expect.any(Date) },
      });
    });

    it('should verify backup code', async () => {
      const backupCodes = ['hashed_code1', 'hashed_code2'];
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: false,
        mfaTotpSecretEnc: 'encrypted_secret',
        mfaBackupCodesEnc: 'encrypted_backup_codes',
      });
      (decrypt as any).mockReturnValue(JSON.stringify(backupCodes));
      (bcrypt.compareSync as any).mockReturnValue(true);
      (prisma.user.update as any).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: 'code1', isBackupCode: true }),
      });

      const response = await verifyPost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: { mfaEnabled: true },
      });
    });

    it('should return error for invalid TOTP code', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: true,
        mfaTotpSecretEnc: 'encrypted_secret',
        mfaBackupCodesEnc: 'encrypted_codes',
      });
      (authenticator.verify as any).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: '000000' }),
      });

      const response = await verifyPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid verification code');
    });

    it('should return error for invalid backup code', async () => {
      const backupCodes = ['hashed_code1', 'hashed_code2'];
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: true,
        mfaTotpSecretEnc: 'encrypted_secret',
        mfaBackupCodesEnc: 'encrypted_backup_codes',
      });
      (decrypt as any).mockReturnValue(JSON.stringify(backupCodes));
      (bcrypt.compareSync as any).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: 'invalid', isBackupCode: true }),
      });

      const response = await verifyPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid backup code');
    });

    it('should return error for invalid input', async () => {
      const request = new NextRequest('http://localhost:3000/api/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: '123' }), // Too short
      });

      const response = await verifyPost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input');
    });

    it('should return error if not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ code: '123456' }),
      });

      const response = await verifyPost(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('GET /api/mfa/status', () => {
    it('should return MFA status for enabled user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: true,
        mfaLastVerifiedAt: new Date('2023-01-01'),
      });

      const request = new NextRequest('http://localhost:3000/api/mfa/status');
      const response = await statusGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        enabled: true,
        lastVerifiedAt: '2023-01-01T00:00:00.000Z',
      });
    });

    it('should return MFA status for disabled user', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: false,
        mfaLastVerifiedAt: null,
      });

      const request = new NextRequest('http://localhost:3000/api/mfa/status');
      const response = await statusGet(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        enabled: false,
        lastVerifiedAt: null,
      });
    });

    it('should return error if not authenticated', async () => {
      (getServerSession as any).mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3000/api/mfa/status');
      const response = await statusGet(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('POST /api/mfa/disable', () => {
    it('should disable MFA successfully', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: true,
        mfaTotpSecretEnc: 'encrypted_secret',
        mfaBackupCodesEnc: 'encrypted_codes',
      });
      (prisma.user.update as any).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ code: '123456' }),
      });

      const response = await disablePost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          mfaEnabled: false,
          mfaTotpSecretEnc: null,
          mfaBackupCodesEnc: null,
          mfaLastVerifiedAt: null,
        },
      });
    });

    it('should return error for invalid verification code', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: true,
        mfaTotpSecretEnc: 'encrypted_secret',
        mfaBackupCodesEnc: 'encrypted_codes',
      });
      (authenticator.verify as any).mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/mfa/disable', {
        method: 'POST',
        body: JSON.stringify({ code: '000000' }),
      });

      const response = await disablePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid verification code');
    });
  });

  describe('POST /api/mfa/regenerate-codes', () => {
    it('should regenerate backup codes successfully', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: true,
        mfaTotpSecretEnc: 'encrypted_secret',
        mfaBackupCodesEnc: 'encrypted_codes',
      });
      (prisma.user.update as any).mockResolvedValue({});

      const request = new NextRequest('http://localhost:3000/api/mfa/regenerate-codes', {
        method: 'POST',
        body: JSON.stringify({ code: '123456' }),
      });

      const response = await regeneratePost(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('backupCodes');
      expect(data.backupCodes).toHaveLength(10);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-123' },
        data: {
          mfaBackupCodesEnc: expect.stringContaining('encrypted_'),
        },
      });
    });

    it('should return error if MFA not enabled', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: false,
        mfaTotpSecretEnc: null,
        mfaBackupCodesEnc: null,
      });

      const request = new NextRequest('http://localhost:3000/api/mfa/regenerate-codes', {
        method: 'POST',
        body: JSON.stringify({ code: '123456' }),
      });

      const response = await regeneratePost(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('MFA is not enabled');
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as any).mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/mfa/enroll', {
        method: 'POST',
      });

      const response = await enrollPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to enroll in MFA');
    });

    it('should handle encryption errors gracefully', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({
        mfaEnabled: false,
        mfaTotpSecretEnc: null,
      });
      (encrypt as any).mockImplementation(() => {
        throw new Error('Encryption failed');
      });

      const request = new NextRequest('http://localhost:3000/api/mfa/enroll', {
        method: 'POST',
      });

      const response = await enrollPost(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to enroll in MFA');
    });
  });
});
