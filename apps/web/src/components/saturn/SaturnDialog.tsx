'use client';

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface SaturnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function SaturnDialog({ open, onOpenChange, children }: SaturnDialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Dialog Content */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        {children}
      </div>
    </div>
  );
}

interface SaturnDialogContentProps {
  children: React.ReactNode;
  className?: string;
  showClose?: boolean;
  onClose?: () => void;
}

export function SaturnDialogContent({
  children,
  className,
  showClose = true,
  onClose,
}: SaturnDialogContentProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-[0px_0px_0px_2px_white,0px_4px_12px_rgba(55,50,47,0.12)] overflow-hidden',
        'border border-[rgba(55,50,47,0.08)]',
        className
      )}
    >
      {showClose && onClose && (
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 hover:bg-[#F7F5F3] transition-colors"
        >
          <X className="h-5 w-5 text-[rgba(55,50,47,0.60)]" />
        </button>
      )}
      {children}
    </div>
  );
}

interface SaturnDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnDialogHeader({ children, className }: SaturnDialogHeaderProps) {
  return (
    <div className={cn('p-6 border-b border-[rgba(55,50,47,0.08)]', className)}>
      {children}
    </div>
  );
}

interface SaturnDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnDialogTitle({ children, className }: SaturnDialogTitleProps) {
  return (
    <h2 className={cn('text-xl sm:text-2xl font-normal text-[#37322F] font-serif', className)}>
      {children}
    </h2>
  );
}

interface SaturnDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnDialogDescription({ children, className }: SaturnDialogDescriptionProps) {
  return (
    <p className={cn('text-[rgba(55,50,47,0.60)] text-sm font-sans mt-1', className)}>
      {children}
    </p>
  );
}

interface SaturnDialogBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnDialogBody({ children, className }: SaturnDialogBodyProps) {
  return <div className={cn('p-6', className)}>{children}</div>;
}

interface SaturnDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnDialogFooter({ children, className }: SaturnDialogFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 p-6 border-t border-[rgba(55,50,47,0.08)]',
        className
      )}
    >
      {children}
    </div>
  );
}


