import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/onboarding/complete-checklist
 * Mark onboarding checklist as complete
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Update onboardingCompleted to true
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        onboardingCompleted: true,
        // onboardingStep: 'DONE', // Uncomment when schema migration is applied
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed!',
    });
  } catch (error) {
    console.error('Complete checklist error:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

