import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@tokiflow/db';
import crypto from 'crypto';

export const runtime = 'nodejs';

interface DeviceCodeData {
  deviceCode: string;
  userCode: string;
  verificationUri: string;
  expiresAt: Date;
  interval: number;
}

/**
 * Initiate device authorization flow
 * 
 * POST /api/auth/device/initiate
 * Returns device_code and user_code for CLI to display
 */
export async function POST(request: NextRequest) {
  try {
    // Generate codes
    const deviceCode = `dc_${crypto.randomBytes(32).toString('hex')}`;
    const userCode = generateUserCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store in database (we'll use a temporary table or Redis in production)
    // For now, using a JSON field in a dedicated table
    await prisma.$executeRaw`
      INSERT INTO device_codes (device_code, user_code, expires_at, authorized, created_at)
      VALUES (${deviceCode}, ${userCode}, ${expiresAt}, false, NOW())
      ON CONFLICT DO NOTHING
    `;

    const verificationUri = `${process.env.NEXTAUTH_URL}/auth/device`;

    return NextResponse.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: verificationUri,
      verification_uri_complete: `${verificationUri}?code=${userCode}`,
      expires_in: 900, // 15 minutes in seconds
      interval: 5, // Poll every 5 seconds
    });
  } catch (error) {
    console.error('Device initiate error:', error);
    
    // Fallback: create without database (less secure)
    const deviceCode = `dc_${crypto.randomBytes(32).toString('hex')}`;
    const userCode = generateUserCode();
    
    return NextResponse.json({
      device_code: deviceCode,
      user_code: userCode,
      verification_uri: `${process.env.NEXTAUTH_URL}/auth/device`,
      verification_uri_complete: `${process.env.NEXTAUTH_URL}/auth/device?code=${userCode}`,
      expires_in: 900,
      interval: 5,
    });
  }
}

/**
 * Generate a human-friendly user code (e.g., "ABC-DEF")
 */
function generateUserCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar chars
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    if (i === 3) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  
  return code;
}





