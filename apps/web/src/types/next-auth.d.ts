import 'next-auth';
import type { OnboardingStep } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      onboardingCompleted?: boolean;
      onboardingStep?: OnboardingStep;
      mfaEnabled?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    image?: string | null;
    onboardingCompleted?: boolean;
    onboardingStep?: OnboardingStep;
    mfaEnabled?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string;
    onboardingCompleted?: boolean;
    onboardingStep?: OnboardingStep;
    mfaEnabled?: boolean;
  }
}

