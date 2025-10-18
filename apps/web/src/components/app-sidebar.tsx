'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, BarChart3, AlertCircle, Plug, Settings, LayoutDashboard, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OrgSwitcher } from './org-switcher';

interface AppSidebarProps {
  orgName: string;
  userInitial: string;
  userName: string;
  userEmail: string;
}

export function AppSidebar({ orgName, userInitial, userName, userEmail }: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Dashboard',
      href: '/app',
      icon: LayoutDashboard,
      match: (path: string) => path === '/app',
    },
    {
      label: 'Monitors',
      href: '/app/monitors',
      icon: Activity,
      match: (path: string) => path.startsWith('/app/monitors'),
    },
    {
      label: 'Analytics',
      href: '/app/analytics',
      icon: BarChart3,
      match: (path: string) => path.startsWith('/app/analytics'),
    },
    {
      label: 'Incidents',
      href: '/app/incidents',
      icon: AlertCircle,
      match: (path: string) => path.startsWith('/app/incidents'),
    },
    {
      label: 'Integrations',
      href: '/app/integrations',
      icon: Plug,
      match: (path: string) => path.startsWith('/app/integrations'),
    },
    {
      label: 'Settings',
      href: '/app/settings',
      icon: Settings,
      match: (path: string) => path.startsWith('/app/settings'),
    },
  ];

  return (
    <aside className="w-72 bg-white border-r border-[rgba(55,50,47,0.12)] min-h-screen sticky top-0 hidden lg:flex lg:flex-col">
      <div className="p-8 flex-1">
        {/* Org Switcher */}
        <div className="mb-8">
          <OrgSwitcher currentOrgName={orgName} />
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = item.match(pathname);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium font-sans transition-all',
                  isActive
                    ? 'bg-[#37322F] text-white shadow-sm'
                    : 'text-[rgba(55,50,47,0.80)] hover:bg-[#F7F5F3] hover:text-[#37322F]'
                )}
              >
                <Icon className={cn('w-5 h-5', isActive ? 'text-white' : 'text-[rgba(55,50,47,0.60)]')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Section at Bottom */}
      <div className="p-6 border-t border-[rgba(55,50,47,0.12)]">
        <div className="mb-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-[#37322F] rounded-full flex items-center justify-center">
              <span className="text-white font-medium font-sans text-sm">{userInitial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[#37322F] text-sm font-medium font-sans truncate">{userName}</div>
              <div className="text-[rgba(55,50,47,0.60)] text-xs font-sans truncate">{userEmail}</div>
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <Link
            href="/app/profile"
            className="flex items-center gap-3 px-3 py-2 text-sm text-[rgba(55,50,47,0.80)] hover:bg-[#F7F5F3] hover:text-[#37322F] rounded-lg transition-colors font-sans"
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </Link>
          <Link
            href="/api/auth/signout"
            className="flex items-center gap-3 px-3 py-2 text-sm text-[rgba(55,50,47,0.80)] hover:bg-[#F7F5F3] hover:text-[#37322F] rounded-lg transition-colors font-sans"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

