'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SaturnButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function SaturnButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  fullWidth = false,
  className,
  disabled,
  ...props
}: SaturnButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium font-sans transition-colors rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-[#37322F] text-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-[#49423D] focus:ring-[#37322F]',
    secondary: 'bg-white text-[#37322F] shadow-[0px_1px_2px_rgba(55,50,47,0.12)] border border-[rgba(55,50,47,0.08)] hover:bg-gray-50 focus:ring-[#37322F]',
    ghost: 'text-[rgba(49,45,43,0.80)] hover:bg-[#F7F5F3] focus:ring-[#37322F]',
    danger: 'bg-red-600 text-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] hover:bg-red-700 focus:ring-red-600',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 sm:px-5 py-2 sm:py-2.5 text-sm sm:text-[13px]',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : icon ? (
        <span className="w-4 h-4">{icon}</span>
      ) : null}
      <span className="leading-5">{children}</span>
    </button>
  );
}


