'use client';

import { Badge } from '@/components/ui/badge';
import { Globe, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';

export interface DomainExpiration {
  id: string;
  domain: string;
  registrar: string | null;
  expiresAt: Date | string;
  daysUntilExpiry: number;
  autoRenew: boolean | null;
  nameservers: string[];
  status: string[];
  lastCheckedAt: Date | string;
}

interface DomainStatusBadgeProps {
  domain: DomainExpiration | null;
  showIcon?: boolean;
  showDays?: boolean;
}

export function DomainStatusBadge({ domain, showIcon = true, showDays = true }: DomainStatusBadgeProps) {
  if (!domain) {
    return (
      <Badge variant="outline" className="gap-1">
        {showIcon && <Globe className="h-3 w-3" />}
        No Domain Data
      </Badge>
    );
  }

  const { daysUntilExpiry } = domain;

  // Determine status and styling
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
  let Icon = CheckCircle;
  let label = 'Active';
  let className = '';

  if (daysUntilExpiry <= 0) {
    variant = 'destructive';
    Icon = XCircle;
    label = 'Expired';
  } else if (daysUntilExpiry <= 14) {
    variant = 'destructive';
    Icon = AlertTriangle;
    label = 'Expiring Soon';
  } else if (daysUntilExpiry <= 30) {
    variant = 'outline';
    Icon = Clock;
    label = 'Expiring';
    className = 'border-orange-500 text-orange-700 dark:text-orange-400';
  } else if (daysUntilExpiry <= 60) {
    variant = 'secondary';
    Icon = Clock;
    label = 'Expires Soon';
  } else {
    variant = 'default';
    Icon = CheckCircle;
    label = 'Active';
    className = 'bg-green-500 text-white dark:bg-green-600';
  }

  return (
    <Badge variant={variant} className={`gap-1 ${className}`}>
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{label}</span>
      {showDays && daysUntilExpiry > 0 && (
        <span className="text-xs opacity-80">({daysUntilExpiry}d)</span>
      )}
    </Badge>
  );
}

