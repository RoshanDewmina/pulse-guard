'use client';

import { CheckCircle2, XCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Monitor {
  id: string;
  name: string;
  status: 'OK' | 'LATE' | 'MISSED' | 'FAILING' | 'DISABLED';
  tags: string[];
}

interface Dependency {
  id: string;
  dependsOn: Monitor;
}

interface DependencyDAGProps {
  monitor: Monitor;
  dependencies: Dependency[]; // Upstream: monitors this one depends on
  dependents: Array<{ id: string; monitor: Monitor }>; // Downstream: monitors that depend on this one
}

const statusConfig = {
  OK: {
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Healthy',
  },
  LATE: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Late',
  },
  MISSED: {
    icon: AlertCircle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    label: 'Missed',
  },
  FAILING: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Failing',
  },
  DISABLED: {
    icon: XCircle,
    color: 'text-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    label: 'Disabled',
  },
};

function MonitorNode({ monitor, isCurrent = false }: { monitor: Monitor; isCurrent?: boolean }) {
  const config = statusConfig[monitor.status];
  const Icon = config.icon;

  return (
    <Link
      href={`/app/monitors/${monitor.id}`}
      className={`block p-4 rounded-lg border-2 transition-all hover:shadow-md ${
        isCurrent
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : `${config.borderColor} ${config.bgColor}`
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${config.color}`} />
            <h4 className="font-medium text-sm">{monitor.name}</h4>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {monitor.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <Badge variant={monitor.status === 'OK' ? 'default' : 'destructive'} className="text-xs">
          {config.label}
        </Badge>
      </div>
    </Link>
  );
}

export function DependencyDAG({ monitor, dependencies, dependents }: DependencyDAGProps) {
  const hasUpstream = dependencies.length > 0;
  const hasDownstream = dependents.length > 0;

  if (!hasUpstream && !hasDownstream) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dependencies</CardTitle>
          <CardDescription>
            This monitor has no dependencies configured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You can add dependencies to track relationships between monitors and handle cascade failures intelligently.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dependency Graph</CardTitle>
        <CardDescription>
          {hasUpstream && `Depends on ${dependencies.length} monitor${dependencies.length > 1 ? 's' : ''}`}
          {hasUpstream && hasDownstream && ' • '}
          {hasDownstream && `${dependents.length} monitor${dependents.length > 1 ? 's' : ''} depend${dependents.length === 1 ? 's' : ''} on this`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Upstream dependencies */}
          {hasUpstream && (
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                Depends On (Upstream)
              </h4>
              <div className="space-y-3">
                {dependencies.map((dep) => (
                  <div key={dep.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <MonitorNode monitor={dep.dependsOn} />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <MonitorNode monitor={monitor} isCurrent />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                If upstream monitors fail, this monitor's missed alerts will be suppressed
              </p>
            </div>
          )}

          {/* Downstream dependents */}
          {hasDownstream && (
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">
                Depended On By (Downstream)
              </h4>
              <div className="space-y-3">
                {dependents.map((dep) => (
                  <div key={dep.id} className="flex items-center gap-3">
                    <div className="flex-1">
                      <MonitorNode monitor={monitor} isCurrent />
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <MonitorNode monitor={dep.monitor} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                If this monitor fails, downstream monitors will show cascade suppression
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

