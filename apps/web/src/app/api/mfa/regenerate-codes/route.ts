import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/mfa/regenerate-codes
 * Regenerate backup codes (requires valid OTP)
 */
export async function POST(req: NextRequest) {
  // MFA API disabled - schema doesn't include MFA fields
  return NextResponse.json({ error: 'MFA not implemented' }, { status: 501 });
}