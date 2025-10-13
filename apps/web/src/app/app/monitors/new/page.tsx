"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function NewMonitorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [createdMonitor, setCreatedMonitor] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    scheduleType: 'INTERVAL' as 'INTERVAL' | 'CRON',
    intervalSec: 3600,
    cronExpr: '0 3 * * *',
    timezone: 'UTC',
    graceSec: 300,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, we'll get the orgId from the first org
      // In a real app, this would come from session/context
      const orgsResponse = await fetch('/api/org');
      const { org } = await orgsResponse.json();

      const response = await fetch('/api/monitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          orgId: org?.id || 'cmgnwj2kd0001ns6jnw8h5cxe', // Fallback to seed org ID
          intervalSec: formData.scheduleType === 'INTERVAL' ? formData.intervalSec : undefined,
          cronExpr: formData.scheduleType === 'CRON' ? formData.cronExpr : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create monitor');
      }

      const { monitor } = await response.json();
      setCreatedMonitor(monitor);
      
      toast({
        title: 'Monitor created!',
        description: `${monitor.name} is now monitoring your job.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'Code copied to clipboard',
    });
  };

  if (createdMonitor) {
    const pingUrl = `${window.location.origin}/api/ping/${createdMonitor.token}`;
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center py-6">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">Monitor Created!</h1>
          <p className="text-gray-600">Your monitor is now active and ready to receive pings</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{createdMonitor.name}</CardTitle>
            <CardDescription>Use this token to start monitoring your job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Monitor Token</Label>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 bg-gray-100 px-4 py-2 rounded font-mono text-sm">
                  {createdMonitor.token}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(createdMonitor.token)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <Tabs defaultValue="bash">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="bash">Bash</TabsTrigger>
                <TabsTrigger value="python">Python</TabsTrigger>
                <TabsTrigger value="cli">CLI</TabsTrigger>
              </TabsList>

              <TabsContent value="bash" className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600">Simple heartbeat (add to your cron job)</Label>
                  <div className="relative mt-2">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`curl ${pingUrl}`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`curl ${pingUrl}`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs text-gray-600">With start/finish tracking</Label>
                  <div className="relative mt-2">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre">
{`TOKEN="${createdMonitor.token}"
curl "${pingUrl}?state=start"

# Your job here
your_job_command

# Send success
curl "${pingUrl}?state=success&exitCode=0"`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`TOKEN="${createdMonitor.token}"\ncurl "${pingUrl}?state=start"\n\n# Your job here\nyour_job_command\n\n# Send success\ncurl "${pingUrl}?state=success&exitCode=0"`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="python" className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600">Python wrapper</Label>
                  <div className="relative mt-2">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre">
{`import requests, subprocess, sys

TOKEN = "${createdMonitor.token}"
URL = "${pingUrl}"

# Start ping
requests.get(f"{URL}?state=start", timeout=5)

# Run your job
result = subprocess.run(sys.argv[1:], capture_output=True)

# Finish ping
state = "success" if result.returncode == 0 else "fail"
requests.get(f"{URL}?state={state}&exitCode={result.returncode}", timeout=5)`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`import requests, subprocess, sys\n\nTOKEN = "${createdMonitor.token}"\nURL = "${pingUrl}"\n\n# Start ping\nrequests.get(f"{URL}?state=start", timeout=5)\n\n# Run your job\nresult = subprocess.run(sys.argv[1:], capture_output=True)\n\n# Finish ping\nstate = "success" if result.returncode == 0 else "fail"\nrequests.get(f"{URL}?state={state}&exitCode={result.returncode}", timeout=5)`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="cli" className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-600">Using PulseGuard CLI (recommended)</Label>
                  <div className="relative mt-2">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`npx tsx packages/cli/src/index.ts run --token ${createdMonitor.token} -- your-command`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(`npx tsx packages/cli/src/index.ts run --token ${createdMonitor.token} -- your-command`)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    The CLI automatically sends start/success pings and captures exit codes.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex gap-3 pt-4">
              <Button onClick={() => router.push(`/app/monitors/${createdMonitor.id}`)}>
                View Monitor
              </Button>
              <Button variant="outline" onClick={() => router.push('/app/monitors')}>
                All Monitors
              </Button>
              <Button variant="ghost" onClick={() => setCreatedMonitor(null)}>
                Create Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create Monitor</h1>
        <p className="text-gray-600">Set up monitoring for a cron job or scheduled task</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Monitor Configuration</CardTitle>
            <CardDescription>Configure how often your job should run</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Monitor Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Daily Backup Job"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500">
                A descriptive name to identify this monitor
              </p>
            </div>

            <div className="space-y-2">
              <Label>Schedule Type *</Label>
              <Select
                value={formData.scheduleType}
                onValueChange={(value) =>
                  setFormData({ ...formData, scheduleType: value as 'INTERVAL' | 'CRON' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERVAL">Interval (every X seconds/minutes/hours)</SelectItem>
                  <SelectItem value="CRON">Cron Expression (advanced)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.scheduleType === 'INTERVAL' ? (
              <div className="space-y-2">
                <Label htmlFor="interval">Interval (seconds) *</Label>
                <Input
                  id="interval"
                  type="number"
                  min="60"
                  value={formData.intervalSec}
                  onChange={(e) =>
                    setFormData({ ...formData, intervalSec: parseInt(e.target.value) })
                  }
                  required
                />
                <p className="text-xs text-gray-500">
                  How often the job runs (minimum 60 seconds)
                  {formData.intervalSec >= 3600 ? ` = ${Math.floor(formData.intervalSec / 3600)}h` :
                   formData.intervalSec >= 60 ? ` = ${Math.floor(formData.intervalSec / 60)}m` : ''}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="cron">Cron Expression *</Label>
                <Input
                  id="cron"
                  placeholder="0 3 * * *"
                  value={formData.cronExpr}
                  onChange={(e) => setFormData({ ...formData, cronExpr: e.target.value })}
                  required
                />
                <p className="text-xs text-gray-500">
                  Example: &quot;0 3 * * *&quot; runs daily at 3:00 AM
                </p>
              </div>
            )}

            {formData.scheduleType === 'CRON' && (
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                    <SelectItem value="America/Chicago">America/Chicago (CST/CDT)</SelectItem>
                    <SelectItem value="America/Denver">America/Denver (MST/MDT)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</SelectItem>
                    <SelectItem value="America/Toronto">America/Toronto (EST/EDT)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                    <SelectItem value="Europe/Paris">Europe/Paris (CET/CEST)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Australia/Sydney (AEDT/AEST)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="grace">Grace Period (seconds)</Label>
              <Input
                id="grace"
                type="number"
                min="0"
                value={formData.graceSec}
                onChange={(e) => setFormData({ ...formData, graceSec: parseInt(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                How long to wait before marking a job as missed (default: 300s = 5 minutes)
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || !formData.name}>
                {loading ? 'Creating...' : 'Create Monitor'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/app/monitors')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

