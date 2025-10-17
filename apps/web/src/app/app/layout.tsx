export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Activity, Bell, Settings, LogOut, BarChart3, User } from 'lucide-react';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  const userInitial = session.user?.name?.[0] || session.user?.email?.[0] || 'U';

  return (
    <div className="w-full min-h-screen relative bg-[#F7F5F3] overflow-x-hidden flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center w-full">
        {/* Main container with proper margins */}
        <div className="w-full max-w-none px-4 sm:px-6 md:px-8 lg:px-0 lg:max-w-[1060px] lg:w-[1060px] relative flex flex-col justify-start items-start min-h-screen">
          {/* Left vertical line */}
          <div className="w-[1px] h-full absolute left-4 sm:left-6 md:left-8 lg:left-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          {/* Right vertical line */}
          <div className="w-[1px] h-full absolute right-4 sm:right-6 md:right-8 lg:right-0 top-0 bg-[rgba(55,50,47,0.12)] shadow-[1px_0px_0px_white] z-0"></div>

          <div className="self-stretch pt-[9px] overflow-hidden border-b border-[rgba(55,50,47,0.06)] flex flex-col justify-center items-center gap-4 sm:gap-6 md:gap-8 lg:gap-[66px] relative z-10">
            {/* Navigation */}
            <div className="w-full h-12 sm:h-14 md:h-16 lg:h-[84px] absolute left-0 top-0 flex justify-center items-center z-20 px-6 sm:px-8 md:px-12 lg:px-0">
              <div className="w-full h-0 absolute left-0 top-6 sm:top-7 md:top-8 lg:top-[42px] border-t border-[rgba(55,50,47,0.12)] shadow-[0px_1px_0px_white]"></div>

              <div className="w-full max-w-[calc(100%-32px)] sm:max-w-[calc(100%-48px)] md:max-w-[calc(100%-64px)] lg:max-w-[700px] lg:w-[700px] h-10 sm:h-11 md:h-12 py-1.5 sm:py-2 px-3 sm:px-4 md:px-4 pr-2 sm:pr-3 bg-[#F7F5F3] backdrop-blur-sm shadow-[0px_0px_0px_2px_white] overflow-hidden rounded-[50px] flex justify-between items-center relative z-30">
                <div className="flex justify-center items-center">
                  <Link href="/app" className="flex justify-start items-center cursor-pointer">
                    <div className="flex flex-col justify-center text-[#2F3037] text-sm sm:text-base md:text-lg lg:text-xl font-medium leading-5 font-sans">
                      Saturn
                    </div>
                  </Link>
                  <div className="pl-3 sm:pl-4 md:pl-5 lg:pl-5 flex justify-start items-start hidden sm:flex flex-row gap-2 sm:gap-3 md:gap-4 lg:gap-4">
                    <Link href="/app/monitors" className="flex justify-start items-center hover:opacity-70 transition-opacity">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Monitors
                      </div>
                    </Link>
                    <Link href="/app/incidents" className="flex justify-start items-center hover:opacity-70 transition-opacity">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Incidents
                      </div>
                    </Link>
                    <Link href="/app/analytics" className="flex justify-start items-center hover:opacity-70 transition-opacity">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Analytics
                      </div>
                    </Link>
                    <Link href="/app/integrations" className="flex justify-start items-center hover:opacity-70 transition-opacity">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Integrations
                      </div>
                    </Link>
                    <Link href="/app/settings" className="flex justify-start items-center hover:opacity-70 transition-opacity">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Settings
                      </div>
                    </Link>
                    <Link href="https://docs.saturnmonitor.com" target="_blank" rel="noopener noreferrer" className="flex justify-start items-center hover:opacity-70 transition-opacity">
                      <div className="flex flex-col justify-center text-[rgba(49,45,43,0.80)] text-xs md:text-[13px] font-medium leading-[14px] font-sans">
                        Docs
                      </div>
                    </Link>
                  </div>
                </div>
                <div className="h-6 sm:h-7 md:h-8 flex justify-start items-start gap-2 sm:gap-3">
                  <div className="group relative">
                    <div className="px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col justify-center text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans">
                        {userInitial}
                      </div>
                    </div>
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-[0px_0px_0px_2px_white,0px_4px_12px_rgba(55,50,47,0.12)] rounded-lg overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-3 border-b border-[rgba(55,50,47,0.12)]">
                        <div className="text-[#37322F] text-sm font-medium font-sans">{session.user?.name}</div>
                        <div className="text-[rgba(55,50,47,0.60)] text-xs font-sans">{session.user?.email}</div>
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
          </div>

          {/* Main Content */}
          <main className="w-full pt-8 sm:pt-12 md:pt-16 lg:pt-20 pb-12 sm:pb-16 md:pb-20 lg:pb-24 relative z-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

