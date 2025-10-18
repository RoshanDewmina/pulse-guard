'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnBadge,
} from '@/components/saturn';
import { Building2, Users, Activity, CheckCircle2, Loader2, Plus } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { PageHeader } from '@/components/page-header';
import Link from 'next/link';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
  monitorCount: number;
  memberCount: number;
  createdAt: string;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/org/list');
      if (!response.ok) throw new Error('Failed to fetch organizations');
      
      const data = await response.json();
      setOrganizations(data.organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setError('Failed to load organizations');
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchOrg = async (orgId: string) => {
    setSwitching(orgId);
    setError('');

    try {
      const response = await fetch('/api/org/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to switch organization');
      }

      // Redirect to dashboard to refresh with new org
      window.location.href = '/app';
    } catch (error: any) {
      setError(error.message);
      setSwitching(null);
    }
  };

  const getRoleBadgeVariant = (role: string): "default" | "error" | "info" | "success" | "warning" => {
    if (role === 'OWNER') return 'default';
    if (role === 'ADMIN') return 'default';
    return 'default';
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <Breadcrumbs items={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Organizations' },
        ]} />
        
        <PageHeader
          title="Switch Organization"
          description="Choose which organization to work with"
        />
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[#37322F]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/app' },
        { label: 'Organizations' },
      ]} />
      
      <PageHeader
        title="Organizations"
        description="Manage and switch between your organizations"
        action={
          <Link href="/app/organizations/new">
            <SaturnButton icon={<Plus className="w-4 h-4" />}>
              Create Organization
            </SaturnButton>
          </Link>
        }
      />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-200">
          {error}
        </div>
      )}

      {organizations.length === 0 ? (
        <SaturnCard>
          <SaturnCardContent>
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-[rgba(55,50,47,0.30)] mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#37322F] mb-2">No Organizations</h3>
              <p className="text-[rgba(55,50,47,0.60)] mb-6">
                You don't belong to any organizations yet.
              </p>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <SaturnCard key={org.id} className="hover:shadow-lg transition-all">
              <SaturnCardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-[#37322F] rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <SaturnBadge variant={getRoleBadgeVariant(org.role)} size="sm">
                    {org.role}
                  </SaturnBadge>
                </div>
                
                <h3 className="text-lg font-semibold text-[#37322F] font-sans mb-1 truncate">
                  {org.name}
                </h3>
                <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mb-4">
                  /{org.slug}
                </p>

                <div className="space-y-2 mb-4 pb-4 border-b border-[rgba(55,50,47,0.08)]">
                  <div className="flex items-center gap-2 text-sm text-[rgba(55,50,47,0.70)] font-sans">
                    <Activity className="w-4 h-4 text-[rgba(55,50,47,0.60)]" />
                    <span>{org.monitorCount} monitor{org.monitorCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[rgba(55,50,47,0.70)] font-sans">
                    <Users className="w-4 h-4 text-[rgba(55,50,47,0.60)]" />
                    <span>{org.memberCount} member{org.memberCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                <SaturnButton
                  fullWidth
                  onClick={() => handleSwitchOrg(org.id)}
                  disabled={switching !== null}
                  loading={switching === org.id}
                  icon={switching === org.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  className="whitespace-nowrap"
                >
                  {switching === org.id ? 'Switching...' : 'Switch to Org'}
                </SaturnButton>
              </SaturnCardContent>
            </SaturnCard>
          ))}
        </div>
      )}

      <div className="flex justify-center">
        <SaturnButton variant="secondary" onClick={() => router.push('/app')}>
          Cancel
        </SaturnButton>
      </div>
    </div>
  );
}

