import React from 'react';
import { CheckCircle2, Clock, AlertCircle, XCircle, Activity, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

type Status = 'OK' | 'LATE' | 'MISSED' | 'FAILING' | 'DISABLED' | 'UNKNOWN';

interface StatusIconProps {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  OK: {
    icon: CheckCircle2,
    color: 'text-green-600',
    label: 'Healthy',
  },
  LATE: {
    icon: Clock,
    color: 'text-yellow-600',
    label: 'Late',
  },
  MISSED: {
    icon: AlertCircle,
    color: 'text-orange-600',
    label: 'Missed',
  },
  FAILING: {
    icon: XCircle,
    color: 'text-red-600',
    label: 'Failing',
  },
  DISABLED: {
    icon: Ban,
    color: 'text-gray-400',
    label: 'Disabled',
  },
  UNKNOWN: {
    icon: Activity,
    color: 'text-gray-500',
    label: 'Unknown',
  },
};

export function StatusIcon({ 
  status, 
  size = 'md', 
  showLabel = false,
  className 
}: StatusIconProps) {
  const config = statusConfig[status] || statusConfig.UNKNOWN;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  if (showLabel) {
    return (
      <div className={cn('inline-flex items-center gap-2', className)}>
        <Icon className={cn(sizeClasses[size], config.color)} />
        <span className="text-sm font-medium font-sans text-[#37322F]">
          {config.label}
        </span>
      </div>
    );
  }

  return (
    <Icon className={cn(sizeClasses[size], config.color, className)} />
  );
}

