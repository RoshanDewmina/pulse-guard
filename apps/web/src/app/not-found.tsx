import { SaturnCard, SaturnCardHeader, SaturnCardTitle, SaturnCardDescription, SaturnCardContent, SaturnButton } from '@/components/saturn';
import { FileQuestion } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F7F5F3] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SaturnCard>
          <SaturnCardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-[rgba(55,50,47,0.12)] rounded-full flex items-center justify-center">
                <FileQuestion className="w-8 h-8 text-[rgba(55,50,47,0.80)]" />
              </div>
            </div>
            <SaturnCardTitle as="h2">Page Not Found</SaturnCardTitle>
            <SaturnCardDescription>The page you&apos;re looking for doesn&apos;t exist</SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-4">
              <p className="text-center text-sm text-[rgba(55,50,47,0.80)] font-sans">
                The URL you entered may be incorrect or the page may have been moved.
              </p>

              <Link href="/app">
                <SaturnButton fullWidth>Go to Dashboard</SaturnButton>
              </Link>

              <Link href="/">
                <SaturnButton variant="secondary" fullWidth>Go to Home</SaturnButton>
              </Link>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </div>
    </div>
  );
}
