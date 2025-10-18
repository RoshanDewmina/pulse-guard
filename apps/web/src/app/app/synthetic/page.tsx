'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { Plus, Play, Clock, CheckCircle, XCircle, Loader2, Globe } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface SyntheticMonitor {
  id: string;
  name: string;
  url: string;
  description?: string;
  isEnabled: boolean;
  intervalMinutes: number;
  lastRunAt?: Date | string;
  lastStatus?: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  SyntheticStep: Array<{ id: string }>;
}

export default function SyntheticMonitorsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [monitors, setMonitors] = useState<SyntheticMonitor[]>([]);

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/synthetic');
      if (!res.ok) throw new Error('Failed to fetch monitors');
      const data = await res.json();
      setMonitors(data.monitors || []);
    } catch (error) {
      console.error('Error fetching synthetic monitors:', error);
      toast.error('Failed to load synthetic monitors');
    } finally {
      setLoading(false);
    }
  };

  const handleRunMonitor = async (id: string) => {
    try {
      const res = await fetch(`/api/synthetic/${id}/run`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to trigger run');

      toast.success('Synthetic monitor run started');
      setTimeout(() => fetchMonitors(), 2000);
    } catch (error) {
      console.error('Error triggering run:', error);
      toast.error('Failed to trigger monitor run');
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'RUNNING':
        return (
          <Badge variant="default" className="gap-1">
            <Clock className="h-3 w-3" />
            Running
          </Badge>
        );
      case 'SUCCESS':
        return (
          <Badge variant="default" className="gap-1 bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3" />
            Success
          </Badge>
        );
      case 'FAILED':
      case 'TIMEOUT':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {status === 'TIMEOUT' ? 'Timeout' : 'Failed'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Not run
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeaderWithBreadcrumbs
          title="Synthetic Monitors"
          description="Loading..."
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'Synthetic Monitors' },
          ]}
        />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeaderWithBreadcrumbs
        title="Synthetic Monitors"
        description="Multi-step browser automation for testing user journeys"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Synthetic Monitors' },
        ]}
        action={
          <Button onClick={() => router.push('/app/synthetic/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Monitor
          </Button>
        }
      />

      {monitors.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center max-w-md">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Synthetic Monitors</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Create your first synthetic monitor to test multi-step user journeys and workflows
              </p>
              <Button onClick={() => router.push('/app/synthetic/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Synthetic Monitor
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {monitors.map((monitor) => (
            <Card key={monitor.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="truncate">{monitor.name}</CardTitle>
                    <CardDescription className="truncate">{monitor.url}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {monitor.isEnabled ? (
                      <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Description */}
                  {monitor.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {monitor.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Interval</p>
                      <p className="font-medium">{monitor.intervalMinutes} min</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Steps</p>
                      <p className="font-medium">{monitor.SyntheticStep.length}</p>
                    </div>
                  </div>

                  {/* Last Run */}
                  <div className="flex items-center justify-between py-3 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Last run:</span>
                      {getStatusBadge(monitor.lastStatus)}
                    </div>
                    {monitor.lastRunAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(monitor.lastRunAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/app/synthetic/${monitor.id}`)}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRunMonitor(monitor.id)}
                      disabled={!monitor.isEnabled}
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

