'use client';

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
} from '@/components/saturn';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

type OnboardingStep = 1 | 2 | 3;

interface FormData {
  name: string;
  orgName: string;
  orgSlug: string;
  teamInvites: Array<{ email: string; role: 'ADMIN' | 'MEMBER' }>;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    orgName: '',
    orgSlug: '',
    teamInvites: [],
  });

  // Check if onboarding is already complete on mount
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        const response = await fetch('/api/org');
        if (response.ok) {
          // If user already has an org, they've completed onboarding
          // Force redirect to app
          window.location.href = '/app';
        }
      } catch (error) {
        // Ignore errors, let them proceed with onboarding
      }
    };
    
    checkOnboardingStatus();
  }, []);

  // Auto-generate slug from org name
  useEffect(() => {
    if (formData.orgName && currentStep === 2) {
      const slug = formData.orgName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      if (slug !== formData.orgSlug) {
        setFormData((prev) => ({ ...prev, orgSlug: slug }));
      }
    }
  }, [formData.orgName, currentStep]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!formData.orgSlug || currentStep !== 2) {
      setSlugAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSlug(true);
      try {
        const response = await fetch(
          `/api/onboarding/check-slug?slug=${encodeURIComponent(formData.orgSlug)}`
        );
        const data = await response.json();
        setSlugAvailable(data.available);
      } catch (error) {
        console.error('Error checking slug:', error);
      } finally {
        setCheckingSlug(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.orgSlug, currentStep]);

  const handleNext = () => {
    setError('');

    // Validate current step
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setError('Please enter your name');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!formData.orgName.trim()) {
        setError('Please enter an organization name');
        return;
      }
      if (!formData.orgSlug.trim()) {
        setError('Please enter an organization slug');
        return;
      }
      if (slugAvailable === false) {
        setError('This slug is already taken. Please choose another one.');
        return;
      }
      // Skip step 3 (team invites) for now since default is FREE plan
      // In the future, check subscription plan and show step 3 for PRO users
      handleComplete();
    }
  };

  const handleBack = () => {
    setError('');
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          orgName: formData.orgName,
          orgSlug: formData.orgSlug,
          teamInvites: formData.teamInvites.length > 0 ? formData.teamInvites : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if onboarding is already completed
        if (data.error?.includes('already completed')) {
          setAlreadyCompleted(true);
        }
        throw new Error(data.error || 'Failed to complete onboarding');
      }

      // Show success step briefly before redirecting
      setCurrentStep(3);
      
      // Force a full page reload to refresh the session with new onboarding status
      setTimeout(() => {
        window.location.href = '/app';
      }, 1500);
    } catch (error: any) {
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    window.location.href = '/app';
  };

  const totalSteps = 2; // Only showing step 1 and 2 for FREE plan users
  const progress = (currentStep / totalSteps) * 100;

  return (
    <SaturnCard>
      <SaturnCardHeader>
        <SaturnCardTitle as="h1">
          {currentStep === 1 && 'Welcome to Saturn'}
          {currentStep === 2 && 'Create Your Organization'}
          {currentStep === 3 && 'All Set!'}
        </SaturnCardTitle>
        <SaturnCardDescription>
          {currentStep === 1 && "Let's get started by setting up your account"}
          {currentStep === 2 && 'Choose a name and URL for your organization'}
          {currentStep === 3 && 'Your account is ready to use'}
        </SaturnCardDescription>
      </SaturnCardHeader>

      <SaturnCardContent>
        {/* Progress indicator */}
        {currentStep < 3 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                Step {currentStep} of {totalSteps}
              </span>
              <span className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-[rgba(55,50,47,0.12)] rounded-full h-2">
              <div
                className="bg-[#37322F] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 font-sans">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            {alreadyCompleted && (
              <div className="mt-3">
                <SaturnButton
                  onClick={handleGoToDashboard}
                  fullWidth
                >
                  Go to Dashboard
                </SaturnButton>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <SaturnLabel htmlFor="name" required>
                Your Name
              </SaturnLabel>
              <SaturnInput
                id="name"
                type="text"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                disabled={isLoading}
                fullWidth
                autoFocus
              />
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                This is how you'll appear to your team members
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <SaturnButton
                onClick={handleNext}
                disabled={isLoading || !formData.name.trim()}
                fullWidth
              >
                Continue
              </SaturnButton>
            </div>
          </div>
        )}

        {/* Step 2: Organization */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <SaturnLabel htmlFor="orgName" required>
                Organization Name
              </SaturnLabel>
              <SaturnInput
                id="orgName"
                type="text"
                placeholder="Acme Inc."
                value={formData.orgName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, orgName: e.target.value }))
                }
                disabled={isLoading}
                fullWidth
                autoFocus
              />
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                Your company or team name
              </p>
            </div>

            <div className="space-y-2">
              <SaturnLabel htmlFor="orgSlug" required>
                Organization URL
              </SaturnLabel>
              <div className="flex items-center gap-2">
                <span className="text-sm text-[rgba(55,50,47,0.60)] font-sans">
                  saturn.app/
                </span>
                <SaturnInput
                  id="orgSlug"
                  type="text"
                  placeholder="acme"
                  value={formData.orgSlug}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      orgSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    }))
                  }
                  disabled={isLoading}
                  fullWidth
                />
              </div>
              {checkingSlug && (
                <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking availability...
                </p>
              )}
              {!checkingSlug && slugAvailable === true && formData.orgSlug && (
                <p className="text-xs text-green-600 font-sans flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Available!
                </p>
              )}
              {!checkingSlug && slugAvailable === false && formData.orgSlug && (
                <p className="text-xs text-red-600 font-sans flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Already taken
                </p>
              )}
              <p className="text-xs text-[rgba(55,50,47,0.60)] font-sans">
                Used for your organization's unique URL
              </p>
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <SaturnButton
                variant="secondary"
                onClick={handleBack}
                disabled={isLoading}
              >
                Back
              </SaturnButton>
              <SaturnButton
                onClick={handleNext}
                disabled={
                  isLoading ||
                  !formData.orgName.trim() ||
                  !formData.orgSlug.trim() ||
                  slugAvailable === false ||
                  checkingSlug
                }
                loading={isLoading}
                fullWidth
              >
                Complete Setup
              </SaturnButton>
            </div>
          </div>
        )}

        {/* Step 3: Success */}
        {currentStep === 3 && (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-[#37322F] mb-2">
              You're all set!
            </h3>
            <p className="text-[rgba(55,50,47,0.60)] font-sans mb-6">
              Redirecting you to your dashboard...
            </p>
            <div className="flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#37322F]" />
            </div>
          </div>
        )}
      </SaturnCardContent>
    </SaturnCard>
  );
}


