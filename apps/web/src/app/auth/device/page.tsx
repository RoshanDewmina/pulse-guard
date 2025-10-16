'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Smartphone, CheckCircle2, XCircle } from 'lucide-react';

export default function DeviceAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');

  const [userCode, setUserCode] = useState(codeParam || '');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleVerify = useCallback(async () => {
    if (!userCode || userCode.length !== 7) {
      setStatus('error');
      setMessage('Please enter a valid 7-character code (e.g., ABC-DEF)');
      return;
    }

    setStatus('verifying');
    setMessage('Verifying code...');

    try {
      const response = await fetch('/api/auth/device/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_code: userCode.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Device authorized successfully! You can close this window and return to your CLI.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Invalid or expired code. Please try again.');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Failed to verify code. Please try again.');
    }
  }, [userCode]);

  // Auto-verify if code is in URL
  useEffect(() => {
    if (codeParam && codeParam.length === 7) {
      setUserCode(codeParam);
      handleVerify();
    }
  }, [codeParam, handleVerify]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F5F3] p-4">
      <SaturnCard className="max-w-md w-full">
        <SaturnCardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-[#37322F] rounded-lg flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <SaturnCardTitle as="h2">Device Authorization</SaturnCardTitle>
          <SaturnCardDescription>
            Enter the code displayed in your CLI to authorize this device
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          {status === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-600 font-sans mb-2">Success!</p>
              <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">{message}</p>
              <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mt-4">
                You can close this window and return to your terminal.
              </p>
            </div>
          ) : status === 'error' ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-600 font-sans">{message}</p>
              </div>
              <div className="space-y-2">
                <SaturnLabel htmlFor="code">Enter Code</SaturnLabel>
                <SaturnInput
                  id="code"
                  type="text"
                  placeholder="ABC-DEF"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                  maxLength={7}
                  className="text-center text-2xl font-mono tracking-widest"
                  fullWidth
                />
              </div>
              <SaturnButton onClick={handleVerify} fullWidth>
                Try Again
              </SaturnButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <SaturnLabel htmlFor="code">Enter Code</SaturnLabel>
                <SaturnInput
                  id="code"
                  type="text"
                  placeholder="ABC-DEF"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                  maxLength={7}
                  className="text-center text-2xl font-mono tracking-widest"
                  autoFocus
                  fullWidth
                />
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans text-center">
                  The code is displayed in your terminal
                </p>
              </div>
              <SaturnButton 
                onClick={handleVerify} 
                fullWidth
                disabled={status === 'verifying' || userCode.length !== 7}
                loading={status === 'verifying'}
              >
                Authorize Device
              </SaturnButton>
            </div>
          )}

          <div className="mt-6 p-4 bg-[rgba(55,50,47,0.04)] rounded-lg">
            <p className="text-xs text-[rgba(55,50,47,0.80)] font-sans">
              <strong>Security note:</strong> This code is single-use and expires in 15 minutes. 
              Never share this code with anyone.
            </p>
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}
