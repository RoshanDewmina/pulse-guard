import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';

export const runtime = 'nodejs';

/**
 * Poll for device authorization
 * 
 * POST /api/auth/device/poll
 * Body: { device_code: string }
 * Returns: authorization status or pending
 */
export async function POST(request: NextRequest) {
  try {
    const { device_code } = await request.json();

    if (!device_code || !device_code.startsWith('dc_')) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Invalid device_code' },
        { status: 400 }
      );
    }

    // Check device code status
    const result: any = await prisma.$queryRaw`
      SELECT device_code, user_code, expires_at, authorized, api_key, user_id
      FROM device_codes
      WHERE device_code = ${device_code}
      LIMIT 1
    `;

    if (!result || result.length === 0) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Device code not found' },
        { status: 400 }
      );
    }

    const deviceData = result[0];

    // Check expiration
    if (new Date() > new Date(deviceData.expires_at)) {
      return NextResponse.json(
        { error: 'expired_token', error_description: 'Device code has expired' },
        { status: 400 }
      );
    }

    // Check if authorized
    if (!deviceData.authorized) {
      return NextResponse.json(
        { error: 'authorization_pending', error_description: 'User has not yet authorized' },
        { status: 400 }
      );
    }

    // Return API key
    if (deviceData.api_key) {
      return NextResponse.json({
        access_token: deviceData.api_key,
        token_type: 'Bearer',
        expires_in: 31536000, // 1 year
      });
    }

    // Authorized but no API key yet (race condition)
    return NextResponse.json(
      { error: 'authorization_pending', error_description: 'Authorization in progress' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Device poll error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal server error' },
      { status: 500 }
    );
  }
}





