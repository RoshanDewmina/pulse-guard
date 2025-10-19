import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { authenticator } from '@otplib/preset-default';
import { encrypt, decrypt } from '@tokiflow/shared';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { z } from 'zod';

const regenerateSchema = z.object({
  code: z.string().length(6).regex(/^\d{6}$/),
});

/**
 * POST /api/mfa/regenerate-codes
 * Regenerate backup codes (requires valid OTP)
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { code } = regenerateSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        mfaEnabled: true,
        mfaTotpSecretEnc: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.mfaEnabled) {
      return NextResponse.json({ error: 'MFA is not enabled' }, { status: 400 });
    }

    if (!user.mfaTotpSecretEnc) {
      return NextResponse.json({ error: 'No TOTP secret found' }, { status: 400 });
    }

    // Verify TOTP code
    const secret = decrypt(user.mfaTotpSecretEnc);
    const isValid = authenticator.verify({ token: code, secret });

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
    }

    // Generate new backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      randomBytes(4).toString('hex').toUpperCase()
    );
    
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => bcrypt.hash(code, 12))
    );

    // Update backup codes in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        mfaBackupCodesEnc: encrypt(JSON.stringify(hashedBackupCodes)),
      },
    });

    // Log backup codes regenerated
    const { createAuditLog, AuditAction } = await import('@/lib/audit');
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
    });
    
    if (membership) {
      await createAuditLog({
        action: AuditAction.MFA_BACKUP_CODES_REGENERATED,
        orgId: membership.orgId,
        userId: session.user.id,
        meta: { count: backupCodes.length },
      });
    }

    return NextResponse.json({
      success: true,
      backupCodes, // Return plain backup codes
    });
  } catch (error) {
    console.error('MFA regenerate codes error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to regenerate backup codes' },
      { status: 500 }
    );
  }
}