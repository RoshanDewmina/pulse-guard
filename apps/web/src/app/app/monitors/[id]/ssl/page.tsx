'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SslDetailsCard, type SslCertificate } from '@/components/monitors/ssl-details-card';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';
import { ArrowLeft, Shield, Save, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Monitor {
  id: string;
  name: string;
  url: string;
  checkSsl: boolean;
  sslAlertThresholds: number[];
}

export default function MonitorSslPage() {
  const params = useParams();
  const router = useRouter();
  const monitorId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [certificate, setCertificate] = useState<SslCertificate | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [thresholds, setThresholds] = useState<string[]>(['30', '14', '7']);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchData();
  }, [monitorId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch monitor details
      const monitorRes = await fetch(`/api/monitors/${monitorId}`);
      if (!monitorRes.ok) throw new Error('Failed to fetch monitor');
      const monitorData = await monitorRes.json();
      setMonitor(monitorData);
      setEnabled(monitorData.checkSsl);
      setThresholds(monitorData.sslAlertThresholds.map(String));

      // Fetch SSL certificate if enabled
      if (monitorData.checkSsl) {
        const sslRes = await fetch(`/api/monitors/${monitorId}/ssl`);
        if (sslRes.ok) {
          const sslData = await sslRes.json();
          setCertificate(sslData.certificate);
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load SSL monitoring settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/monitors/${monitorId}/ssl`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkSsl: enabled,
          sslAlertThresholds: thresholds.map(Number).filter((n) => !isNaN(n) && n > 0),
        }),
      });

      if (!res.ok) throw new Error('Failed to update settings');

      toast.success('SSL monitoring settings saved');
      setHasChanges(false);
      await fetchData();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleManualCheck = async () => {
    try {
      const res = await fetch(`/api/monitors/${monitorId}/ssl/check`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Failed to trigger SSL check');

      toast.success('SSL check started. Results will appear shortly.');
      
      // Refresh data after a short delay
      setTimeout(() => fetchData(), 3000);
    } catch (error) {
      console.error('Error triggering SSL check:', error);
      toast.error('Failed to trigger SSL check');
    }
  };

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    setHasChanges(true);
  };

  const handleThresholdChange = (index: number, value: string) => {
    const newThresholds = [...thresholds];
    newThresholds[index] = value;
    setThresholds(newThresholds);
    setHasChanges(true);
  };

  const addThreshold = () => {
    setThresholds([...thresholds, '']);
    setHasChanges(true);
  };

  const removeThreshold = (index: number) => {
    setThresholds(thresholds.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeaderWithBreadcrumbs
          title="SSL Monitoring"
          description="Loading..."
          breadcrumbs={[
            { label: 'Monitors', href: '/app/monitors' },
            { label: 'Loading...' },
            { label: 'SSL' },
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
          title="SSL Monitoring"
          description="Monitor not found"
          breadcrumbs={[
            { label: 'Monitors', href: '/app/monitors' },
            { label: 'SSL' },
          ]}
        />
        <Card>
          <CardContent className="flex items-center justify-center p-12">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Monitor not found</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => router.push('/app/monitors')}
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
        title="SSL Monitoring"
        description={`Configure SSL certificate monitoring for ${monitor.name}`}
        breadcrumbs={[
          { label: 'Monitors', href: '/app/monitors' },
          { label: monitor.name, href: `/app/monitors/${monitorId}` },
          { label: 'SSL' },
        ]}
      />

      <div className="grid gap-6">
        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>SSL Certificate Monitoring</CardTitle>
              </div>
              {enabled && (
                <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                  Enabled
                </Badge>
              )}
            </div>
            <CardDescription>
              Monitor SSL certificate expiration and validity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-0.5">
                <Label htmlFor="ssl-enabled" className="text-base font-medium">
                  Enable SSL Monitoring
                </Label>
                <p className="text-sm text-muted-foreground">
                  Automatically check SSL certificate status
                </p>
              </div>
              <Switch
                id="ssl-enabled"
                checked={enabled}
                onCheckedChange={handleEnabledChange}
              />
            </div>

            {/* Alert Thresholds */}
            {enabled && (
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Alert Thresholds (days)</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Receive alerts when certificate expires in X days
                  </p>
                </div>
                <div className="space-y-2">
                  {thresholds.map((threshold, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="e.g., 30"
                        value={threshold}
                        onChange={(e) => handleThresholdChange(index, e.target.value)}
                        className="max-w-[200px]"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeThreshold(index)}
                        disabled={thresholds.length === 1}
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addThreshold}
                  >
                    + Add Threshold
                  </Button>
                </div>
              </div>
            )}

            {/* Save Button */}
            {hasChanges && (
              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSave} disabled={saving}>
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
                <Button
                  variant="outline"
                  onClick={() => {
                    setEnabled(monitor.checkSsl);
                    setThresholds(monitor.sslAlertThresholds.map(String));
                    setHasChanges(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SSL Certificate Details */}
        {enabled && (
          <SslDetailsCard
            monitorId={monitorId}
            certificate={certificate}
            onRefresh={handleManualCheck}
          />
        )}

        {!enabled && (
          <Card>
            <CardContent className="flex items-center justify-center p-12">
              <div className="text-center max-w-md">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">SSL Monitoring Disabled</h3>
                <p className="text-sm text-muted-foreground">
                  Enable SSL monitoring above to start tracking certificate expiration and validity
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

