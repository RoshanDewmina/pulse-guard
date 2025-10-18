'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Monitor {
  id: string;
  name: string;
}

export default function NewReportPage() {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loadingMonitors, setLoadingMonitors] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    period: 'MONTHLY' as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM',
    monitorId: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchMonitors();
    
    // Set default dates based on period
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 1);
    
    setFormData(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate,
      name: `${prev.period} Report - ${today.toLocaleDateString()}`,
    }));
  }, []);

  const fetchMonitors = async () => {
    try {
      const res = await fetch('/api/monitors');
      if (!res.ok) throw new Error('Failed to fetch monitors');
      const data = await res.json();
      setMonitors(data.monitors || []);
    } catch (error) {
      console.error('Error fetching monitors:', error);
      toast.error('Failed to load monitors');
    } finally {
      setLoadingMonitors(false);
    }
  };

  const handlePeriodChange = (period: string) => {
    const today = new Date();
    const endDate = today.toISOString().split('T')[0];
    let startDate = new Date(today);

    switch (period) {
      case 'DAILY':
        startDate.setDate(today.getDate() - 1);
        break;
      case 'WEEKLY':
        startDate.setDate(today.getDate() - 7);
        break;
      case 'MONTHLY':
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'QUARTERLY':
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'YEARLY':
        startDate.setFullYear(today.getFullYear() - 1);
        break;
    }

    setFormData(prev => ({
      ...prev,
      period: period as any,
      startDate: startDate.toISOString().split('T')[0],
      endDate,
      name: `${period} Report - ${today.toLocaleDateString()}`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast.error('Report name is required');
      return;
    }

    if (formData.period === 'CUSTOM' && (!formData.startDate || !formData.endDate)) {
      toast.error('Start and end dates are required for custom reports');
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          period: formData.period,
          monitorId: formData.monitorId || undefined,
          startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to generate report');
      }

      const data = await res.json();
      toast.success('Report generation started. This may take a few moments...');
      router.push(`/app/reports/${data.report.id}`);
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeaderWithBreadcrumbs
        title="Generate SLA Report"
        description="Create a service level agreement report"
        breadcrumbs={[
          { label: 'SLA Reports', href: '/app/reports' },
          { label: 'Generate Report' },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
            <CardDescription>
              Configure your SLA report parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Report Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Report Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Monthly Uptime Report"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            {/* Period Selection */}
            <div className="space-y-2">
              <Label htmlFor="period">Report Period *</Label>
              <Select
                value={formData.period}
                onValueChange={handlePeriodChange}
              >
                <SelectTrigger id="period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                  <SelectItem value="CUSTOM">Custom Date Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Monitor Selection */}
            <div className="space-y-2">
              <Label htmlFor="monitor">Monitor (Optional)</Label>
              <Select
                value={formData.monitorId}
                onValueChange={(value) => setFormData({ ...formData, monitorId: value })}
                disabled={loadingMonitors}
              >
                <SelectTrigger id="monitor">
                  <SelectValue placeholder={loadingMonitors ? 'Loading...' : 'All monitors'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All monitors</SelectItem>
                  {monitors.map((monitor) => (
                    <SelectItem key={monitor.id} value={monitor.id}>
                      {monitor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Leave empty to include all monitors in the report
              </p>
            </div>

            {/* Date Range (for custom period) */}
            {formData.period === 'CUSTOM' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            )}

            {/* Date Range Preview */}
            {formData.period !== 'CUSTOM' && formData.startDate && formData.endDate && (
              <div className="p-4 rounded-lg bg-muted">
                <p className="text-sm text-muted-foreground">Report will cover:</p>
                <p className="font-medium mt-1">
                  {new Date(formData.startDate).toLocaleDateString()} -{' '}
                  {new Date(formData.endDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/app/reports')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

