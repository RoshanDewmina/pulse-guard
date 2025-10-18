'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import {
  SaturnCard,
  SaturnCardHeader,
  SaturnCardTitle,
  SaturnCardDescription,
  SaturnCardContent,
} from '@/components/saturn';
import { Shield, BarChart, Cookie } from 'lucide-react';

export default function PrivacySettingsPage() {
  const { isEnabled, setIsEnabled } = useAnalytics();
  const [hasDNT, setHasDNT] = useState(false);

  useEffect(() => {
    // Check for DNT
    if (typeof navigator !== 'undefined') {
      const dnt = navigator.doNotTrack === '1' ||
                  (window as any).doNotTrack === '1' ||
                  (navigator as any).msDoNotTrack === '1';
      setHasDNT(dnt);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#37322F]">Privacy Settings</h1>
        <p className="text-[rgba(55,50,47,0.60)] font-sans mt-1">
          Manage your privacy preferences and data collection settings
        </p>
      </div>

      {hasDNT && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                Do Not Track Enabled
              </h3>
              <p className="text-sm text-blue-800">
                Your browser has sent a "Do Not Track" signal. We respect this preference
                and will not collect analytics data.
              </p>
            </div>
          </div>
        </div>
      )}

      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex items-start gap-3">
            <BarChart className="w-6 h-6 text-[#37322F] mt-1" />
            <div>
              <SaturnCardTitle>Analytics & Tracking</SaturnCardTitle>
              <SaturnCardDescription>
                Control how we collect and use analytics data
              </SaturnCardDescription>
            </div>
          </div>
        </SaturnCardHeader>

        <SaturnCardContent>
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-[#37322F] mb-1">
                  Product Analytics
                </h3>
                <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                  We use PostHog to understand how you use Saturn and improve the product.
                  This includes page views, feature usage, and anonymous usage patterns.
                  We do not collect any sensitive data or personally identifiable information
                  without your explicit consent.
                </p>
              </div>
              
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isEnabled}
                  onChange={(e) => setIsEnabled(e.target.checked)}
                  disabled={hasDNT}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[rgba(55,50,47,0.1)] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#37322F] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
              </label>
            </div>

            {isEnabled && !hasDNT && (
              <div className="bg-[rgba(55,50,47,0.04)] rounded-lg p-4">
                <h4 className="font-medium text-[#37322F] mb-2 text-sm">
                  What we collect:
                </h4>
                <ul className="space-y-1 text-sm text-[rgba(55,50,47,0.60)] font-sans">
                  <li>• Page views and navigation patterns</li>
                  <li>• Feature usage (which features you use and how often)</li>
                  <li>• Performance metrics (load times, errors)</li>
                  <li>• Device and browser information</li>
                  <li>• General geographic location (city/country level)</li>
                </ul>

                <h4 className="font-medium text-[#37322F] mb-2 text-sm mt-4">
                  What we never collect:
                </h4>
                <ul className="space-y-1 text-sm text-[rgba(55,50,47,0.60)] font-sans">
                  <li>• Passwords or authentication tokens</li>
                  <li>• Monitor configurations or sensitive data</li>
                  <li>• Personal information beyond email (which you provided)</li>
                  <li>• Keystroke data or form inputs</li>
                  <li>• Session recordings or screen captures</li>
                </ul>
              </div>
            )}
          </div>
        </SaturnCardContent>
      </SaturnCard>

      <SaturnCard>
        <SaturnCardHeader>
          <div className="flex items-start gap-3">
            <Cookie className="w-6 h-6 text-[#37322F] mt-1" />
            <div>
              <SaturnCardTitle>Cookie Policy</SaturnCardTitle>
              <SaturnCardDescription>
                Learn about how we use cookies
              </SaturnCardDescription>
            </div>
          </div>
        </SaturnCardHeader>

        <SaturnCardContent>
          <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans mb-4">
            We use essential cookies to make Saturn work properly. When you enable analytics,
            we also use analytics cookies to understand usage patterns. You can learn more
            about our cookie usage in our{' '}
            <a href="/legal/cookies" className="text-[#37322F] underline hover:no-underline">
              Cookie Policy
            </a>
            .
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
              <div>
                <h4 className="font-medium text-[#37322F] text-sm">Essential Cookies</h4>
                <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                  Required for authentication, security, and basic functionality. Cannot be disabled.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${isEnabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              <div>
                <h4 className="font-medium text-[#37322F] text-sm">Analytics Cookies</h4>
                <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                  Help us understand how you use the app so we can improve it. Can be disabled above.
                </p>
              </div>
            </div>
          </div>
        </SaturnCardContent>
      </SaturnCard>

      <div className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
        <p>
          For more information about how we handle your data, please read our{' '}
          <a href="/legal/privacy" className="text-[#37322F] underline hover:no-underline">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}

