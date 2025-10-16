import React from 'react';
import { cn } from '@/lib/utils';

interface SaturnCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  noBorder?: boolean;
}

export function SaturnCard({ 
  children, 
  className, 
  padding = 'md',
  noBorder = false 
}: SaturnCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div 
      className={cn(
        'bg-white shadow-[0px_0px_0px_0.75px_rgba(50,45,43,0.12)] overflow-hidden rounded-lg',
        !noBorder && 'border border-[rgba(55,50,47,0.08)]',
        paddingClasses[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

interface SaturnCardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnCardHeader({ children, className }: SaturnCardHeaderProps) {
  return (
    <div className={cn('p-6 border-b border-[rgba(55,50,47,0.08)]', className)}>
      {children}
    </div>
  );
}

interface SaturnCardTitleProps {
  children: React.ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function SaturnCardTitle({ children, className, as = 'h2' }: SaturnCardTitleProps) {
  const Component = as;
  const sizeClasses = {
    h1: 'text-3xl sm:text-4xl',
    h2: 'text-xl sm:text-2xl',
    h3: 'text-lg sm:text-xl',
    h4: 'text-base sm:text-lg',
  };

  return (
    <Component className={cn(
      sizeClasses[as],
      'font-normal text-[#37322F] font-serif',
      className
    )}>
      {children}
    </Component>
  );
}

interface SaturnCardDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnCardDescription({ children, className }: SaturnCardDescriptionProps) {
  return (
    <p className={cn('text-[rgba(55,50,47,0.60)] text-sm font-sans mt-1', className)}>
      {children}
    </p>
  );
}

interface SaturnCardContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnCardContent({ children, className }: SaturnCardContentProps) {
  return (
    <div className={cn('p-6', className)}>
      {children}
    </div>
  );
}


