export const dynamic = 'force-dynamic';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { generatePageMetadata } from '@/lib/seo/metadata'

export const metadata = generatePageMetadata({
  title: "Get Started",
  description: "Complete your Saturn onboarding.",
  path: '/onboarding',
  noIndex: true,
})

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Must be authenticated to access onboarding
  if (!session) {
    redirect('/auth/signin');
  }

  // If already completed onboarding, redirect to app
  if (session.user?.onboardingCompleted) {
    redirect('/app');
  }

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 200, 255, 0.2) 0%, transparent 50%)
          `,
        }}
      />
      <div className="relative z-10 w-full max-w-2xl">
        {children}
      </div>
    </div>
  );
}


