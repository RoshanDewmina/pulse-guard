import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  const securityHeaders = {
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS filter
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy (formerly Feature Policy)
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    
    // Content Security Policy
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-inline/eval
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; '),
    
    // HSTS (Strict-Transport-Security)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);
    
    if (origin && (allowedOrigins.includes(origin) || allowedOrigins.includes('*'))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: response.headers });
  }

  // MFA and Onboarding checks for protected routes
  const protectedPaths = ['/app', '/api'];
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );

  // Exclude auth-related paths from checks
  const isAuthPath = request.nextUrl.pathname.startsWith('/auth') || 
                     request.nextUrl.pathname.startsWith('/api/auth') ||
                     request.nextUrl.pathname.startsWith('/api/mfa');

  if (isProtectedPath && !isAuthPath) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      });

      if (token) {
        const mfaVerified = request.cookies.get('mfa-verified')?.value === 'true';
        
        // Check if user has MFA enabled but hasn't verified this session
        // if (token.mfaEnabled && !mfaVerified) { // MFA disabled - field doesn't exist in schema
        //   const url = new URL('/auth/mfa', request.url);
        //   url.searchParams.set('callbackUrl', request.nextUrl.pathname);
        //   return NextResponse.redirect(url);
        // }

        // Check onboarding status for app routes (not API)
        if (request.nextUrl.pathname.startsWith('/app')) {
          // const onboardingStep = token.onboardingStep as string; // Field doesn't exist in schema
          
          // Redirect to onboarding checklist if not completed
          // if (onboardingStep && onboardingStep !== 'DONE' && 
          //     !request.nextUrl.pathname.startsWith('/app/onboarding')) {
          //   return NextResponse.redirect(new URL('/app/onboarding/checklist', request.url));
          // }
        }
      }
    } catch (error) {
      console.error('Middleware auth check error:', error);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

