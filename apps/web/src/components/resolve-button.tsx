"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export function ResolveButton({ incidentId }: { incidentId: string }) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleResolve = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/incidents/${incidentId}/resolve`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to resolve incident');
      }

      toast({
        title: 'Incident resolved',
        description: 'The incident has been marked as resolved',
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resolve incident',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleResolve}
      disabled={loading}
    >
      {loading ? 'Resolving...' : 'Resolve'}
    </Button>
  );
}

