'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { RunResultsViewer } from '@/components/synthetic/run-results-viewer';
import type { SyntheticRun as RunResultsViewerSyntheticRun } from '@/components/synthetic/run-results-viewer';
import { 
  ArrowLeft, 
  Play, 
  Edit, 
  Trash2, 
  Clock, 
  Globe, 
  Loader2,
  AlertCircle 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface SyntheticMonitor {
  id: string;
  name: string;
  url: string;
  description?: string;
  isEnabled: boolean;
  intervalMinutes: number;
  timeout: number;
  lastRunAt?: Date | string;
  lastStatus?: string;
  SyntheticStep: Array<{
    id: string;
    order: number;
    type: string;
    selector?: string;
    value?: string;
  }>;
}

interface SyntheticStepResult {
  id: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'SKIPPED';
  startedAt: Date | string;
  completedAt?: Date | string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  screenshot?: string | null;
  SyntheticStep: {
    id: string;
    order: number;
    type: string;
    selector?: string;
    value?: string;
  };
}

interface SyntheticRun {
  id: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  startedAt: Date | string;
  completedAt?: Date | string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  screenshots?: Record<string, string>;
  SyntheticStepResult?: SyntheticStepResult[];
}

export default function SyntheticMonitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const monitorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [monitor, setMonitor] = useState<SyntheticMonitor | null>(null);
  const [recentRuns, setRecentRuns] = useState<RunResultsViewerSyntheticRun[]>([]);

  useEffect(() => {
    fetchData();
  }, [monitorId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/synthetic/${monitorId}`);
      if (!res.ok) throw new Error('Failed to fetch monitor');
      const data = await res.json();
      setMonitor(data.monitor);
      setRecentRuns(data.recentRuns || []);
    } catch (error) {
      console.error('Error fetching monitor:', error);
      toast.error('Failed to load monitor details');
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await fetch(`/api/synthetic/${monitorId}/run`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to trigger run');

      toast.success('Monitor run started');
      setTimeout(() => fetchData(), 3000);
    } catch (error) {
      console.error('Error triggering run:', error);
      toast.error('Failed to start monitor run');
    } finally {
      setRunning(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this monitor?')) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/synthetic/${monitorId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete monitor');

      toast.success('Monitor deleted');
      router.push('/app/synthetic');
    } catch (error) {
      console.error('Error deleting monitor:', error);
      toast.error('Failed to delete monitor');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeaderWithBreadcrumbs
          title="Loading..."
          description="Please wait"
          breadcrumbs={[
            { label: 'Synthetic Monitors', href: '/app/synthetic' },
            { label: 'Loading...' },
          ]}
        />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!monitor) {
    return (
      <div className="space-y-8">
        <PageHeaderWithBreadcrumbs
          title="Monitor Not Found"
          description="The synthetic monitor could not be found"
          breadcrumbs={[
            { label: 'Synthetic Monitors', href: '/app/synthetic' },
            { label: 'Not Found' },
          ]}
        />
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Monitor not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/app/synthetic')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Monitors
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeaderWithBreadcrumbs
        title={monitor.name}
        description={monitor.description || monitor.url}
        breadcrumbs={[
          { label: 'Synthetic Monitors', href: '/app/synthetic' },
          { label: monitor.name },
        ]}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleRun}
              disabled={running || !monitor.isEnabled}
            >
              {running ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Now
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/app/synthetic/${monitorId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        }
      />

      {/* Monitor Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monitor Configuration</CardTitle>
            <div className="flex items-center gap-2">
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">URL</p>
              <p className="font-medium flex items-center gap-2 mt-1">
                <Globe className="h-4 w-4" />
                {monitor.url}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interval</p>
              <p className="font-medium flex items-center gap-2 mt-1">
                <Clock className="h-4 w-4" />
                Every {monitor.intervalMinutes} minutes
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timeout</p>
              <p className="font-medium mt-1">{monitor.timeout / 1000}s</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Steps</p>
              <p className="font-medium mt-1">{monitor.SyntheticStep.length} configured</p>
            </div>
          </div>

          {/* Steps Preview */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-medium mb-3">Test Steps</h4>
            <div className="space-y-2">
              {monitor.SyntheticStep
                .sort((a, b) => a.order - b.order)
                .map((step, index) => (
                  <div
                    key={step.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{step.type}</p>
                      {(step.selector || step.value) && (
                        <p className="text-xs text-muted-foreground">
                          {step.selector} {step.value && `→ ${step.value}`}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Runs</CardTitle>
          <CardDescription>
            {recentRuns.length > 0
              ? `${recentRuns.length} most recent test runs`
              : 'No test runs yet'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No test runs yet. Click "Run Now" to execute your first test.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <RunResultsViewer runs={recentRuns} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

