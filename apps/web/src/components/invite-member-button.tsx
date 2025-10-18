'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SaturnButton } from '@/components/saturn';
import { useToast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';

export function InviteMemberButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleInvite = async () => {
    // For now, show a "coming soon" message
    // In a full implementation, this would open a modal/dialog
    toast({
      title: 'Coming Soon',
      description: 'Team member invitation feature is under development',
    });
  };

  return (
    <SaturnButton onClick={handleInvite} loading={loading} icon={<Plus className="w-4 h-4" />}>
      Invite Member
    </SaturnButton>
  );
}


