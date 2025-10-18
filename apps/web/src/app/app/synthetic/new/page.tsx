'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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

export default function NewSyntheticMonitorPage() {
  const router = useRouter();
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
      const res = await fetch('/api/synthetic', {
        method: 'POST',
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
        throw new Error(error.error || 'Failed to create monitor');
      }

      const data = await res.json();
      toast.success('Synthetic monitor created');
      router.push(`/app/synthetic/${data.monitor.id}`);
    } catch (error: any) {
      console.error('Error creating monitor:', error);
      toast.error(error.message || 'Failed to create monitor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeaderWithBreadcrumbs
        title="Create Synthetic Monitor"
        description="Set up a new multi-step browser test"
        breadcrumbs={[
          { label: 'Synthetic Monitors', href: '/app/synthetic' },
          { label: 'New Monitor' },
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
            onClick={() => router.push('/app/synthetic')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Create Monitor
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

