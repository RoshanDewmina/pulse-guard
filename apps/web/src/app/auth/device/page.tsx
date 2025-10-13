'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Smartphone, CheckCircle2, XCircle } from 'lucide-react';

export default function DeviceAuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');

  const [userCode, setUserCode] = useState(codeParam || '');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    if (!userCode || userCode.length !== 7) {
      setStatus('error');
      setMessage('Please enter a valid 6-character code (e.g., ABC-DEF)');
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
  };

  // Auto-verify if code is in URL
  useEffect(() => {
    if (codeParam && codeParam.length === 7) {
      setUserCode(codeParam);
      handleVerify();
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
            <Smartphone className="h-8 w-8 text-white" />
          </div>
          <CardTitle>Device Authorization</CardTitle>
          <CardDescription>
            Enter the code displayed in your CLI to authorize this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'success' ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-green-600 mb-2">Success!</p>
              <p className="text-sm text-gray-600">{message}</p>
              <p className="text-sm text-gray-500 mt-4">
                You can close this window and return to your terminal.
              </p>
            </div>
          ) : status === 'error' ? (
            <div className="space-y-4">
              <div className="text-center py-4">
                <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                <p className="text-sm text-red-600">{message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Enter Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="ABC-DEF"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                  maxLength={7}
                  className="text-center text-2xl font-mono tracking-widest"
                />
              </div>
              <Button onClick={handleVerify} className="w-full">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Enter Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="ABC-DEF"
                  value={userCode}
                  onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                  maxLength={7}
                  className="text-center text-2xl font-mono tracking-widest"
                  autoFocus
                />
                <p className="text-xs text-gray-500 text-center">
                  The code is displayed in your terminal
                </p>
              </div>
              <Button 
                onClick={handleVerify} 
                className="w-full"
                disabled={status === 'verifying' || userCode.length !== 7}
              >
                {status === 'verifying' ? 'Verifying...' : 'Authorize Device'}
              </Button>
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600">
              <strong>Security note:</strong> This code is single-use and expires in 15 minutes. 
              Never share this code with anyone.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




