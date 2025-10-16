'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { SaturnButton } from '@/components/saturn';
import { useToast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';

export function DeleteAccountButton() {
  const [loading, setLoading] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast({
        title: 'Confirmation required',
        description: 'Please type DELETE to confirm account deletion',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/export', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      toast({
        title: 'Account deleted',
        description: 'Your account has been permanently deleted',
      });

      // Sign out and redirect
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please contact support.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="space-y-4">
        <div className="bg-red-100 border-2 border-red-300 rounded-lg p-4">
          <p className="text-sm font-medium text-red-900 mb-3">
            ⚠️ This action cannot be undone. Type <strong>DELETE</strong> to confirm:
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type DELETE"
            className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            disabled={loading}
          />
        </div>
        <div className="flex gap-3">
          <SaturnButton
            variant="danger"
            onClick={handleDelete}
            loading={loading}
            disabled={loading || confirmText !== 'DELETE'}
            fullWidth
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Permanently Delete Account
          </SaturnButton>
          <SaturnButton
            variant="secondary"
            onClick={() => {
              setShowConfirm(false);
              setConfirmText('');
            }}
            disabled={loading}
            fullWidth
          >
            Cancel
          </SaturnButton>
        </div>
      </div>
    );
  }

  return (
    <SaturnButton
      variant="danger"
      fullWidth
      onClick={() => setShowConfirm(true)}
    >
      <Trash2 className="h-4 w-4 mr-2" />
      Delete My Account
    </SaturnButton>
  );
}


