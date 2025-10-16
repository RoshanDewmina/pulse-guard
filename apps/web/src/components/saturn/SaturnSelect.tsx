'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

interface SaturnSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  fullWidth?: boolean;
  className?: string;
}

export function SaturnSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Select an option',
  error,
  fullWidth,
  className,
}: SaturnSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className={cn('relative', fullWidth && 'w-full', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex h-10 w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm font-sans text-[#37322F]',
          'border-[rgba(55,50,47,0.12)]',
          'focus:outline-none focus:ring-2 focus:ring-[#37322F] focus:ring-offset-2',
          error && 'border-red-500 focus:ring-red-500'
        )}
      >
        <span className={cn(!selectedOption && 'text-[rgba(55,50,47,0.40)]')}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="h-4 w-4 text-[rgba(55,50,47,0.60)]" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-[rgba(55,50,47,0.12)] bg-white shadow-[0px_4px_12px_rgba(55,50,47,0.12)]">
            <div className="max-h-60 overflow-auto p-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onValueChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm font-sans rounded-md transition-colors',
                    'hover:bg-[#F7F5F3]',
                    value === option.value
                      ? 'bg-[#F7F5F3] text-[#37322F] font-medium'
                      : 'text-[rgba(55,50,47,0.80)]'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600 font-sans">{error}</p>
      )}
    </div>
  );
}


