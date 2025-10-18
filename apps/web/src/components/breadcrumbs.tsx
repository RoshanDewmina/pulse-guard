'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: Breadcrumb[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const router = useRouter();

  const handleBack = () => {
    // Go back to the second-to-last breadcrumb if it has a href, otherwise use router.back()
    if (items.length >= 2 && items[items.length - 2].href) {
      router.push(items[items.length - 2].href!);
    } else {
      router.back();
    }
  };

  // Only show back button if there are multiple breadcrumbs
  const showBackButton = items.length > 1;

  return (
    <div className="flex items-center gap-2 mb-6">
      {showBackButton && (
        <>
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm text-[rgba(55,50,47,0.60)] hover:text-[#37322F] transition-colors font-sans group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          <ChevronRight className="w-4 h-4 text-[rgba(55,50,47,0.40)]" />
        </>
      )}
      
      {/* Breadcrumb trail */}
      <nav className="flex items-center gap-2 flex-wrap">
        {items.map((crumb, index) => (
          <div key={index} className="flex items-center gap-2">
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="text-sm text-[rgba(55,50,47,0.60)] hover:text-[#37322F] transition-colors font-sans"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-sm text-[#37322F] font-medium font-sans">
                {crumb.label}
              </span>
            )}
            {index < items.length - 1 && (
              <ChevronRight className="w-4 h-4 text-[rgba(55,50,47,0.40)]" />
            )}
          </div>
        ))}
      </nav>
    </div>
  );
}

