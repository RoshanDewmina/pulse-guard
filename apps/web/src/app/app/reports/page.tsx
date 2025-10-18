'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { Plus, Download, FileText, Loader2, BarChart3 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

interface SlaReport {
  id: string;
  name: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  startDate: Date | string;
  endDate: Date | string;
  generatedAt: Date | string;
  uptimePercentage: number;
  totalChecks: number;
  incidentCount: number;
  pdfUrl?: string;
  Monitor?: {
    id: string;
    name: string;
  };
}

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<SlaReport[]>([]);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data.reports || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const getPeriodBadge = (period: string) => {
    const colors: Record<string, string> = {
      DAILY: 'bg-blue-500',
      WEEKLY: 'bg-green-500',
      MONTHLY: 'bg-purple-500',
      QUARTERLY: 'bg-orange-500',
      YEARLY: 'bg-red-500',
      CUSTOM: 'bg-gray-500',
    };

    return (
      <Badge className={`${colors[period] || 'bg-gray-500'} hover:${colors[period]}`}>
        {period.toLowerCase()}
      </Badge>
    );
  };

  const getUptimeBadge = (uptime: number) => {
    if (uptime >= 99.9) {
      return <Badge className="bg-green-500 hover:bg-green-600">{uptime.toFixed(2)}%</Badge>;
    } else if (uptime >= 99) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">{uptime.toFixed(2)}%</Badge>;
    } else {
      return <Badge className="bg-red-500 hover:bg-red-600">{uptime.toFixed(2)}%</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeaderWithBreadcrumbs
          title="SLA Reports"
          description="Loading..."
          breadcrumbs={[
            { label: 'Dashboard', href: '/app' },
            { label: 'SLA Reports' },
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
        title="SLA Reports"
        description="Generate and view service level agreement reports"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'SLA Reports' },
        ]}
        action={
          <Button onClick={() => router.push('/app/reports/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        }
      />

      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center max-w-md">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No SLA Reports</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Generate your first SLA report to track uptime, MTTR, and service metrics
              </p>
              <Button onClick={() => router.push('/app/reports/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="truncate">{report.name}</CardTitle>
                      {getPeriodBadge(report.period)}
                    </div>
                    <CardDescription>
                      {format(new Date(report.startDate), 'MMM d, yyyy')} -{' '}
                      {format(new Date(report.endDate), 'MMM d, yyyy')}
                      {report.Monitor && (
                        <> • Monitor: {report.Monitor.name}</>
                      )}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Uptime</p>
                      <div className="mt-1">
                        {getUptimeBadge(report.uptimePercentage)}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Checks</p>
                      <p className="text-lg font-semibold mt-1">{report.totalChecks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Incidents</p>
                      <p className="text-lg font-semibold mt-1">{report.incidentCount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Generated</p>
                      <p className="text-sm mt-1">
                        {formatDistanceToNow(new Date(report.generatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/app/reports/${report.id}`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    {report.pdfUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(report.pdfUrl, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
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

