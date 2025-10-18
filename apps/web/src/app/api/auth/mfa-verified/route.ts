import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/mfa-verified
 * Set a cookie to indicate MFA has been verified for this session
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Set a secure cookie that expires with the session
    cookieStore.set('mfa-verified', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error setting MFA verified cookie:', error);
    return NextResponse.json(
      { error: 'Failed to set verification status' },
      { status: 500 }
    );
  }
}

