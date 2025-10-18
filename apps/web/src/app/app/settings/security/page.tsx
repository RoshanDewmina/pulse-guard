'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  Shield,
  CheckCircle2,
  Download,
  RefreshCw,
  X,
} from 'lucide-react';

interface MFAStatus {
  mfaEnabled: boolean;
  remainingBackupCodes: number;
  lastVerifiedAt: string | null;
}

export default function SecuritySettingsPage() {
  const { data: session } = useSession();
  const [mfaStatus, setMfaStatus] = useState<MFAStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Enrollment flow state
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollmentData, setEnrollmentData] = useState<{
    secret: string;
    qrCode: string;
    otpauthUrl: string;
  } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  
  // Disable flow state
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [useBackupCodeForDisable, setUseBackupCodeForDisable] = useState(false);
  const [disabling, setDisabling] = useState(false);
  
  // Regenerate codes flow state
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState('');
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchMFAStatus();
  }, []);

  const fetchMFAStatus = async () => {
    try {
      const response = await fetch('/api/mfa/status');
      if (response.ok) {
        const data = await response.json();
        setMfaStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setError('');
      const response = await fetch('/api/mfa/enroll', {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to enroll');
      }

      const data = await response.json();
      setEnrollmentData(data);
      setShowEnrollModal(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleVerifyEnrollment = async () => {
    try {
      setError('');
      setVerifying(true);

      const response = await fetch('/api/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Verification failed');
      }

      const data = await response.json();
      
      if (data.backupCodes) {
        setBackupCodes(data.backupCodes);
        setShowBackupCodes(true);
        setShowEnrollModal(false);
      }
      
      await fetchMFAStatus();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableMFA = async () => {
    try {
      setError('');
      setDisabling(true);

      const response = await fetch('/api/mfa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: disableCode,
          isBackupCode: useBackupCodeForDisable,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disable MFA');
      }

      setShowDisableModal(false);
      setDisableCode('');
      await fetchMFAStatus();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setDisabling(false);
    }
  };

  const handleRegenerateCodes = async () => {
    try {
      setError('');
      setRegenerating(true);

      const response = await fetch('/api/mfa/regenerate-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: regenerateCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate codes');
      }

      const data = await response.json();
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setShowRegenerateModal(false);
      setRegenerateCode('');
      await fetchMFAStatus();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setRegenerating(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = `Saturn Backup Codes
Generated: ${new Date().toLocaleString()}

IMPORTANT: Store these codes in a safe place. Each code can only be used once.

${backupCodes.join('\n')}

Do not share these codes with anyone.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `saturn-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#37322F]">Security Settings</h1>
        <p className="text-[rgba(55,50,47,0.60)] font-sans mt-1">
          Manage your account security and two-factor authentication
        </p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-[#37322F] mt-1" />
              <div>
                <SaturnCardTitle>Two-Factor Authentication</SaturnCardTitle>
                <SaturnCardDescription>
                  Add an extra layer of security to your account
                </SaturnCardDescription>
              </div>
            </div>
            {mfaStatus?.mfaEnabled && (
              <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                Enabled
              </div>
            )}
          </div>
        </SaturnCardHeader>

        <SaturnCardContent>
          {!mfaStatus?.mfaEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                Protect your account with two-factor authentication using an authenticator app
                like Google Authenticator, Authy, or 1Password.
              </p>
              <SaturnButton onClick={handleEnroll}>Enable Two-Factor Authentication</SaturnButton>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[rgba(55,50,47,0.04)] rounded-lg">
                  <div className="text-sm font-medium text-[#37322F] mb-1">
                    Backup Codes Remaining
                  </div>
                  <div className="text-2xl font-bold text-[#37322F]">
                    {mfaStatus.remainingBackupCodes}
                  </div>
                </div>
                
                {mfaStatus.lastVerifiedAt && (
                  <div className="p-4 bg-[rgba(55,50,47,0.04)] rounded-lg">
                    <div className="text-sm font-medium text-[#37322F] mb-1">
                      Last Verified
                    </div>
                    <div className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                      {new Date(mfaStatus.lastVerifiedAt).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                <SaturnButton
                  variant="secondary"
                  onClick={() => setShowRegenerateModal(true)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Backup Codes
                </SaturnButton>
                
                <SaturnButton
                  variant="secondary"
                  onClick={() => setShowDisableModal(true)}
                >
                  Disable MFA
                </SaturnButton>
              </div>
            </div>
          )}
        </SaturnCardContent>
      </SaturnCard>

      {/* Enrollment Modal */}
      <Dialog open={showEnrollModal} onOpenChange={setShowEnrollModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code to verify.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {enrollmentData && (
              <>
                <div className="flex justify-center">
                  <img
                    src={enrollmentData.qrCode}
                    alt="QR Code"
                    className="w-64 h-64"
                  />
                </div>

                <div className="space-y-2">
                  <SaturnLabel>Manual Entry Key</SaturnLabel>
                  <div className="p-3 bg-[rgba(55,50,47,0.04)] rounded font-mono text-sm break-all">
                    {enrollmentData.secret}
                  </div>
                </div>

                <div className="space-y-2">
                  <SaturnLabel htmlFor="verifyCode">Verification Code</SaturnLabel>
                  <SaturnInput
                    id="verifyCode"
                    type="text"
                    placeholder="123456"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    disabled={verifying}
                    fullWidth
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <SaturnButton
              variant="secondary"
              onClick={() => {
                setShowEnrollModal(false);
                setEnrollmentData(null);
                setVerifyCode('');
              }}
              disabled={verifying}
            >
              Cancel
            </SaturnButton>
            <SaturnButton
              onClick={handleVerifyEnrollment}
              disabled={verifying || !verifyCode}
              loading={verifying}
            >
              Verify and Enable
            </SaturnButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Modal */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Codes</DialogTitle>
            <DialogDescription>
              Save these codes in a safe place. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-[rgba(55,50,47,0.04)] rounded font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-white rounded">
                  {code}
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-900">
                  These codes will only be shown once. Download them now or copy them to a secure location.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <SaturnButton variant="secondary" onClick={downloadBackupCodes}>
              <Download className="w-4 h-4 mr-2" />
              Download Codes
            </SaturnButton>
            <SaturnButton onClick={() => setShowBackupCodes(false)}>
              Done
            </SaturnButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Disable MFA Modal */}
      <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Enter your authentication code or backup code to disable MFA.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-900">
                  Disabling MFA will make your account less secure.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <SaturnLabel htmlFor="disableCode">
                {useBackupCodeForDisable ? 'Backup Code' : 'Authentication Code'}
              </SaturnLabel>
              <SaturnInput
                id="disableCode"
                type="text"
                placeholder={useBackupCodeForDisable ? 'XXXXX-XXXXX' : '123456'}
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                disabled={disabling}
                fullWidth
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setUseBackupCodeForDisable(!useBackupCodeForDisable);
                setDisableCode('');
              }}
              className="text-sm text-[rgba(55,50,47,0.60)] hover:text-[#37322F] transition-colors"
            >
              {useBackupCodeForDisable
                ? 'Use authenticator code instead'
                : 'Use backup code instead'}
            </button>
          </div>

          <DialogFooter>
            <SaturnButton
              variant="secondary"
              onClick={() => {
                setShowDisableModal(false);
                setDisableCode('');
              }}
              disabled={disabling}
            >
              Cancel
            </SaturnButton>
            <SaturnButton
              onClick={handleDisableMFA}
              disabled={disabling || !disableCode}
              loading={disabling}
            >
              Disable MFA
            </SaturnButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Codes Modal */}
      <Dialog open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Backup Codes</DialogTitle>
            <DialogDescription>
              Enter your authentication code to generate new backup codes. Your old codes will be invalidated.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <SaturnLabel htmlFor="regenerateCode">Authentication Code</SaturnLabel>
              <SaturnInput
                id="regenerateCode"
                type="text"
                placeholder="123456"
                value={regenerateCode}
                onChange={(e) => setRegenerateCode(e.target.value)}
                disabled={regenerating}
                fullWidth
              />
            </div>
          </div>

          <DialogFooter>
            <SaturnButton
              variant="secondary"
              onClick={() => {
                setShowRegenerateModal(false);
                setRegenerateCode('');
              }}
              disabled={regenerating}
            >
              Cancel
            </SaturnButton>
            <SaturnButton
              onClick={handleRegenerateCodes}
              disabled={regenerating || !regenerateCode}
              loading={regenerating}
            >
              Regenerate
            </SaturnButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

