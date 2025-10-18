'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
  SaturnButton,
} from '@/components/saturn';
import {
  CheckCircle2,
  Circle,
  Monitor as MonitorIcon,
  Bell,
  TestTube,
  LayoutDashboard,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface OnboardingStatus {
  hasMonitor: boolean;
  hasAlertChannel: boolean;
  hasTestedAlert: boolean;
  hasStatusPage: boolean;
  monitorCount: number;
  channelCount: number;
}

export default function OnboardingChecklistPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState<OnboardingStatus>({
    hasMonitor: false,
    hasAlertChannel: false,
    hasTestedAlert: false,
    hasStatusPage: false,
    monitorCount: 0,
    channelCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [testingAlert, setTestingAlert] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      
      // Check monitors
      const monitorsRes = await fetch('/api/monitors');
      if (monitorsRes.ok) {
        const monitors = await monitorsRes.json();
        const monitorCount = monitors.length || 0;
        
        // Check alert channels
        const channelsRes = await fetch('/api/channels');
        if (channelsRes.ok) {
          const channels = await channelsRes.json();
          const channelCount = channels.length || 0;
          
          // Check status pages
          const statusPagesRes = await fetch('/api/status-pages');
          const hasStatusPage = statusPagesRes.ok && (await statusPagesRes.json()).length > 0;
          
          setStatus({
            hasMonitor: monitorCount > 0,
            hasAlertChannel: channelCount > 0,
            hasTestedAlert: false, // TODO: Track this properly
            hasStatusPage,
            monitorCount,
            channelCount,
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAlert = async () => {
    setTestingAlert(true);
    
    try {
      const response = await fetch('/api/onboarding/test-alert', {
        method: 'POST',
      });

      if (response.ok) {
        setStatus(prev => ({ ...prev, hasTestedAlert: true }));
      } else {
        alert('Failed to send test alert. Please try again.');
      }
    } catch (error) {
      console.error('Test alert error:', error);
      alert('Failed to send test alert. Please try again.');
    } finally {
      setTestingAlert(false);
    }
  };

  const handleComplete = async () => {
    try {
      await fetch('/api/onboarding/complete-checklist', {
        method: 'POST',
      });
      
      router.push('/app');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const handleSkip = () => {
    if (confirm('Are you sure you want to skip the onboarding? You can always set things up later from your dashboard.')) {
      router.push('/app');
    }
  };

  const progress = [
    status.hasMonitor,
    status.hasAlertChannel,
    status.hasTestedAlert,
  ].filter(Boolean).length;
  const totalSteps = 3; // Not counting status page as it's optional
  const progressPercent = Math.round((progress / totalSteps) * 100);
  const isComplete = progress === totalSteps;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#37322F] mx-auto mb-4"></div>
          <p className="text-[rgba(55,50,47,0.60)] font-sans">Loading your progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#37322F] mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#37322F] mb-2">
            Welcome to Saturn!
          </h1>
          <p className="text-[rgba(55,50,47,0.60)] font-sans text-lg">
            Let's get you set up in just a few minutes
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-[#37322F]">
              {progress} of {totalSteps} steps complete
            </span>
            <span className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full bg-[rgba(55,50,47,0.12)] rounded-full h-3">
            <div
              className="bg-[#37322F] h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Checklist Steps */}
        <div className="space-y-4">
          {/* Step 1: Create Monitor */}
          <SaturnCard>
            <SaturnCardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {status.hasMonitor ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[rgba(55,50,47,0.08)] flex items-center justify-center">
                      <Circle className="w-6 h-6 text-[rgba(55,50,47,0.40)]" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#37322F] mb-1">
                    Create your first monitor
                  </h3>
                  <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mb-3">
                    {status.hasMonitor
                      ? `Great! You have ${status.monitorCount} monitor${status.monitorCount > 1 ? 's' : ''} set up.`
                      : 'Set up a monitor to track your cron jobs, scheduled tasks, or services.'}
                  </p>
                  
                  {!status.hasMonitor && (
                    <SaturnButton
                      onClick={() => router.push('/app/monitors/new')}
                      className="flex items-center gap-2"
                    >
                      <MonitorIcon className="w-4 h-4" />
                      Create Monitor
                      <ArrowRight className="w-4 h-4" />
                    </SaturnButton>
                  )}
                </div>
              </div>
            </SaturnCardContent>
          </SaturnCard>

          {/* Step 2: Connect Alert Channel */}
          <SaturnCard>
            <SaturnCardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {status.hasAlertChannel ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[rgba(55,50,47,0.08)] flex items-center justify-center">
                      <Circle className="w-6 h-6 text-[rgba(55,50,47,0.40)]" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#37322F] mb-1">
                    Connect an alert channel
                  </h3>
                  <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mb-3">
                    {status.hasAlertChannel
                      ? `Perfect! You have ${status.channelCount} alert channel${status.channelCount > 1 ? 's' : ''} connected.`
                      : 'Get notified when something goes wrong via Slack, Discord, Email, SMS, or PagerDuty.'}
                  </p>
                  
                  {!status.hasAlertChannel && (
                    <SaturnButton
                      onClick={() => router.push('/app/settings/alerts')}
                      className="flex items-center gap-2"
                      disabled={!status.hasMonitor}
                    >
                      <Bell className="w-4 h-4" />
                      Add Alert Channel
                      <ArrowRight className="w-4 h-4" />
                    </SaturnButton>
                  )}
                </div>
              </div>
            </SaturnCardContent>
          </SaturnCard>

          {/* Step 3: Send Test Alert */}
          <SaturnCard>
            <SaturnCardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {status.hasTestedAlert ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[rgba(55,50,47,0.08)] flex items-center justify-center">
                      <Circle className="w-6 h-6 text-[rgba(55,50,47,0.40)]" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-[#37322F] mb-1">
                    Send a test alert
                  </h3>
                  <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mb-3">
                    {status.hasTestedAlert
                      ? 'Excellent! You successfully received a test alert.'
                      : 'Make sure everything is working by sending a test notification.'}
                  </p>
                  
                  {!status.hasTestedAlert && (
                    <SaturnButton
                      onClick={handleTestAlert}
                      className="flex items-center gap-2"
                      disabled={!status.hasAlertChannel || testingAlert}
                      loading={testingAlert}
                    >
                      <TestTube className="w-4 h-4" />
                      Send Test Alert
                    </SaturnButton>
                  )}
                </div>
              </div>
            </SaturnCardContent>
          </SaturnCard>

          {/* Optional: Create Status Page */}
          <SaturnCard>
            <SaturnCardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {status.hasStatusPage ? (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[rgba(55,50,47,0.08)] flex items-center justify-center">
                      <Circle className="w-6 h-6 text-[rgba(55,50,47,0.40)]" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-[#37322F]">
                      Create a status page
                    </h3>
                    <span className="text-xs px-2 py-0.5 bg-[rgba(55,50,47,0.08)] rounded-full text-[rgba(55,50,47,0.60)] font-sans">
                      Optional
                    </span>
                  </div>
                  <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mb-3">
                    {status.hasStatusPage
                      ? 'Awesome! Your status page is live.'
                      : 'Share your system status with customers and stakeholders.'}
                  </p>
                  
                  {!status.hasStatusPage && (
                    <SaturnButton
                      variant="secondary"
                      onClick={() => router.push('/app/status-pages')}
                      className="flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Create Status Page
                      <ArrowRight className="w-4 h-4" />
                    </SaturnButton>
                  )}
                </div>
              </div>
            </SaturnCardContent>
          </SaturnCard>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex items-center justify-between gap-4">
          <SaturnButton
            variant="secondary"
            onClick={handleSkip}
          >
            Skip for now
          </SaturnButton>

          {isComplete && (
            <SaturnButton
              onClick={handleComplete}
              className="flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </SaturnButton>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
            Need help? Check out our{' '}
            <a href="/docs" className="text-[#37322F] underline hover:no-underline">
              documentation
            </a>
            {' '}or{' '}
            <a href="/support" className="text-[#37322F] underline hover:no-underline">
              contact support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

