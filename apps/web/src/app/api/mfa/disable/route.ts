import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { authenticator } from '@otplib/preset-default';
import { decrypt } from '@tokiflow/shared';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const disableSchema = z.object({
  code: z.string().min(6).max(8),
  isBackupCode: z.boolean().optional().default(false),
});

/**
 * POST /api/mfa/disable
 * Disable MFA (requires valid OTP or backup code)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code, isBackupCode } = disableSchema.parse(body);

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

    if (!user.mfaEnabled) {
      return NextResponse.json({ error: 'MFA is not enabled' }, { status: 400 });
    }

    let isValid = false;

    if (isBackupCode) {
      // Verify backup code
      if (!user.mfaBackupCodesEnc) {
        return NextResponse.json({ error: 'No backup codes available' }, { status: 400 });
      }

      const backupCodes = JSON.parse(decrypt(user.mfaBackupCodesEnc));
      isValid = backupCodes.some((hashedCode: string) => 
        bcrypt.compareSync(code, hashedCode)
      );
    } else {
      // Verify TOTP code
      if (!user.mfaTotpSecretEnc) {
        return NextResponse.json({ error: 'No TOTP secret found' }, { status: 400 });
      }

      const secret = decrypt(user.mfaTotpSecretEnc);
      isValid = authenticator.verify({ token: code, secret });
    }

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Disable MFA
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            mfaEnabled: false,
            mfaTotpSecretEnc: null,
            mfaBackupCodesEnc: null,
            mfaLastVerifiedAt: null,
          },
        });

        // Log MFA disabled
        const { createAuditLog, AuditAction } = await import('@/lib/audit');
        const membership = await prisma.membership.findFirst({
          where: { userId: session.user.id },
        });
        
        if (membership) {
          await createAuditLog({
            action: AuditAction.MFA_DISABLED,
            orgId: membership.orgId,
            userId: session.user.id,
            meta: { method: isBackupCode ? 'backup_code' : 'totp' },
          });
        }

        return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MFA disable error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to disable MFA' },
      { status: 500 }
    );
  }
}