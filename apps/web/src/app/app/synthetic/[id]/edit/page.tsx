'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { StepBuilder } from '@/components/synthetic/step-builder';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Step {
  type: string;
  selector?: string;
  value?: string;
  waitTime?: number;
  assertionType?: string;
  expectedValue?: string;
  script?: string;
}

interface SyntheticMonitor {
  id: string;
  name: string;
  url: string;
  description?: string;
  isEnabled: boolean;
  intervalMinutes: number;
  timeout: number;
  SyntheticStep: Array<{
    id: string;
    order: number;
    type: string;
    selector?: string;
    value?: string;
    waitTime?: number;
    assertionType?: string;
    expectedValue?: string;
    script?: string;
  }>;
}

export default function EditSyntheticMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const monitorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    isEnabled: true,
    intervalMinutes: 5,
    timeout: 30000,
  });
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    fetchMonitor();
  }, [monitorId]);

  const fetchMonitor = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/synthetic/${monitorId}`);
      if (!res.ok) throw new Error('Failed to fetch monitor');
      
      const data = await res.json();
      const monitor: SyntheticMonitor = data.monitor;
      
      setFormData({
        name: monitor.name,
        url: monitor.url,
        description: monitor.description || '',
        isEnabled: monitor.isEnabled,
        intervalMinutes: monitor.intervalMinutes,
        timeout: monitor.timeout,
      });

      setSteps(
        monitor.SyntheticStep
          .sort((a, b) => a.order - b.order)
          .map((step) => ({
            type: step.type,
            selector: step.selector,
            value: step.value,
            waitTime: step.waitTime,
            assertionType: step.assertionType,
            expectedValue: step.expectedValue,
            script: step.script,
          }))
      );
    } catch (error) {
      console.error('Error fetching monitor:', error);
      toast.error('Failed to load monitor');
      router.push('/app/synthetic');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.url) {
      toast.error('Name and URL are required');
      return;
    }

    if (steps.length === 0) {
      toast.error('At least one step is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/synthetic/${monitorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          steps: steps.map((step, index) => ({
            ...step,
            order: index,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update monitor');
      }

      toast.success('Synthetic monitor updated');
      router.push(`/app/synthetic/${monitorId}`);
    } catch (error: any) {
      console.error('Error updating monitor:', error);
      toast.error(error.message || 'Failed to update monitor');
    } finally {
      setSaving(false);
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
            { label: 'Edit' },
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
        title={`Edit ${formData.name}`}
        description="Update your synthetic monitor configuration"
        breadcrumbs={[
          { label: 'Synthetic Monitors', href: '/app/synthetic' },
          { label: formData.name, href: `/app/synthetic/${monitorId}` },
          { label: 'Edit' },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the basic details of your synthetic monitor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Monitor Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Login Flow Test"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Starting URL *</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this monitor tests..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="interval">Check Interval (minutes)</Label>
                <Input
                  id="interval"
                  type="number"
                  min="1"
                  max="1440"
                  value={formData.intervalMinutes}
                  onChange={(e) =>
                    setFormData({ ...formData, intervalMinutes: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (milliseconds)</Label>
                <Input
                  id="timeout"
                  type="number"
                  min="5000"
                  max="120000"
                  step="1000"
                  value={formData.timeout}
                  onChange={(e) =>
                    setFormData({ ...formData, timeout: parseInt(e.target.value) })
                  }
                />
              </div>
              <div className="flex items-center justify-between pt-8">
                <Label htmlFor="enabled">Enabled</Label>
                <Switch
                  id="enabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isEnabled: checked })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps Card */}
        <Card>
          <CardHeader>
            <CardTitle>Test Steps</CardTitle>
            <CardDescription>
              Define the sequence of actions to perform in the browser
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StepBuilder steps={steps as any} onChange={setSteps} />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/app/synthetic/${monitorId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

