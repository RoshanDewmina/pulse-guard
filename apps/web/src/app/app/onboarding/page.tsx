'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { CheckCircle2, Copy, Check, Loader2 } from 'lucide-react';
import { SnippetGallery } from '@/components/snippet-gallery';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testingPing, setTestingPing] = useState(false);
  const [pingReceived, setPingReceived] = useState(false);
  
  // Monitor data
  const [monitorName, setMonitorName] = useState('');
  const [scheduleType, setScheduleType] = useState<'INTERVAL' | 'CRON'>('INTERVAL');
  const [intervalSec, setIntervalSec] = useState('3600');
  const [cronExpr, setCronExpr] = useState('0 * * * *');
  const [monitorToken, setMonitorToken] = useState('');
  const [monitorId, setMonitorId] = useState('');
  
  // Alert channel data
  const [emailAddress, setEmailAddress] = useState('');

  const totalSteps = 4;

  const handleCreateMonitor = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: monitorName,
          scheduleType,
          intervalSec: scheduleType === 'INTERVAL' ? parseInt(intervalSec) : null,
          cronExpr: scheduleType === 'CRON' ? cronExpr : null,
          timezone: 'UTC',
          graceSec: 300,
        }),
      });

      if (!response.ok) throw new Error('Failed to create monitor');

      const data = await response.json();
      setMonitorToken(data.token);
      setMonitorId(data.id);
      setStep(2);
    } catch (error) {
      console.error('Error creating monitor:', error);
      alert('Failed to create monitor. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPing = async () => {
    setTestingPing(true);
    try {
      const response = await fetch(`/api/ping/${monitorToken}?state=success`);
      if (response.ok) {
        setPingReceived(true);
        setTimeout(() => setStep(3), 1500);
      }
    } catch (error) {
      console.error('Error testing ping:', error);
    } finally {
      setTestingPing(false);
    }
  };

  const handleSetupAlerts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/channels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'EMAIL',
          label: 'Default Email',
          configJson: { email: emailAddress },
          isDefault: true,
        }),
      });

      if (!response.ok) throw new Error('Failed to setup alerts');

      setStep(4);
    } catch (error) {
      console.error('Error setting up alerts:', error);
      alert('Failed to setup alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    router.push(`/app/monitors/${monitorId}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  s < step
                    ? 'bg-green-500 text-white'
                    : s === step
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s < step ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
              {s < totalSteps && (
                <div
                  className={`w-16 h-1 mx-2 transition-colors ${
                    s < step ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Create Monitor</span>
          <span>Test Ping</span>
          <span>Setup Alerts</span>
          <span>Complete</span>
        </div>
      </div>

      {/* Step 1: Create Monitor */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Create Your First Monitor</CardTitle>
            <CardDescription>
              Let's set up monitoring for your first job or cron task
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Monitor Name</Label>
              <Input
                id="name"
                placeholder="e.g., Database Backup, API Health Check"
                value={monitorName}
                onChange={(e) => setMonitorName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="scheduleType">Schedule Type</Label>
              <Select value={scheduleType} onValueChange={(v: any) => setScheduleType(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERVAL">Interval (every X minutes/hours)</SelectItem>
                  <SelectItem value="CRON">Cron Expression</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {scheduleType === 'INTERVAL' ? (
              <div>
                <Label htmlFor="interval">Interval (seconds)</Label>
                <Select value={intervalSec} onValueChange={setIntervalSec}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">5 minutes</SelectItem>
                    <SelectItem value="900">15 minutes</SelectItem>
                    <SelectItem value="1800">30 minutes</SelectItem>
                    <SelectItem value="3600">1 hour</SelectItem>
                    <SelectItem value="21600">6 hours</SelectItem>
                    <SelectItem value="43200">12 hours</SelectItem>
                    <SelectItem value="86400">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div>
                <Label htmlFor="cron">Cron Expression</Label>
                <Input
                  id="cron"
                  placeholder="0 * * * *"
                  value={cronExpr}
                  onChange={(e) => setCronExpr(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Example: "0 2 * * *" runs daily at 2 AM
                </p>
              </div>
            )}

            <Button
              onClick={handleCreateMonitor}
              disabled={!monitorName || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Monitor'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Test Ping */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Your Integration</CardTitle>
            <CardDescription>
              Send a test ping to verify everything is working
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900">
                ✅ Monitor created successfully!
              </p>
              <p className="text-xs text-green-700 mt-1">
                Token: <span className="font-mono">{monitorToken}</span>
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Quick Test</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Click the button below to send a test ping and verify your monitor is receiving data:
              </p>
              <Button
                onClick={handleTestPing}
                disabled={testingPing || pingReceived}
                className="w-full"
              >
                {testingPing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : pingReceived ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Ping Received!
                  </>
                ) : (
                  'Send Test Ping'
                )}
              </Button>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Integration Code</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Add this code to your application or cron job:
              </p>
              <SnippetGallery monitorToken={monitorToken} />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1">
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Setup Alerts */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Alert Channel</CardTitle>
            <CardDescription>
              Get notified when something goes wrong
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pingReceived && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-green-900">
                  ✅ Test ping received successfully!
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Your monitor is now tracking runs
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You'll receive alerts when monitors fail, miss runs, or experience anomalies
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                💡 <strong>Pro Tip:</strong> You can add more channels (Slack, Discord, Webhook) later in Settings
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={handleSetupAlerts}
                disabled={!emailAddress || loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Setup Alerts'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Complete */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>🎉 You're All Set!</CardTitle>
            <CardDescription>
              Your monitor is now active and ready to track runs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-green-900 mb-2">
                Onboarding Complete!
              </h3>
              <p className="text-sm text-green-700">
                Your monitor <strong>{monitorName}</strong> is now monitoring your job
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Next Steps:</h4>
              <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
                <li>View your monitor dashboard to see run history</li>
                <li>Configure advanced settings (grace period, output capture)</li>
                <li>Add more alert channels (Slack, Discord, PagerDuty)</li>
                <li>Set up dependencies if you have related monitors</li>
                <li>Create more monitors for other jobs</li>
              </ul>
            </div>

            <Button onClick={handleComplete} className="w-full" size="lg">
              View Monitor Dashboard
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

