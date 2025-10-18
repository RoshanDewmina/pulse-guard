'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { ArrowLeft, Download, Loader2, AlertCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface SlaReport {
  id: string;
  name: string;
  period: string;
  startDate: Date | string;
  endDate: Date | string;
  generatedAt: Date | string;
  uptimePercentage: number;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  totalDowntimeMs: number;
  mttr?: number;
  mtbf?: number;
  incidentCount: number;
  averageResponseTime?: number;
  p95ResponseTime?: number;
  p99ResponseTime?: number;
  pdfUrl?: string;
  Monitor?: {
    id: string;
    name: string;
  };
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<SlaReport | null>(null);

  useEffect(() => {
    fetchReport();
  }, [reportId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${reportId}`);
      if (!res.ok) throw new Error('Failed to fetch report');
      const data = await res.json();
      setReport(data.report);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
    return `${(ms / 3600000).toFixed(1)}h`;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeaderWithBreadcrumbs
          title="Loading..."
          description="Please wait"
          breadcrumbs={[
            { label: 'SLA Reports', href: '/app/reports' },
            { label: 'Loading...' },
          ]}
        />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-8">
        <PageHeaderWithBreadcrumbs
          title="Report Not Found"
          description="The report could not be found"
          breadcrumbs={[
            { label: 'SLA Reports', href: '/app/reports' },
            { label: 'Not Found' },
          ]}
        />
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Report not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/app/reports')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
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
        title={report.name}
        description={`${report.period} report for ${format(new Date(report.startDate), 'MMM d, yyyy')} - ${format(new Date(report.endDate), 'MMM d, yyyy')}`}
        breadcrumbs={[
          { label: 'SLA Reports', href: '/app/reports' },
          { label: report.name },
        ]}
        action={
          report.pdfUrl && (
            <Button onClick={() => window.open(report.pdfUrl, '_blank')}>
              <Download className="h-4 w-4 mr-2" />
              Download HTML
            </Button>
          )
        }
      />

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.uptimePercentage.toFixed(3)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {report.successfulChecks.toLocaleString()} of {report.totalChecks.toLocaleString()} checks succeeded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Downtime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(report.totalDowntimeMs)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total service downtime
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Incidents</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.incidentCount}</div>
            <p className="text-xs text-muted-foreground">
              Total incidents during period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.averageResponseTime ? formatDuration(report.averageResponseTime) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Mean response time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reliability Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Reliability Metrics</CardTitle>
          <CardDescription>
            Mean Time To Repair (MTTR) and Mean Time Between Failures (MTBF)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">MTTR</h4>
              <p className="text-3xl font-bold">
                {report.mttr ? formatDuration(report.mttr) : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Average time to resolve incidents
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">MTBF</h4>
              <p className="text-3xl font-bold">
                {report.mtbf ? formatDuration(report.mtbf) : 'N/A'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Average time between failures
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Response Time Percentiles */}
      {(report.p95ResponseTime || report.p99ResponseTime) && (
        <Card>
          <CardHeader>
            <CardTitle>Response Time Percentiles</CardTitle>
            <CardDescription>
              Performance distribution across all checks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Average</h4>
                <p className="text-2xl font-bold">
                  {report.averageResponseTime ? formatDuration(report.averageResponseTime) : 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">P95</h4>
                <p className="text-2xl font-bold">
                  {report.p95ResponseTime ? formatDuration(report.p95ResponseTime) : 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">P99</h4>
                <p className="text-2xl font-bold">
                  {report.p99ResponseTime ? formatDuration(report.p99ResponseTime) : 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Info */}
      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Report Period</p>
              <p className="font-medium">{report.period}</p>
            </div>
            {report.Monitor && (
              <div>
                <p className="text-sm text-muted-foreground">Monitor</p>
                <p className="font-medium">{report.Monitor.name}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Generated</p>
              <p className="font-medium">
                {format(new Date(report.generatedAt), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date Range</p>
              <p className="font-medium">
                {format(new Date(report.startDate), 'MMM d, yyyy')} -{' '}
                {format(new Date(report.endDate), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

