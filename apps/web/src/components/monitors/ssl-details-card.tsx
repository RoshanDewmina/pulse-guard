'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, Shield, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { SslCertificate, SslStatusBadge } from './ssl-status-badge';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

// Re-export for convenience
export type { SslCertificate } from './ssl-status-badge';

interface SslDetailsCardProps {
  monitorId: string;
  certificate: SslCertificate | null;
  onRefresh?: () => Promise<void>;
}

export function SslDetailsCard({ monitorId, certificate, onRefresh }: SslDetailsCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  if (!certificate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SSL Certificate
          </CardTitle>
          <CardDescription>No SSL certificate data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enable SSL monitoring to track certificate expiration and validity.
          </p>
        </CardContent>
      </Card>
    );
  }

  const expiresAt = new Date(certificate.expiresAt);
  const lastChecked = new Date(certificate.lastCheckedAt);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>SSL Certificate</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <SslStatusBadge certificate={certificate} />
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
        <CardDescription>Certificate details for {certificate.domain}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Certificate Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Domain</p>
            <p className="text-sm">{certificate.domain}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Issuer</p>
            <p className="text-sm">{certificate.issuer || 'Unknown'}</p>
          </div>
        </div>

        {/* Expiration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Expires
            </p>
            <p className="text-sm">{expiresAt.toLocaleDateString()}</p>
            <p className="text-xs text-muted-foreground">
              {certificate.daysUntilExpiry > 0
                ? `in ${certificate.daysUntilExpiry} days`
                : certificate.daysUntilExpiry === 0
                ? 'today'
                : `${Math.abs(certificate.daysUntilExpiry)} days ago`}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Last Checked</p>
            <p className="text-sm">{formatDistanceToNow(lastChecked, { addSuffix: true })}</p>
            <p className="text-xs text-muted-foreground">{lastChecked.toLocaleString()}</p>
          </div>
        </div>

        {/* Validation Status */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Validation Status</p>
          <div className="flex flex-wrap gap-2">
            <Badge variant={certificate.isValid ? 'default' : 'destructive'} className="gap-1">
              {certificate.isValid ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <XCircle className="h-3 w-3" />
              )}
              {certificate.isValid ? 'Valid' : 'Invalid'}
            </Badge>
            <Badge variant={certificate.chainValid ? 'default' : 'outline'} className="gap-1">
              {certificate.chainValid ? 'Chain Valid' : 'Chain Invalid'}
            </Badge>
            {certificate.isSelfSigned && (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Self-Signed
              </Badge>
            )}
          </div>
        </div>

        {/* Error Message */}
        {certificate.validationError && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Validation Error</p>
                <p className="text-sm text-muted-foreground">{certificate.validationError}</p>
              </div>
            </div>
          </div>
        )}

        {/* Technical Details */}
        {certificate.fingerprint && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              Technical Details
            </summary>
            <div className="mt-2 space-y-1 pl-4 text-xs">
              {certificate.serialNumber && (
                <p>
                  <span className="font-medium">Serial:</span> {certificate.serialNumber}
                </p>
              )}
              <p>
                <span className="font-medium">Fingerprint:</span>{' '}
                <code className="text-xs">{certificate.fingerprint}</code>
              </p>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

