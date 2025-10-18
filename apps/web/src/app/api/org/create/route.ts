import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';
import crypto from 'crypto';

export const runtime = 'nodejs';

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required').max(100),
  slug: z
    .string()
    .min(1, 'Organization slug is required')
    .max(50)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = createOrgSchema.parse(body);

    // Check how many orgs the user currently owns
    const userOrgsCount = await prisma.membership.count({
      where: {
        userId: session.user.id,
        role: 'OWNER',
      },
    });

    // For now, allow up to 5 organizations per user (can be adjusted based on plan)
    // TODO: Check user's subscription plan to determine limit
    const orgLimit = 5;
    if (userOrgsCount >= orgLimit) {
      return NextResponse.json(
        { error: `You've reached the maximum number of organizations (${orgLimit}). Please upgrade your plan.` },
        { status: 403 }
      );
    }

    // Check if slug is available
    const existingOrg = await prisma.org.findUnique({
      where: { slug: data.slug },
    });

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug is already taken' },
        { status: 400 }
      );
    }

    // Create organization with membership and subscription plan in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const org = await tx.org.create({
        data: {
          id: crypto.randomUUID(),
          name: data.name,
          slug: data.slug,
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

      // Create audit log
      await tx.auditLog.create({
        data: {
          id: crypto.randomUUID(),
          orgId: org.id,
          userId: session.user.id,
          action: 'ORG_CREATED',
          targetId: org.id,
          meta: {
            name: org.name,
            slug: org.slug,
          },
        },
      });

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
    console.error('Create org error:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the organization' },
      { status: 500 }
    );
  }
}

