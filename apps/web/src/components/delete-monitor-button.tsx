'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SaturnButton } from '@/components/saturn';
import { useToast } from '@/components/ui/use-toast';
import { Trash2 } from 'lucide-react';

interface DeleteMonitorButtonProps {
  monitorId: string;
  monitorName: string;
}

export function DeleteMonitorButton({ monitorId, monitorName }: DeleteMonitorButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/monitors/${monitorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete monitor');
      }

      const data = await response.json();

      toast({
        title: 'Monitor deleted',
        description: `${monitorName} has been deleted successfully`,
      });

      router.push('/app/monitors');
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete monitor. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex gap-2">
        <SaturnButton
          variant="danger"
          size="sm"
          onClick={handleDelete}
          loading={loading}
          disabled={loading}
        >
          Confirm Delete
        </SaturnButton>
        <SaturnButton
          variant="secondary"
          size="sm"
          onClick={() => setShowConfirm(false)}
          disabled={loading}
        >
          Cancel
        </SaturnButton>
      </div>
    );
  }

  return (
    <SaturnButton
      variant="danger"
      className="flex-1 sm:flex-initial whitespace-nowrap"
      onClick={() => setShowConfirm(true)}
    >
      Delete
    </SaturnButton>
  );
}

