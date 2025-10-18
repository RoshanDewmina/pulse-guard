import { 
  SaturnCard, 
  SaturnCardHeader, 
  SaturnCardTitle, 
  SaturnCardDescription, 
  SaturnCardContent, 
  SaturnButton 
} from '@/components/saturn';
import { Mail } from 'lucide-react';
import Link from 'next/link';
import { generatePageMetadata } from "@/lib/seo/metadata"

export const metadata = generatePageMetadata({
  title: "Check Your Email | Saturn",
  description: "We've sent you a magic link to sign in to Saturn.",
  path: '/auth/verify-request',
  noIndex: true,
})

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SaturnCard>
          <SaturnCardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <SaturnCardTitle as="h2">Check your email</SaturnCardTitle>
            <SaturnCardDescription>
              We&apos;ve sent you a magic link to sign in
            </SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                  Click the link in the email to sign in to your account.
                </p>
                <p className="text-sm text-[rgba(55,50,47,0.80)] font-sans">
                  The link will expire in 24 hours.
                </p>
              </div>

              <div className="pt-4 text-center">
                <Link href="/auth/signin">
                  <SaturnButton variant="secondary" fullWidth>Back to sign in</SaturnButton>
                </Link>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </div>
    </div>
  );
}
