'use client';

import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, Clock } from 'lucide-react';

export interface SslCertificate {
  id: string;
  domain: string;
  issuer: string | null;
  subject: string | null;
  issuedAt: Date | string | null;
  expiresAt: Date | string;
  daysUntilExpiry: number;
  isValid: boolean;
  isSelfSigned: boolean;
  chainValid: boolean;
  validationError: string | null;
  serialNumber: string | null;
  fingerprint: string | null;
  lastCheckedAt: Date | string;
}

interface SslStatusBadgeProps {
  certificate: SslCertificate | null;
  showIcon?: boolean;
  showDays?: boolean;
}

export function SslStatusBadge({ certificate, showIcon = true, showDays = true }: SslStatusBadgeProps) {
  if (!certificate) {
    return (
      <Badge variant="outline" className="gap-1">
        {showIcon && <Shield className="h-3 w-3" />}
        No SSL Data
      </Badge>
    );
  }

  const { daysUntilExpiry, isValid } = certificate;

  // Determine status and styling
  let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default';
  let Icon = ShieldCheck;
  let label = 'Valid';
  let className = '';

  if (!isValid) {
    variant = 'destructive';
    Icon = ShieldX;
    label = 'Invalid';
  } else if (daysUntilExpiry <= 0) {
    variant = 'destructive';
    Icon = ShieldX;
    label = 'Expired';
  } else if (daysUntilExpiry <= 7) {
    variant = 'destructive';
    Icon = ShieldAlert;
    label = 'Expiring Soon';
  } else if (daysUntilExpiry <= 14) {
    variant = 'outline';
    Icon = Clock;
    label = 'Expiring';
    className = 'border-orange-500 text-orange-700 dark:text-orange-400';
  } else if (daysUntilExpiry <= 30) {
    variant = 'secondary';
    Icon = Clock;
    label = 'Expires Soon';
  } else {
    variant = 'default';
    Icon = ShieldCheck;
    label = 'Valid';
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

