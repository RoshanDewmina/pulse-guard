import React from 'react';
import { cn } from '@/lib/utils';

interface SaturnInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  fullWidth?: boolean;
}

export const SaturnInput = React.forwardRef<HTMLInputElement, SaturnInputProps>(
  ({ className, error, fullWidth, ...props }, ref) => {
    return (
      <div className={cn(fullWidth && 'w-full')}>
        <input
          ref={ref}
          className={cn(
            'flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm font-sans text-[#37322F]',
            'border-[rgba(55,50,47,0.12)] placeholder:text-[rgba(55,50,47,0.40)]',
            'focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600 font-sans">{error}</p>
        )}
      </div>
    );
  }
);

SaturnInput.displayName = 'SaturnInput';


