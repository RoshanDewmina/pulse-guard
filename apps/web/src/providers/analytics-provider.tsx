'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import posthog from 'posthog-js';

interface AnalyticsContextType {
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;
  track: (event: string, properties?: Record<string, any>) => void;
  identify: (userId: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  isEnabled: false,
  setIsEnabled: () => {},
  track: () => {},
  identify: () => {},
});

export function useAnalytics() {
  return useContext(AnalyticsContext);
}

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const [isEnabled, setIsEnabledState] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Check if PostHog is configured
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!posthogKey || typeof window === 'undefined') {
      return;
    }

    // Check DNT (Do Not Track)
    const hasDNT = navigator.doNotTrack === '1' ||
                   (window as any).doNotTrack === '1' ||
                   (navigator as any).msDoNotTrack === '1';

    // Check saved consent
    const savedConsent = localStorage.getItem('analytics-consent');
    const shouldEnable = !hasDNT && savedConsent === 'true';

    if (shouldEnable) {
      // Initialize PostHog
      posthog.init(posthogKey, {
        api_host: posthogHost,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            posthog.debug();
          }
        },
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false, // Disable autocapture for privacy
        disable_session_recording: true, // Disable session recording for privacy
        respect_dnt: true,
      });

      setIsEnabledState(true);
    }

    setIsInitialized(true);
  }, []);

  const setIsEnabled = (enabled: boolean) => {
    if (!isInitialized) return;

    localStorage.setItem('analytics-consent', enabled ? 'true' : 'false');
    setIsEnabledState(enabled);

    if (enabled && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: false,
        disable_session_recording: true,
        respect_dnt: true,
      });
    } else if (!enabled) {
      posthog.opt_out_capturing();
      posthog.reset();
    }
  };

  const track = (event: string, properties?: Record<string, any>) => {
    if (!isEnabled) return;

    try {
      posthog.capture(event, properties);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  };

  const identify = (userId: string, properties?: Record<string, any>) => {
    if (!isEnabled) return;

    try {
      posthog.identify(userId, properties);
    } catch (error) {
      console.error('Analytics identify error:', error);
    }
  };

  return (
    <AnalyticsContext.Provider value={{ isEnabled, setIsEnabled, track, identify }}>
      {children}
    </AnalyticsContext.Provider>
  );
}

