import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/mfa/disable
 * Disable MFA (requires valid OTP or backup code)
 */
export async function POST(req: NextRequest) {
  // MFA API disabled - schema doesn't include MFA fields
  return NextResponse.json({ error: 'MFA not implemented' }, { status: 501 });
}