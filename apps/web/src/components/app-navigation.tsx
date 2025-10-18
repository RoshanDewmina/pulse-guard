'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Activity, Bell, Settings, LogOut, BarChart3, User, Menu, Plug, AlertCircle, BookOpen, X, Building2, Home, Globe, FileText, TrendingUp } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { OrgSwitcher } from '@/components/org-switcher';

interface AppNavigationProps {
  userInitial: string;
  userName: string;
  userEmail: string;
  orgName?: string;
}

export function AppNavigation({ userInitial, userName, userEmail, orgName }: AppNavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationLinks = [
    { href: '/app', label: 'Home', icon: Home },
    { href: '/app/monitors', label: 'Monitors', icon: Activity },
    { href: '/app/incidents', label: 'Incidents', icon: AlertCircle },
    { href: '/app/synthetic', label: 'Synthetic', icon: Globe },
    { href: '/app/reports', label: 'Reports', icon: TrendingUp },
    { href: '/app/postmortems', label: 'Post-Mortems', icon: FileText },
    { href: '/app/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/app/integrations', label: 'Integrations', icon: Plug },
    { href: '/app/settings', label: 'Settings', icon: Settings },
    { href: 'https://docs.saturnmonitor.com', label: 'Docs', icon: BookOpen, external: true },
  ];

  return (
    <>
      <div className="w-full h-12 sm:h-14 md:h-16 lg:h-16 absolute left-0 top-0 flex justify-center items-center z-20 px-4 sm:px-6 lg:px-8">
        <div className="w-full h-0 absolute left-0 top-6 sm:top-7 lg:top-8 border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]"></div>

        <div className="w-full max-w-[calc(100%-16px)] sm:max-w-[calc(100%-32px)] lg:max-w-full h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] overflow-hidden rounded-[50px] flex justify-between items-center relative z-30">
          <div className="flex justify-center items-center">
            <Link href="/app" className="flex justify-start items-center cursor-pointer">
              <div className="flex flex-col justify-center text-[#2F3037] text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans">
                Saturn
              </div>
            </Link>
            {/* Desktop Navigation - Minimal since sidebar handles main nav */}
            <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 flex justify-start items-start hidden lg:flex flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4">
              <Link href="https://docs.saturnmonitor.com" target="_blank" rel="noopener noreferrer" className="flex justify-start items-center hover:opacity-70 transition-opacity">
                <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                  Docs
                </div>
              </Link>
            </div>
          </div>
          <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="sm:hidden px-2 py-1 bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-gray-50 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 text-[#37322F]" />
            </button>

            {/* Organization Switcher */}
            <OrgSwitcher currentOrgName={orgName} />

            {/* User Avatar */}
            <div className="group relative">
              <div className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans">
                  {userInitial}
                </div>
              </div>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-[0px_0px_0px_2px_white,0px_4px_12px_rgba(55,50,47,0.12)] rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-3 border-b border-[rgba(55,50,47,0.12)]">
                  <div className="text-[#37322F] text-sm font-medium font-sans">{userName}</div>
                  <div className="text-[rgba(55,50,47,0.60)] text-xs font-sans">{userEmail}</div>
                </div>
                <Link href="/app/profile" className="block px-3 py-2 text-[#37322F] text-sm font-medium font-sans hover:bg-[#F7F5F3] transition-colors">
                  <User className="w-4 h-4 inline-block mr-2" />
                  Profile
                </Link>
                <Link href="/api/auth/signout" className="block px-3 py-2 text-[#37322F] text-sm font-medium font-sans hover:bg-[#F7F5F3] transition-colors">
                  <LogOut className="w-4 h-4 inline-block mr-2" />
                  Sign Out
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[280px] sm:w-[340px] bg-[#F7F5F3] border-l border-[rgba(55,50,47,0.12)]">
          <SheetHeader className="border-b border-[rgba(55,50,47,0.12)] pb-4">
            <SheetTitle className="text-left font-sans text-[#37322F]">
              <div className="flex items-center justify-between">
                <span className="text-xl font-medium">Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 hover:bg-white rounded-lg transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-[#37322F]" />
                </button>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* User Info Section */}
          <div className="py-4 border-b border-[rgba(55,50,47,0.12)]">
            <div className="flex items-center gap-3 px-1">
              <div className="w-10 h-10 bg-[#37322F] rounded-full flex items-center justify-center">
                <span className="text-white font-medium font-sans">{userInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[#37322F] text-sm font-medium font-sans truncate">{userName}</div>
                <div className="text-[rgba(55,50,47,0.60)] text-xs font-sans truncate">{userEmail}</div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="py-4 space-y-1">
            {navigationLinks.map((link) => {
              const Icon = link.icon;
              if (link.external) {
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-3 text-[#37322F] hover:bg-white rounded-lg transition-colors group"
                  >
                    <Icon className="w-5 h-5 text-[rgba(55,50,47,0.60)] group-hover:text-[#37322F]" />
                    <span className="text-sm font-medium font-sans">{link.label}</span>
                  </a>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-[#37322F] hover:bg-white rounded-lg transition-colors group"
                >
                  <Icon className="w-5 h-5 text-[rgba(55,50,47,0.60)] group-hover:text-[#37322F]" />
                  <span className="text-sm font-medium font-sans">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="absolute bottom-6 left-4 right-4 border-t border-[rgba(55,50,47,0.12)] pt-4 space-y-1">
            <Link
              href="/app/organizations"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 text-[#37322F] hover:bg-white rounded-lg transition-colors group"
            >
              <Building2 className="w-5 h-5 text-[rgba(55,50,47,0.60)] group-hover:text-[#37322F]" />
              <span className="text-sm font-medium font-sans">Organizations</span>
            </Link>
            <Link
              href="/app/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-3 py-3 text-[#37322F] hover:bg-white rounded-lg transition-colors group"
            >
              <User className="w-5 h-5 text-[rgba(55,50,47,0.60)] group-hover:text-[#37322F]" />
              <span className="text-sm font-medium font-sans">Profile</span>
            </Link>
            <Link
              href="/api/auth/signout"
              className="flex items-center gap-3 px-3 py-3 text-[#37322F] hover:bg-white rounded-lg transition-colors group"
            >
              <LogOut className="w-5 h-5 text-[rgba(55,50,47,0.60)] group-hover:text-[#37322F]" />
              <span className="text-sm font-medium font-sans">Sign Out</span>
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

