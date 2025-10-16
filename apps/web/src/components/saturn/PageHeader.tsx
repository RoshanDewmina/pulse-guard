import React from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4', className)}>
      <div>
        <h1 className="text-3xl sm:text-4xl lg:text-[52px] font-normal leading-tight text-[#37322F] font-serif">
          {title}
        </h1>
        {description && (
          <p className="text-[rgba(55,50,47,0.80)] text-sm sm:text-base lg:text-lg font-medium font-sans mt-2">
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}


