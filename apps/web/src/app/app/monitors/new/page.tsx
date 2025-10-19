"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
  SaturnInput,
  SaturnLabel,
  SaturnSelect,
  SaturnTabs,
  PageHeader,
} from '@/components/saturn';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { PageHeaderWithBreadcrumbs } from '@/components/page-header-with-breadcrumbs';

export default function NewMonitorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [createdMonitor, setCreatedMonitor] = useState<any>(null);
  const [userPlan, setUserPlan] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    scheduleType: 'INTERVAL' as 'INTERVAL' | 'CRON',
    intervalSec: 3600,
    cronExpr: '0 3 * * *',
    timezone: 'UTC',
    graceSec: 300,
  });

  // Fetch user's plan to show appropriate restrictions
  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/org');
        const { org } = await response.json();
        if (org?.SubscriptionPlan) {
          setUserPlan(org.SubscriptionPlan);
          // Set default interval to plan minimum if current is below
          if (org.SubscriptionPlan.minIntervalSec && formData.intervalSec < org.SubscriptionPlan.minIntervalSec) {
            setFormData(prev => ({ ...prev, intervalSec: org.SubscriptionPlan.minIntervalSec }));
          }
        }
      } catch (error) {
        console.error('Failed to fetch user plan:', error);
      }
    };
    fetchUserPlan();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orgsResponse = await fetch('/api/org');
      const { org } = await orgsResponse.json();

      const response = await fetch('/api/monitors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          orgId: org?.id || 'cmgnwj2kd0001ns6jnw8h5cxe',
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
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center py-8">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-normal text-[#37322F] font-serif mb-2">Monitor Created!</h1>
          <p className="text-[rgba(55,50,47,0.80)] font-sans">Your monitor is now active and ready to receive pings</p>
        </div>

        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h2">{createdMonitor.name}</SaturnCardTitle>
            <SaturnCardDescription>Use this token to start monitoring your job</SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-6">
              <div>
                <SaturnLabel>Monitor Token</SaturnLabel>
                <div className="flex items-center gap-2 mt-2">
                  <code className="flex-1 bg-gray-100 px-4 py-2 rounded-lg font-mono text-sm text-[#37322F] border border-[rgba(55,50,47,0.12)]">
                    {createdMonitor.token}
                  </code>
                  <SaturnButton
                    variant="secondary"
                    size="sm"
                    onClick={() => copyToClipboard(createdMonitor.token)}
                  >
                    <Copy className="w-4 h-4" />
                  </SaturnButton>
                </div>
              </div>

              <SaturnTabs
                tabs={[
                  {
                    id: 'bash',
                    label: 'Bash',
                    content: (
                      <div className="space-y-4">
                        <div>
                          <SaturnLabel className="text-xs text-[rgba(55,50,47,0.60)]">Simple heartbeat (add to your cron job)</SaturnLabel>
                          <div className="relative mt-2">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`curl ${pingUrl}`}
                            </pre>
                            <button
                              onClick={() => copyToClipboard(`curl ${pingUrl}`)}
                              className="absolute top-2 right-2 p-1 hover:bg-gray-800 rounded transition-colors"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <SaturnLabel className="text-xs text-[rgba(55,50,47,0.60)]">With start/finish tracking</SaturnLabel>
                          <div className="relative mt-2">
                            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm whitespace-pre">
{`TOKEN="${createdMonitor.token}"
curl "${pingUrl}?state=start"

# Your job here
your_job_command

# Send success
curl "${pingUrl}?state=success&exitCode=0"`}
                            </pre>
                            <button
                              onClick={() => copyToClipboard(`TOKEN="${createdMonitor.token}"\ncurl "${pingUrl}?state=start"\n\n# Your job here\nyour_job_command\n\n# Send success\ncurl "${pingUrl}?state=success&exitCode=0"`)}
                              className="absolute top-2 right-2 p-1 hover:bg-gray-800 rounded transition-colors"
                            >
                              <Copy className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'python',
                    label: 'Python',
                    content: (
                      <div>
                        <SaturnLabel className="text-xs text-[rgba(55,50,47,0.60)]">Python wrapper</SaturnLabel>
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
                          <button
                            onClick={() => copyToClipboard(`import requests, subprocess, sys\n\nTOKEN = "${createdMonitor.token}"\nURL = "${pingUrl}"\n\n# Start ping\nrequests.get(f"{URL}?state=start", timeout=5)\n\n# Run your job\nresult = subprocess.run(sys.argv[1:], capture_output=True)\n\n# Finish ping\nstate = "success" if result.returncode == 0 else "fail"\nrequests.get(f"{URL}?state={state}&exitCode={result.returncode}", timeout=5)`)}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-800 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    ),
                  },
                  {
                    id: 'cli',
                    label: 'CLI',
                    content: (
                      <div>
                        <SaturnLabel className="text-xs text-[rgba(55,50,47,0.60)]">Using Saturn CLI (recommended)</SaturnLabel>
                        <div className="relative mt-2">
                          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
{`npx saturn-monitor run --token ${createdMonitor.token} -- your-command`}
                          </pre>
                          <button
                            onClick={() => copyToClipboard(`npx saturn-monitor run --token ${createdMonitor.token} -- your-command`)}
                            className="absolute top-2 right-2 p-1 hover:bg-gray-800 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        <p className="text-xs text-[rgba(55,50,47,0.60)] mt-2 font-sans">
                          The CLI automatically sends start/success pings and captures exit codes.
                        </p>
                      </div>
                    ),
                  },
                ]}
                defaultTab="bash"
              />

              <div className="flex flex-wrap gap-3 pt-4">
                <SaturnButton onClick={() => router.push(`/app/monitors/${createdMonitor.id}`)}>
                  View Monitor
                </SaturnButton>
                <SaturnButton variant="secondary" onClick={() => router.push('/app/monitors')}>
                  All Monitors
                </SaturnButton>
                <SaturnButton variant="ghost" onClick={() => setCreatedMonitor(null)}>
                  Create Another
                </SaturnButton>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <PageHeaderWithBreadcrumbs
        title="Create Monitor"
        description="Set up monitoring for a cron job or scheduled task"
        breadcrumbs={[
          { label: 'Dashboard', href: '/app' },
          { label: 'Monitors', href: '/app/monitors' },
          { label: 'New Monitor' },
        ]}
      />

      <form onSubmit={handleSubmit}>
        <SaturnCard>
          <SaturnCardHeader>
            <SaturnCardTitle as="h2">Monitor Configuration</SaturnCardTitle>
            <SaturnCardDescription>Configure how often your job should run</SaturnCardDescription>
          </SaturnCardHeader>
          <SaturnCardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <SaturnLabel htmlFor="name" required>Monitor Name</SaturnLabel>
                <SaturnInput
                  id="name"
                  placeholder="e.g., Daily Backup Job"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  fullWidth
                />
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                  A descriptive name to identify this monitor
                </p>
              </div>

              <div className="space-y-2">
                <SaturnLabel required>Schedule Type</SaturnLabel>
                <SaturnSelect
                  value={formData.scheduleType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, scheduleType: value as 'INTERVAL' | 'CRON' })
                  }
                  options={[
                    { value: 'INTERVAL', label: 'Interval (every X seconds/minutes/hours)' },
                    { value: 'CRON', label: 'Cron Expression (advanced)' },
                  ]}
                  fullWidth
                />
              </div>

              {formData.scheduleType === 'INTERVAL' ? (
                <div className="space-y-2">
                  <SaturnLabel htmlFor="interval" required>Interval (seconds)</SaturnLabel>
                  <SaturnInput
                    id="interval"
                    type="number"
                    min={userPlan?.minIntervalSec || 60}
                    value={formData.intervalSec}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      const minInterval = userPlan?.minIntervalSec || 60;
                      if (value >= minInterval) {
                        setFormData({ ...formData, intervalSec: value });
                      }
                    }}
                    required
                    fullWidth
                  />
                  <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                    How often the job runs
                    {userPlan?.minIntervalSec ? ` (minimum ${userPlan.minIntervalSec} seconds for ${userPlan.plan} plan)` : ' (minimum 60 seconds)'}
                    {formData.intervalSec >= 3600 ? ` = ${Math.floor(formData.intervalSec / 3600)}h` :
                     formData.intervalSec >= 60 ? ` = ${Math.floor(formData.intervalSec / 60)}m` : ''}
                  </p>
                  {userPlan?.minIntervalSec && userPlan.minIntervalSec > 60 && (
                    <p className="text-xs text-amber-600 font-sans">
                      💡 Upgrade to Developer plan or higher to use intervals shorter than {userPlan.minIntervalSec} seconds
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <SaturnLabel htmlFor="cron" required>Cron Expression</SaturnLabel>
                  <SaturnInput
                    id="cron"
                    placeholder="0 3 * * *"
                    value={formData.cronExpr}
                    onChange={(e) => setFormData({ ...formData, cronExpr: e.target.value })}
                    required
                    fullWidth
                  />
                  <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                    Example: &quot;0 3 * * *&quot; runs daily at 3:00 AM
                  </p>
                </div>
              )}

              {formData.scheduleType === 'CRON' && (
                <div className="space-y-2">
                  <SaturnLabel htmlFor="timezone">Timezone</SaturnLabel>
                  <SaturnSelect
                    value={formData.timezone}
                    onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                    options={[
                      { value: 'UTC', label: 'UTC' },
                      { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
                      { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
                      { value: 'America/Denver', label: 'America/Denver (MST/MDT)' },
                      { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
                      { value: 'America/Toronto', label: 'America/Toronto (EST/EDT)' },
                      { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
                      { value: 'Europe/Paris', label: 'Europe/Paris (CET/CEST)' },
                      { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
                      { value: 'Australia/Sydney', label: 'Australia/Sydney (AEDT/AEST)' },
                    ]}
                    fullWidth
                  />
                </div>
              )}

              <div className="space-y-2">
                <SaturnLabel htmlFor="grace">Grace Period (seconds)</SaturnLabel>
                <SaturnInput
                  id="grace"
                  type="number"
                  min="0"
                  value={formData.graceSec}
                  onChange={(e) => setFormData({ ...formData, graceSec: parseInt(e.target.value) })}
                  fullWidth
                />
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                  How long to wait before marking a job as missed (default: 300s = 5 minutes)
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <SaturnButton type="submit" disabled={loading || !formData.name} loading={loading}>
                  Create Monitor
                </SaturnButton>
                <SaturnButton
                  type="button"
                  variant="secondary"
                  onClick={() => router.push('/app/monitors')}
                >
                  Cancel
                </SaturnButton>
              </div>
            </div>
          </SaturnCardContent>
        </SaturnCard>
      </form>
    </div>
  );
}
