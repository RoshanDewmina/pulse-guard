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
    { name: 'Billing', href: '/app/settings/billing' },
    { name: 'Team', href: '/app/settings/team' },
    { name: 'Alerts', href: '/app/settings/alerts' },
    { name: 'API Keys', href: '/app/settings/api-keys' },
  ];

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12">
      <div>
        <h1 className="text-3xl sm:text-4xl font-normal text-[#37322F] font-serif">Settings</h1>
        <p className="text-[rgba(55,50,47,0.80)] font-sans mt-2">Manage your organization settings</p>
      </div>

      <div className="flex gap-2 border-b border-[rgba(55,50,47,0.12)] overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link key={tab.href} href={tab.href}>
              <SaturnButton 
                variant={isActive ? "primary" : "ghost"} 
                className={`rounded-b-none whitespace-nowrap ${
                  isActive 
                    ? 'border-b-2 border-[#37322F]' 
                    : 'border-b-2 border-transparent'
                }`}
              >
                {tab.name}
              </SaturnButton>
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
