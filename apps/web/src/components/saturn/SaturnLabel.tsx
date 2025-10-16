import React from 'react';
import { cn } from '@/lib/utils';

interface SaturnLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function SaturnLabel({ 
  children, 
  className, 
  required,
  ...props 
}: SaturnLabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-[#37322F] font-sans mb-1.5',
        className
      )}
      {...props}
    >
      {children}
      {required && <span className="text-red-600 ml-1">*</span>}
    </label>
  );
}


