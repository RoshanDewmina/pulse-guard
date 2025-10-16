'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface SaturnTableProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnTable({ children, className }: SaturnTableProps) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn('w-full border-collapse', className)}>
        {children}
      </table>
    </div>
  );
}

interface SaturnTableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnTableHeader({ children, className }: SaturnTableHeaderProps) {
  return (
    <thead className={cn('border-b border-[rgba(55,50,47,0.12)]', className)}>
      {children}
    </thead>
  );
}

interface SaturnTableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnTableBody({ children, className }: SaturnTableBodyProps) {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
}

interface SaturnTableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  clickable?: boolean;
}

export function SaturnTableRow({ children, className, onClick, clickable }: SaturnTableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'border-b border-[rgba(55,50,47,0.06)]',
        (clickable || onClick) && 'cursor-pointer hover:bg-[#F7F5F3] transition-colors',
        className
      )}
    >
      {children}
    </tr>
  );
}

interface SaturnTableHeadProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnTableHead({ children, className }: SaturnTableHeadProps) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-medium text-[rgba(55,50,47,0.80)] font-sans uppercase tracking-wider',
        className
      )}
    >
      {children}
    </th>
  );
}

interface SaturnTableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function SaturnTableCell({ children, className }: SaturnTableCellProps) {
  return (
    <td
      className={cn(
        'px-4 py-4 text-sm text-[#37322F] font-sans',
        className
      )}
    >
      {children}
    </td>
  );
}


