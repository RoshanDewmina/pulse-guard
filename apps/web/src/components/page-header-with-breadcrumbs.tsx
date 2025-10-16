'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderWithBreadcrumbsProps {
  title: string | React.ReactNode;
  description?: string;
  breadcrumbs: Breadcrumb[];
  action?: React.ReactNode;
  className?: string;
}

export function PageHeaderWithBreadcrumbs({
  title,
  description,
  breadcrumbs,
  action,
  className,
}: PageHeaderWithBreadcrumbsProps) {
  const router = useRouter();

  const handleBack = () => {
    // Go back to the second-to-last breadcrumb if it has a href, otherwise use router.back()
    if (breadcrumbs.length >= 2 && breadcrumbs[breadcrumbs.length - 2].href) {
      router.push(breadcrumbs[breadcrumbs.length - 2].href!);
    } else {
      router.back();
    }
  };

  // Only show back button if there are multiple breadcrumbs
  const showBackButton = breadcrumbs.length > 1;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs with back button */}
      <div className="flex items-center gap-2">
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
          {breadcrumbs.map((crumb, index) => (
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
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="w-4 h-4 text-[rgba(55,50,47,0.40)]" />
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Title and description */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4 lg:gap-6">
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-normal leading-tight text-[#37322F] font-serif">
            {title}
          </h1>
          {description && (
            <p className="text-[rgba(55,50,47,0.80)] text-sm sm:text-base lg:text-lg font-medium font-sans mt-2">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="flex-shrink-0 w-full sm:w-auto self-start lg:self-center">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

