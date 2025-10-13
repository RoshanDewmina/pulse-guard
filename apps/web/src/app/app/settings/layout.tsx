import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tabs = [
    { name: 'Billing', href: '/app/settings/billing' },
    { name: 'Team', href: '/app/settings/team' },
    { name: 'Alerts', href: '/app/settings/alerts' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your organization settings</p>
      </div>

      <div className="flex gap-2 border-b">
        {tabs.map((tab) => (
          <Link key={tab.href} href={tab.href}>
            <Button variant="ghost" className="rounded-b-none">
              {tab.name}
            </Button>
          </Link>
        ))}
      </div>

      <div>{children}</div>
    </div>
  );
}

