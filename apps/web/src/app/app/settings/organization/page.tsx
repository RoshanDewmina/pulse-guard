'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

export default function OrganizationSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [org, setOrg] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      const response = await fetch('/api/org');
      if (!response.ok) throw new Error('Failed to fetch organization');
      const data = await response.json();
      setOrg(data.org);
      setFormData({
        name: data.org.name,
        slug: data.org.slug,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load organization settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/org', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update organization');
      }

      toast({
        title: 'Success',
        description: 'Organization settings updated successfully',
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#37322F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeaderWithBreadcrumbs
        title="Organization Settings"
        description="Manage your organization information"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Settings', href: '/app/settings' },
          { label: 'Organization' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h2">Organization Details</SaturnCardTitle>
            <SaturnCardDescription>
              Update your organization name and view other details
            </SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <SaturnLabel htmlFor="name" required>Organization Name</SaturnLabel>
                <SaturnInput
                  id="name"
                  placeholder="e.g., Acme Corporation"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                />
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                  This is the display name for your organization
                </p>
              </div>

              <div className="space-y-2">
                <SaturnLabel htmlFor="slug">Organization Slug</SaturnLabel>
                <div className="flex gap-2 items-center">
                  <SaturnInput
                    id="slug"
                    value={formData.slug}
                    disabled
                    className="flex-1"
                  />
                  <SaturnBadge variant="default">Read-only</SaturnBadge>
                </div>
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                  The slug is used in URLs and cannot be changed after creation
                </p>
              </div>

              <div className="border-t border-[rgba(55,50,47,0.12)] pt-6">
                <div className="flex items-start gap-3 p-4 bg-[#F7F5F3] rounded-lg">
                  <AlertCircle className="w-5 h-5 text-[#37322F] flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-[#37322F] font-sans">
                    <p className="font-medium mb-1">Organization ID</p>
                    <p className="text-[rgba(55,50,47,0.80)] font-mono text-xs break-all">
                      {org?.id}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <SaturnButton
                  type="button"
                  variant="ghost"
                  onClick={() => router.push('/app/settings')}
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

      {/* Danger Zone */}
      <SaturnCard>
        <SaturnCardHeader>
          <SaturnCardTitle as="h2" className="text-red-600">Danger Zone</SaturnCardTitle>
          <SaturnCardDescription>
            Irreversible and destructive actions
          </SaturnCardDescription>
        </SaturnCardHeader>
        <SaturnCardContent>
          <div className="border border-red-200 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
              <div>
                <h3 className="text-sm font-medium text-[#37322F]">Delete Organization</h3>
                <p className="text-sm text-[rgba(55,50,47,0.60)] mt-1">
                  Permanently delete this organization and all associated data
                </p>
              </div>
              <SaturnButton variant="secondary" size="sm" className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200 whitespace-nowrap">
                Delete Organization
              </SaturnButton>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

