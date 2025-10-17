'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  SaturnBadge,
} from '@/components/saturn';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, User, Mail, CheckCircle2 } from 'lucide-react';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });

  useEffect(() => {
    if (session?.user) {
      setFormData({
        name: session.user.name || '',
        email: session.user.email || '',
      });
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }

      // Update the session with new data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: formData.name,
        },
      });

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#37322F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeaderWithBreadcrumbs
        title="Profile"
        description="Manage your personal information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Profile' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h2">Personal Information</SaturnCardTitle>
            <SaturnCardDescription>
              Update your personal details
            </SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-6">
              <div className="flex items-center gap-4 pb-6 border-b border-[rgba(55,50,47,0.12)]">
                <div className="w-16 h-16 rounded-full bg-[#37322F] flex items-center justify-center text-white text-2xl font-medium">
                  {session.user?.name?.[0] || session.user?.email?.[0] || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#37322F]">{session.user?.name}</h3>
                  <p className="text-sm text-[rgba(55,50,47,0.60)]">{session.user?.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <SaturnLabel htmlFor="name" required>Full Name</SaturnLabel>
                <div className="flex items-start gap-2">
                  <User className="w-5 h-5 text-[rgba(55,50,47,0.60)] mt-2" />
                  <SaturnInput
                    id="name"
                    placeholder="e.g., John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    fullWidth
                  />
                </div>
              </div>

              <div className="space-y-2">
                <SaturnLabel htmlFor="email">Email Address</SaturnLabel>
                <div className="flex items-start gap-2">
                  <Mail className="w-5 h-5 text-[rgba(55,50,47,0.60)] mt-2" />
                  <div className="flex-1 flex gap-2 items-center">
                    <SaturnInput
                      id="email"
                      type="email"
                      value={formData.email}
                      disabled
                      className="flex-1"
                    />
                    <SaturnBadge variant="default">Read-only</SaturnBadge>
                  </div>
                </div>
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans ml-7">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <SaturnButton
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/app')}
                  disabled={saving}
                >
                  Cancel
                </SaturnButton>
                <SaturnButton type="submit" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {!saving && <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Save Changes
                </SaturnButton>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </form>

      {/* Account Information */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h2">Account Information</SaturnCardTitle>
          <SaturnCardDescription>
            Read-only account details
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="flex items-start gap-3 p-4 bg-[#F7F5F3] rounded-lg">
            <User className="w-5 h-5 text-[#37322F] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#37322F] font-sans">
              <p className="font-medium mb-1">User ID</p>
              <p className="text-[rgba(55,50,47,0.80)] font-mono text-xs break-all">
                {session.user?.id}
              </p>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

