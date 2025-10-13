"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export function AcknowledgeButton({ incidentId }: { incidentId: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/incidents/${incidentId}/ack`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge incident');
      }

      toast({
        title: 'Incident acknowledged',
        description: 'The incident has been marked as acknowledged',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge incident',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleAcknowledge}
      disabled={loading}
    >
      {loading ? 'Acknowledging...' : 'Acknowledge'}
    </Button>
  );
}

