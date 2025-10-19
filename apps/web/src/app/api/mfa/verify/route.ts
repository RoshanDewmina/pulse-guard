import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { authenticator } from '@otplib/preset-default';
import { encrypt, decrypt } from '@tokiflow/shared';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const verifySchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
  isBackupCode: z.boolean().optional().default(false),
});

/**
 * POST /api/mfa/verify
 * Verify TOTP code and complete MFA enrollment
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code, isBackupCode } = verifySchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        mfaEnabled: true,
        mfaTotpSecretEnc: true,
        mfaBackupCodesEnc: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (isBackupCode) {
      // Verify backup code
      if (!user.mfaBackupCodesEnc) {
        return NextResponse.json({ error: 'No backup codes available' }, { status: 400 });
      }

      const backupCodes = JSON.parse(decrypt(user.mfaBackupCodesEnc));
      const isValidBackupCode = backupCodes.some((hashedCode: string) => 
        bcrypt.compareSync(code, hashedCode)
      );

      if (!isValidBackupCode) {
        return NextResponse.json({ error: 'Invalid backup code' }, { status: 400 });
      }

      // If this is during enrollment, enable MFA
      if (!user.mfaEnabled) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: { mfaEnabled: true },
        });
      }

      return NextResponse.json({ success: true });
    } else {
      // Verify TOTP code
      if (!user.mfaTotpSecretEnc) {
        return NextResponse.json({ error: 'No TOTP secret found' }, { status: 400 });
      }

      const secret = decrypt(user.mfaTotpSecretEnc);
      const isValid = authenticator.verify({ token: code, secret });

      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      // If this is during enrollment, enable MFA and generate backup codes
      if (!user.mfaEnabled) {
        // Generate 10 backup codes
        const backupCodes = Array.from({ length: 10 }, () => 
          randomBytes(4).toString('hex').toUpperCase()
        );
        
        const hashedBackupCodes = await Promise.all(
          backupCodes.map(code => bcrypt.hash(code, 12))
        );

        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            mfaEnabled: true,
            mfaBackupCodesEnc: encrypt(JSON.stringify(hashedBackupCodes)),
            mfaLastVerifiedAt: new Date(),
          },
        });

        // Log MFA enabled and backup codes generated
        const { createAuditLog, AuditAction } = await import('@/lib/audit');
        const membership = await prisma.membership.findFirst({
          where: { userId: session.user.id },
        });
        
        if (membership) {
          await Promise.all([
            createAuditLog({
              action: AuditAction.MFA_ENABLED,
              orgId: membership.orgId,
              userId: session.user.id,
              meta: { step: 'enrollment_completed' },
            }),
            createAuditLog({
              action: AuditAction.MFA_BACKUP_CODES_GENERATED,
              orgId: membership.orgId,
              userId: session.user.id,
              meta: { count: backupCodes.length },
            }),
          ]);
        }

        return NextResponse.json({
          success: true,
          backupCodes, // Return plain backup codes only during enrollment
        });
      } else {
        // Update last verified time
        await prisma.user.update({
          where: { id: session.user.id },
          data: { mfaLastVerifiedAt: new Date() },
        });

        // Log MFA verification
        const { createAuditLog, AuditAction } = await import('@/lib/audit');
        const membership = await prisma.membership.findFirst({
          where: { userId: session.user.id },
        });
        
        if (membership) {
          await createAuditLog({
            action: AuditAction.MFA_VERIFIED,
            orgId: membership.orgId,
            userId: session.user.id,
            meta: { method: 'totp' },
          });
        }

        return NextResponse.json({ success: true });
      }
    }
  } catch (error) {
    console.error('MFA verification error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to verify MFA code' },
      { status: 500 }
    );
  }
}