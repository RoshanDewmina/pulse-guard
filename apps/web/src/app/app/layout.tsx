export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/app-sidebar';
import { cookies } from 'next/headers';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  // Redirect to onboarding if not completed
  if (!session.user?.onboardingCompleted) {
    redirect('/onboarding');
  }

  // Get active org from cookie
  const cookieStore = await cookies();
  const activeOrgId = cookieStore.get('active-org-id')?.value;

  // Get the user's organization
  const org = await getUserPrimaryOrg(session.user.id, activeOrgId);

  const userInitial = session.user?.name?.[0] || session.user?.email?.[0] || 'U';
  const userName = session.user?.name || '';
  const userEmail = session.user?.email || '';
  const orgName = org?.name || '';

  return (
    <div className="w-full min-h-screen bg-[#F7F5F3] flex">
      {/* Sidebar */}
      <AppSidebar 
        orgName={orgName}
        userInitial={userInitial}
        userName={userName}
        userEmail={userEmail}
      />

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl">
        {children}
      </main>
    </div>
  );
}

