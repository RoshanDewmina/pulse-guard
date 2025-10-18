import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/mfa/status
 * Get MFA status for the current user
 */
export async function GET(req: NextRequest) {
  // MFA API disabled - schema doesn't include MFA fields
  return NextResponse.json({ 
    mfaEnabled: false,
    remainingBackupCodes: 0,
    lastVerifiedAt: null,
  });
}