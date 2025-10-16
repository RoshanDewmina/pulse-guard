'use client'

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnInput,
  SaturnLabel,
} from '@/components/saturn';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/',
      });

      if (result?.error) {
        setError(result.error);
      } else if (result?.ok) {
        router.push('/app');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      setError('An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/app' });
  };

  return (
    <>
      <div
        className="min-h-screen bg-[#F7F5F3] flex items-center justify-center p-4"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 200, 255, 0.2) 0%, transparent 50%)
          `,
        }}
      >
        <div className="w-full max-w-md space-y-6">
          <SaturnCard>
            <SaturnCardHeader>
              <SaturnCardTitle as="h2">Sign In</SaturnCardTitle>
              <SaturnCardDescription>
                Enter your email and password to access your account
              </SaturnCardDescription>
            </SaturnCardHeader>
            <SaturnCardContent>
              <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-sans">
                    {error}
                  </div>
                )}
                
                <div className="space-y-2">
                  <SaturnLabel htmlFor="email" required>Email</SaturnLabel>
                  <SaturnInput
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    fullWidth
                  />
                </div>

                <div className="space-y-2">
                  <SaturnLabel htmlFor="password" required>Password</SaturnLabel>
                  <SaturnInput
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    fullWidth
                  />
                </div>

                <SaturnButton 
                  type="submit" 
                  fullWidth 
                  disabled={isLoading}
                  loading={isLoading}
                >
                  Sign In
                </SaturnButton>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-[rgba(55,50,47,0.12)]" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-[rgba(55,50,47,0.60)] font-sans">Or continue with</span>
                  </div>
                </div>

                <SaturnButton
                  type="button"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="min-h-[48px]"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="whitespace-nowrap">Sign in with Google</span>
                </SaturnButton>
              </form>

              <p className="text-center text-sm text-[rgba(55,50,47,0.80)] font-sans mt-4">
                Don&apos;t have an account?{' '}
                <Link href="/auth/signup" className="text-[#37322F] hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </SaturnCardContent>
          </SaturnCard>

          <p className="text-center text-xs text-[rgba(55,50,47,0.60)] font-sans">
            By signing in, you agree to our{' '}
            <Link href="/legal/terms" className="text-[#37322F] hover:underline">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link href="/legal/privacy" className="text-[#37322F] hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
