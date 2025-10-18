'use client';

import { useState } from 'react';
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
} from '@/components/saturn';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import { Building2 } from 'lucide-react';

export default function NewOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
  });

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    setFormData({
      name,
      slug: name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, ''),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/org/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organization');
      }

      // Switch to the new organization and redirect to dashboard
      await fetch('/api/org/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId: data.org.id }),
      });

      // Redirect to dashboard with new org
      window.location.href = '/app';
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/app' },
        { label: 'Organizations', href: '/app/organizations' },
        { label: 'Create' },
      ]} />
      
      <PageHeader
        title="Create Organization"
        description="Set up a new organization to manage your monitors"
      />

      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#37322F] rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <SaturnCardTitle as="h2">Organization Details</SaturnCardTitle>
              <SaturnCardDescription>
                Choose a name and unique identifier for your organization
              </SaturnCardDescription>
            </div>
          </div>
        </SaturnCardHeader>
        <SaturnCardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200 font-sans">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <SaturnLabel htmlFor="name" required>
                Organization Name
              </SaturnLabel>
              <SaturnInput
                id="name"
                type="text"
                placeholder="My Company"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={loading}
                required
                fullWidth
              />
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                The display name for your organization
              </p>
            </div>

            <div className="space-y-2">
              <SaturnLabel htmlFor="slug" required>
                Organization Slug
              </SaturnLabel>
              <SaturnInput
                id="slug"
                type="text"
                placeholder="my-company"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                disabled={loading}
                required
                fullWidth
              />
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                A unique identifier used in URLs. Only lowercase letters, numbers, and hyphens allowed.
              </p>
            </div>

            <div className="bg-[#F7F5F3] p-4 rounded-lg border border-[rgba(55,50,47,0.08)]">
              <h4 className="text-sm font-medium text-[#37322F] font-sans mb-2">What's included:</h4>
              <ul className="space-y-1 text-sm text-[rgba(55,50,47,0.70)] font-sans">
                <li>• Up to 5 monitors</li>
                <li>• 1 team member</li>
                <li>• Email notifications</li>
                <li>• 30-day data retention</li>
              </ul>
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans mt-3">
                This is a Free plan organization. You can upgrade later from Settings.
              </p>
            </div>

            <div className="flex gap-3">
              <SaturnButton
                type="submit"
                disabled={loading || !formData.name || !formData.slug}
                loading={loading}
                icon={<Building2 className="w-4 h-4" />}
              >
                Create Organization
              </SaturnButton>
              <SaturnButton
                type="button"
                variant="secondary"
                onClick={() => router.push('/app/organizations')}
                disabled={loading}
              >
                Cancel
              </SaturnButton>
            </div>
          </form>
        </SaturnCardContent>
      </SaturnCard>

      <SaturnCard>
        <SaturnCardContent className="p-6">
          <h3 className="text-sm font-medium text-[#37322F] font-sans mb-2">
            💡 Organization Tips
          </h3>
          <ul className="space-y-2 text-sm text-[rgba(55,50,47,0.70)] font-sans">
            <li>• Each organization has its own monitors, team, and settings</li>
            <li>• You can switch between organizations anytime from the sidebar</li>
            <li>• As an owner, you have full control over the organization</li>
            <li>• You can create up to 5 organizations on your account</li>
          </ul>
        </SaturnCardContent>
      </SaturnCard>
    </div>
  );
}

