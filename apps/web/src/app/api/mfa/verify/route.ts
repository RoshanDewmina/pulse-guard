import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/mfa/verify
 * Verify TOTP code and complete MFA enrollment
 */
export async function POST(req: NextRequest) {
  // MFA API disabled - schema doesn't include MFA fields
  return NextResponse.json({ error: 'MFA not implemented' }, { status: 501 });
}