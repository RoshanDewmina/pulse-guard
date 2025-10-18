'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { AlertCircle, Shield } from 'lucide-react';

export default function MFAChallengePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [code, setCode] = useState('');
  const [isBackupCode, setIsBackupCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const callbackUrl = searchParams.get('callbackUrl') || '/app';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.replace(/[^A-Z0-9]/gi, ''), // Remove dashes and spaces
          isBackupCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Set session flag via API to mark MFA as verified
      await fetch('/api/auth/mfa-verified', {
        method: 'POST',
      });

      // Redirect to callback URL
      window.location.href = callbackUrl;
    } catch (error: any) {
      setError(error.message || 'Verification failed');
      setIsLoading(false);
      setCode('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#37322F] mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#37322F] mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-[rgba(55,50,47,0.60)] font-sans">
            Enter the code from your authenticator app
          </p>
        </div>

        <SaturnCard>
          <SaturnCardContent>
            {error && (
              <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-sans">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <SaturnLabel htmlFor="code">
                  {isBackupCode ? 'Backup Code' : 'Authentication Code'}
                </SaturnLabel>
                <SaturnInput
                  id="code"
                  type="text"
                  placeholder={isBackupCode ? 'XXXXX-XXXXX' : '123456'}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={isLoading}
                  fullWidth
                  autoFocus
                  autoComplete="one-time-code"
                />
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                  {isBackupCode
                    ? 'Enter one of your backup codes'
                    : 'Enter the 6-digit code from your authenticator app'}
                </p>
              </div>

              <SaturnButton
                type="submit"
                disabled={isLoading || !code.trim()}
                loading={isLoading}
                fullWidth
              >
                Verify
              </SaturnButton>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsBackupCode(!isBackupCode);
                    setCode('');
                    setError('');
                  }}
                  className="text-sm text-[rgba(55,50,47,0.60)] hover:text-[#37322F] transition-colors font-sans"
                >
                  {isBackupCode
                    ? 'Use authenticator code instead'
                    : 'Use backup code instead'}
                </button>
              </div>
            </form>
          </SaturnCardContent>
        </SaturnCard>

        <div className="mt-6 text-center">
          <a
            href="/auth/signout"
            className="text-sm text-[rgba(55,50,47,0.60)] hover:text-[#37322F] transition-colors font-sans"
          >
            Sign out
          </a>
        </div>
      </div>
    </div>
  );
}

