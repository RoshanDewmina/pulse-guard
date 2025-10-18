import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const completeOnboardingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  orgName: z.string().min(1, 'Organization name is required').max(100),
  orgSlug: z
    .string()
    .min(1, 'Organization slug is required')
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  teamInvites: z
    .array(
      z.object({
        email: z.string().email('Invalid email address'),
        role: z.enum(['ADMIN', 'MEMBER']),
      })
    )
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = completeOnboardingSchema.parse(body);

    // Check if user has already completed onboarding
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { onboardingCompleted: true },
    });

    if (user?.onboardingCompleted) {
      return NextResponse.json(
        { error: 'Onboarding already completed' },
        { status: 400 }
      );
    }

    // Check if slug is available
    const existingOrg = await prisma.org.findUnique({
      where: { slug: data.orgSlug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug is already taken' },
        { status: 400 }
      );
    }

    // Create organization with membership and subscription plan in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user's name and onboarding status
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          name: data.name,
          onboardingCompleted: true,
          updatedAt: new Date(),
        },
      });

      // Create organization
      const org = await tx.org.create({
        data: {
          id: crypto.randomUUID(),
          name: data.orgName,
          slug: data.orgSlug,
          updatedAt: new Date(),
          Membership: {
            create: {
              id: crypto.randomUUID(),
              userId: session.user.id,
              role: 'OWNER',
              updatedAt: new Date(),
            },
          },
          SubscriptionPlan: {
            create: {
              id: crypto.randomUUID(),
              plan: 'FREE',
              monitorLimit: 5,
              userLimit: 1,
              updatedAt: new Date(),
            },
          },
        },
        include: {
          SubscriptionPlan: true,
        },
      });

      // TODO: Handle team invites for pro plan users
      // For now, we'll skip team invites as the default plan is FREE
      // In the future, this would check if org.SubscriptionPlan.plan is 'PRO' or 'ENTERPRISE'
      // and send invitation emails to data.teamInvites

      return { org };
    });

    return NextResponse.json({
      success: true,
      org: {
        id: result.org.id,
        name: result.org.name,
        slug: result.org.slug,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Complete onboarding error:', error);
    return NextResponse.json(
      { error: 'An error occurred during onboarding' },
      { status: 500 }
    );
  }
}


