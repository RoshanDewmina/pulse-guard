'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SaturnButton } from '@/components/saturn';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  const tabs = [
    { name: 'Organization', href: '/app/settings' },
    { name: 'Alerts', href: '/app/settings/alerts' },
    { name: 'API Keys', href: '/app/settings/api-keys' },
    { name: 'Team', href: '/app/settings/team' },
    { name: 'Billing', href: '/app/settings/billing' },
    { name: 'Data', href: '/app/settings/data' },
    { name: 'Maintenance', href: '/app/settings/maintenance' },
    { name: 'SAML SSO', href: '/app/settings/saml' },
    { name: 'Audit Logs', href: '/app/settings/audit-logs' },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <div>
        <h1 className="text-3xl sm:text-4xl font-normal text-[#37322F] font-serif">Settings</h1>
        <p className="text-[rgba(55,50,47,0.80)] font-sans mt-2">Manage your organization settings</p>
      </div>

      <div className="flex gap-2 border-b border-[rgba(55,50,47,0.12)] overflow-x-auto pb-px">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href === '/app/settings' && pathname === '/app/settings');
          return (
            <Link key={tab.href} href={tab.href}>
              <button
                className={`px-4 py-2 text-sm font-medium font-sans whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-[#37322F] text-[#37322F]'
                    : 'border-transparent text-[rgba(55,50,47,0.60)] hover:text-[#37322F] hover:border-[rgba(55,50,47,0.20)]'
                }`}
              >
                {tab.name}
              </button>
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
