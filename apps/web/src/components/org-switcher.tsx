'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2, ChevronDown, Check, Loader2 } from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface OrgSwitcherProps {
  currentOrgName?: string;
}

export function OrgSwitcher({ currentOrgName }: OrgSwitcherProps) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentOrg, setCurrentOrg] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/org/list');
      if (!response.ok) throw new Error('Failed to fetch organizations');
      
      const data = await response.json();
      setOrganizations(data.organizations);

      // Get current org from cookie (will be set by the server)
      if (currentOrgName) {
        const current = data.organizations.find((org: Organization) => org.name === currentOrgName);
        setCurrentOrg(current?.id || null);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === currentOrg) return;

    setSwitching(orgId);

    try {
      const response = await fetch('/api/org/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch organization');
      }

      // Force hard reload with cache bypass to refresh with new org
      window.location.href = window.location.href;
    } catch (error) {
      console.error('Error switching organization:', error);
      setSwitching(null);
    }
  };

  // If only one org, show it without dropdown
  if (organizations.length === 1) {
    return (
      <div className="hidden sm:flex items-center px-3 py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] rounded-full">
        <Building2 className="w-4 h-4 text-[rgba(55,50,47,0.60)] mr-2" />
        <span className="text-[#37322F] text-[13px] font-medium font-sans truncate max-w-[120px]">
          {organizations[0].name}
        </span>
      </div>
    );
  }

  // Multiple orgs, show dropdown
  return (
    <div className="hidden sm:block group relative">
      <div className="px-3 py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-gray-50 transition-colors">
        <Building2 className="w-4 h-4 text-[rgba(55,50,47,0.60)] mr-2" />
        <span className="text-[#37322F] text-[13px] font-medium font-sans truncate max-w-[120px] mr-1">
          {currentOrgName || 'Select Org'}
        </span>
        <ChevronDown className="w-3 h-3 text-[rgba(55,50,47,0.60)]" />
      </div>

      {/* Dropdown Menu */}
      <div className="absolute left-0 top-full mt-2 w-64 bg-white shadow-[0px_0px_0px_2px_white,0px_4px_12px_rgba(55,50,47,0.12)] rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <div className="p-2 border-b border-[rgba(55,50,47,0.12)]">
          <div className="text-[rgba(55,50,47,0.60)] text-xs font-medium font-sans px-2 py-1">
            Switch Organization
          </div>
        </div>

        {loading ? (
          <div className="p-4 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[rgba(55,50,47,0.60)]" />
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto py-1">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => handleSwitchOrg(org.id)}
                disabled={switching !== null}
                className="w-full px-3 py-2 text-left hover:bg-[#F7F5F3] transition-colors flex items-center justify-between group/item disabled:opacity-50"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[#37322F] text-sm font-medium font-sans truncate">
                    {org.name}
                  </div>
                  <div className="text-[rgba(55,50,47,0.60)] text-xs font-sans truncate">
                    /{org.slug} · {org.role.toLowerCase()}
                  </div>
                </div>
                {switching === org.id ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#37322F] flex-shrink-0 ml-2" />
                ) : org.name === currentOrgName ? (
                  <Check className="w-4 h-4 text-[#37322F] flex-shrink-0 ml-2" />
                ) : null}
              </button>
            ))}
          </div>
        )}

        <div className="border-t border-[rgba(55,50,47,0.12)] p-2">
          <Link
            href="/app/organizations"
            className="block px-3 py-2 text-[#37322F] text-sm font-medium font-sans hover:bg-[#F7F5F3] rounded transition-colors text-center"
          >
            View All Organizations
          </Link>
        </div>
      </div>
    </div>
  );
}

