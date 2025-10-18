'use client';

import { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/use-analytics';
import { SaturnButton } from './saturn';
import { Cookie, X } from 'lucide-react';

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const { setIsEnabled } = useAnalytics();

  useEffect(() => {
    // Check if consent has been given
    const consent = localStorage.getItem('analytics-consent');
    const hasDNT = typeof navigator !== 'undefined' &&
      (navigator.doNotTrack === '1' ||
       (window as any).doNotTrack === '1' ||
       (navigator as any).msDoNotTrack === '1');

    // Show banner if no consent given and no DNT
    if (consent === null && !hasDNT) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    setIsEnabled(true);
    setShowBanner(false);
  };

  const handleReject = () => {
    setIsEnabled(false);
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="w-6 h-6 text-[#37322F] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#37322F] mb-1">
                We use cookies
              </h3>
              <p className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                We use cookies and similar technologies to improve your experience, analyze site traffic,
                and personalize content. By clicking "Accept", you consent to our use of cookies.
                {' '}
                <a
                  href="/legal/cookies"
                  className="text-[#37322F] underline hover:no-underline"
                >
                  Learn more
                </a>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <SaturnButton
              variant="secondary"
              onClick={handleReject}
              className="flex-1 sm:flex-none"
            >
              Reject
            </SaturnButton>
            <SaturnButton
              onClick={handleAccept}
              className="flex-1 sm:flex-none"
            >
              Accept
            </SaturnButton>
          </div>
        </div>
      </div>
    </div>
  );
}

