import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { authenticator } from '@otplib/preset-default';
import QRCode from 'qrcode';
import { encrypt } from '@tokiflow/shared';
import { randomBytes } from 'crypto';

/**
 * POST /api/mfa/enroll
 * Generate and store TOTP secret for MFA enrollment
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if MFA is already enabled
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mfaEnabled: true, mfaTotpSecretEnc: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.mfaEnabled) {
      return NextResponse.json({ error: 'MFA is already enabled' }, { status: 400 });
    }

    // Generate TOTP secret
    const secret = authenticator.generateSecret();
    const encryptedSecret = encrypt(secret);

    // Generate QR code data URL
    const appName = process.env.NEXTAUTH_URL ? 
      new URL(process.env.NEXTAUTH_URL).hostname : 
      'Saturn Monitoring';
    
    const otpauthUrl = authenticator.keyuri(
      session.user.email || 'user',
      appName,
      secret
    );

    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    // Store encrypted secret in database
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            mfaTotpSecretEnc: encryptedSecret,
            mfaEnabled: false, // Will be enabled after verification
          },
        });

        // Log MFA enrollment initiation
        const { createAuditLog, AuditAction } = await import('@/lib/audit');
        const membership = await prisma.membership.findFirst({
          where: { userId: session.user.id },
        });
        
        if (membership) {
          await createAuditLog({
            action: AuditAction.MFA_ENABLED,
            orgId: membership.orgId,
            userId: session.user.id,
            meta: { step: 'enrollment_initiated' },
          });
        }

        return NextResponse.json({
          secret,
          qrCode: qrCodeDataUrl,
          manualEntryKey: secret,
        });
  } catch (error) {
    console.error('MFA enrollment error:', error);
    return NextResponse.json(
      { error: 'Failed to enroll in MFA' },
      { status: 500 }
    );
  }
}