'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock, Eye, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useState } from 'react';

export interface SyntheticRun {
  id: string;
  status: 'RUNNING' | 'SUCCESS' | 'FAILED' | 'TIMEOUT' | 'CANCELLED';
  startedAt: Date | string;
  completedAt?: Date | string | null;
  durationMs?: number | null;
  errorMessage?: string | null;
  screenshots?: Record<string, string>;
  SyntheticStepResult?: SyntheticStepResult[];
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
    label: string;
  };
}

interface RunResultsViewerProps {
  runs: SyntheticRun[];
}

export function RunResultsViewer({ runs }: RunResultsViewerProps) {
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No runs yet. Trigger a test to see results.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Recent Runs</h3>
      
      <div className="space-y-2">
        {runs.map((run) => (
          <Card key={run.id}>
            <CardHeader className="p-4 cursor-pointer" onClick={() => setExpandedRun(expandedRun === run.id ? null : run.id)}>
              <div className="flex items-center gap-4">
                <RunStatusBadge status={run.status} />
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {new Date(run.startedAt).toLocaleString()}
                    </span>
                    {run.durationMs && (
                      <span className="text-xs text-muted-foreground">
                        ({run.durationMs}ms)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(run.startedAt), { addSuffix: true })}
                  </p>
                </div>

                {run.SyntheticStepResult && run.SyntheticStepResult.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {run.SyntheticStepResult.filter((s) => s.status === 'SUCCESS').length}/
                      {run.SyntheticStepResult.length} steps
                    </span>
                  </div>
                )}

                <Button variant="ghost" size="sm">
                  {expandedRun === run.id ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>

            {expandedRun === run.id && (
              <CardContent className="p-4 pt-0">
                {run.errorMessage && (
                  <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Error</p>
                        <p className="text-sm text-muted-foreground">{run.errorMessage}</p>
                      </div>
                    </div>
                  </div>
                )}

                {run.SyntheticStepResult && run.SyntheticStepResult.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Step Results</h4>
                    
                    {run.SyntheticStepResult
                      .sort((a, b) => a.SyntheticStep.order - b.SyntheticStep.order)
                      .map((stepResult) => (
                        <div
                          key={stepResult.id}
                          className="flex items-center gap-3 p-3 rounded-md border"
                        >
                          <StepStatusIcon status={stepResult.status} />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">
                                {stepResult.SyntheticStep.order + 1}. {stepResult.SyntheticStep.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({stepResult.SyntheticStep.type})
                              </span>
                            </div>
                            {stepResult.durationMs && (
                              <p className="text-xs text-muted-foreground">
                                {stepResult.durationMs}ms
                              </p>
                            )}
                            {stepResult.errorMessage && (
                              <p className="text-xs text-destructive mt-1">
                                {stepResult.errorMessage}
                              </p>
                            )}
                          </div>

                          {stepResult.screenshot && (
                            <Button variant="outline" size="sm" asChild>
                              <a href={stepResult.screenshot} target="_blank" rel="noopener noreferrer">
                                <Eye className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {run.screenshots && Object.keys(run.screenshots).length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Screenshots</h4>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(run.screenshots).map(([key, url]) => (
                        <Button key={key} variant="outline" size="sm" asChild>
                          <a href={url as string} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4 mr-2" />
                            {key}
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function RunStatusBadge({ status }: { status: SyntheticRun['status'] }) {
  const config = {
    RUNNING: { label: 'Running', variant: 'default' as const, icon: Clock, className: '' },
    SUCCESS: { label: 'Success', variant: 'default' as const, icon: CheckCircle, className: 'bg-green-500 text-white' },
    FAILED: { label: 'Failed', variant: 'destructive' as const, icon: XCircle, className: '' },
    TIMEOUT: { label: 'Timeout', variant: 'destructive' as const, icon: Clock, className: '' },
    CANCELLED: { label: 'Cancelled', variant: 'outline' as const, icon: XCircle, className: '' },
  };

  const { label, variant, icon: Icon, className } = config[status];

  return (
    <Badge variant={variant} className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

function StepStatusIcon({ status }: { status: SyntheticStepResult['status'] }) {
  const config = {
    PENDING: { icon: Clock, className: 'text-muted-foreground' },
    RUNNING: { icon: Clock, className: 'text-blue-500' },
    SUCCESS: { icon: CheckCircle, className: 'text-green-500' },
    FAILED: { icon: XCircle, className: 'text-destructive' },
    SKIPPED: { icon: AlertCircle, className: 'text-yellow-500' },
  };

  const { icon: Icon, className } = config[status];

  return <Icon className={`h-5 w-5 ${className}`} />;
}

