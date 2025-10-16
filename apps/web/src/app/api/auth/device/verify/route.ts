import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

/**
 * Verify and authorize a device code
 * 
 * POST /api/auth/device/verify
 * Body: { user_code: string }
 * Requires: Authenticated session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in first.' },
        { status: 401 }
      );
    }

    const { user_code } = await request.json();

    if (!user_code) {
      return NextResponse.json(
        { error: 'user_code is required' },
        { status: 400 }
      );
    }

    // Find device code
    const result: any = await prisma.$queryRaw`
      SELECT device_code, user_code, expires_at, authorized
      FROM device_codes
      WHERE user_code = ${user_code}
      AND authorized = false
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or already used code' },
        { status: 400 }
      );
    }

    const deviceData = result[0];

    // Check expiration
    if (new Date() > new Date(deviceData.expires_at)) {
      return NextResponse.json(
        { error: 'Code has expired. Please start a new login flow.' },
        { status: 400 }
      );
    }

    // Get user's org
    const membership = await prisma.membership.findFirst({
      where: {
        user: {
          email: session.user.email,
        },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'No organization found for user' },
        { status: 404 }
      );
    }

    // Generate API key
    const apiKey = `pgk_${crypto.randomBytes(32).toString('hex')}`;
    const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Create API key in database
    const createdKey = await prisma.apiKey.create({
      data: {
        name: 'CLI Device Auth',
        tokenHash: apiKeyHash,
        userId: session.user.id,
        orgId: membership.orgId,
      },
    });

    // Mark device code as authorized and store API key
    await prisma.$executeRaw`
      UPDATE device_codes
      SET authorized = true,
          api_key = ${apiKey},
          user_id = ${session.user.id},
          authorized_at = NOW()
      WHERE device_code = ${deviceData.device_code}
    `;

    return NextResponse.json({
      success: true,
      message: 'Device authorized successfully!',
    });
  } catch (error) {
    console.error('Device verify error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





