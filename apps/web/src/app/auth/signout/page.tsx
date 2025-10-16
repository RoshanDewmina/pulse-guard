'use client'

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { 
  SaturnCard, 
  SaturnCardHeader, 
  SaturnCardTitle, 
  SaturnCardDescription, 
  SaturnCardContent, 
  SaturnButton 
} from '@/components/saturn';
import Link from 'next/link';
import { LogOut } from 'lucide-react';

export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-[#37322F] rounded-lg"></div>
            <span className="text-2xl font-bold text-[#37322F] font-sans">Saturn</span>
          </Link>
          <p className="text-[rgba(55,50,47,0.80)] font-sans">Monitor your cron jobs with confidence</p>
        </div>

        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h2">Sign Out</SaturnCardTitle>
            <SaturnCardDescription>
              Are you sure you want to sign out?
            </SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-center py-6">
                <LogOut className="w-16 h-16 text-[rgba(55,50,47,0.40)]" />
              </div>

              <SaturnButton
                onClick={handleSignOut}
                fullWidth
                disabled={isSigningOut}
                loading={isSigningOut}
              >
                Sign Out
              </SaturnButton>

              <Link href="/app">
                <SaturnButton
                  variant="secondary"
                  fullWidth
                  disabled={isSigningOut}
                >
                  Cancel
                </SaturnButton>
              </Link>
            </div>
          </SaturnCardContent>
        </SaturnCard>

        <p className="text-center text-xs text-[rgba(55,50,47,0.60)] font-sans">
          You&apos;ll be redirected to the home page after signing out
        </p>
      </div>
    </div>
  );
}
