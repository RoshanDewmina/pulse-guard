'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, Globe, Server, CheckCircle, AlertCircle } from 'lucide-react';
import { DomainExpiration, DomainStatusBadge } from './domain-status-badge';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

// Re-export for convenience
export type { DomainExpiration } from './domain-status-badge';

interface DomainDetailsCardProps {
  monitorId: string;
  domain: DomainExpiration | null;
  onRefresh?: () => Promise<void>;
}

export function DomainDetailsCard({ monitorId, domain, onRefresh }: DomainDetailsCardProps) {
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

  if (!domain) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Domain Registration
          </CardTitle>
          <CardDescription>No domain registration data available</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enable domain monitoring to track registration expiration and status.
          </p>
        </CardContent>
      </Card>
    );
  }

  const expiresAt = new Date(domain.expiresAt);
  const lastChecked = new Date(domain.lastCheckedAt);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            <CardTitle>Domain Registration</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <DomainStatusBadge domain={domain} />
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
        <CardDescription>Registration details for {domain.domain}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Domain Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Domain</p>
            <p className="text-sm font-mono">{domain.domain}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Registrar</p>
            <p className="text-sm">{domain.registrar || 'Unknown'}</p>
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
              {domain.daysUntilExpiry > 0
                ? `in ${domain.daysUntilExpiry} days`
                : domain.daysUntilExpiry === 0
                ? 'today'
                : `${Math.abs(domain.daysUntilExpiry)} days ago`}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Last Checked</p>
            <p className="text-sm">{formatDistanceToNow(lastChecked, { addSuffix: true })}</p>
            <p className="text-xs text-muted-foreground">{lastChecked.toLocaleString()}</p>
          </div>
        </div>

        {/* Auto-Renew Status */}
        {domain.autoRenew !== null && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Auto-Renew</p>
            <Badge variant={domain.autoRenew ? 'default' : 'outline'} className="gap-1">
              {domain.autoRenew ? (
                <>
                  <CheckCircle className="h-3 w-3" />
                  Enabled
                </>
              ) : (
                <>
                  <AlertCircle className="h-3 w-3" />
                  Disabled
                </>
              )}
            </Badge>
          </div>
        )}

        {/* Nameservers */}
        {domain.nameservers && domain.nameservers.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <Server className="h-3 w-3" />
              Nameservers
            </p>
            <div className="mt-2 space-y-1">
              {domain.nameservers.slice(0, 4).map((ns, index) => (
                <p key={index} className="text-xs font-mono text-muted-foreground">
                  {ns}
                </p>
              ))}
              {domain.nameservers.length > 4 && (
                <p className="text-xs text-muted-foreground">
                  +{domain.nameservers.length - 4} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Domain Status */}
        {domain.status && domain.status.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              Domain Status ({domain.status.length})
            </summary>
            <div className="mt-2 space-y-1 pl-4">
              {domain.status.map((status, index) => (
                <p key={index} className="text-xs text-muted-foreground">
                  {status}
                </p>
              ))}
            </div>
          </details>
        )}

        {/* Warning for expiring domain */}
        {domain.daysUntilExpiry > 0 && domain.daysUntilExpiry <= 30 && (
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3 border border-orange-200 dark:border-orange-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                  Domain Expiring Soon
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  Your domain expires in {domain.daysUntilExpiry} day{domain.daysUntilExpiry !== 1 ? 's' : ''}. 
                  {domain.autoRenew === false && ' Auto-renew is disabled.'}
                  {' '}Make sure to renew before expiration to avoid losing your domain.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning for expired domain */}
        {domain.daysUntilExpiry <= 0 && (
          <div className="rounded-lg bg-destructive/10 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Domain Expired</p>
                <p className="text-sm text-muted-foreground">
                  This domain expired {Math.abs(domain.daysUntilExpiry)} day{Math.abs(domain.daysUntilExpiry) !== 1 ? 's' : ''} ago. 
                  Renew immediately to prevent loss of ownership.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

