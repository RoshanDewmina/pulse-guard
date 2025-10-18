import { 
  SaturnCard, 
  SaturnCardHeader, 
  SaturnCardTitle, 
  SaturnCardDescription, 
  SaturnCardContent, 
  SaturnButton 
} from '@/components/saturn';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Authentication Error | Saturn",
  description: "There was an error signing in to Saturn.",
  path: '/auth/error',
  noIndex: true,
})

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to sign in.',
    Verification: 'The sign in link is no longer valid. It may have expired.',
    Default: 'An error occurred during sign in.',
  };

  const { error = 'Default' } = await searchParams;
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SaturnCard>
          <SaturnCardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <SaturnCardTitle as="h2">Authentication Error</SaturnCardTitle>
            <SaturnCardDescription>There was a problem signing you in</SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-sans">{errorMessage}</p>
              </div>

              <div className="pt-4 text-center">
                <Link href="/auth/signin">
                  <SaturnButton fullWidth>Try Again</SaturnButton>
                </Link>
              </div>

              <p className="text-center text-xs text-[rgba(55,50,47,0.60)] font-sans">
                If the problem persists, please contact support
              </p>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </div>
    </div>
  );
}
