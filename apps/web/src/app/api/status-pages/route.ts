import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, getUserPrimaryOrg } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';
import crypto from 'crypto';

const createStatusPageSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/),
  isPublic: z.boolean().default(true),
  components: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    monitorIds: z.array(z.string()).default([]),
  })).default([]),
  theme: z.object({
    primaryColor: z.string().default('#10B981'),
    backgroundColor: z.string().default('#FFFFFF'),
    textColor: z.string().default('#1F2937'),
    logoUrl: z.string().nullable().optional(),
  }).default({}),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await getUserPrimaryOrg(session.user.id);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const statusPages = await prisma.statusPage.findMany({
      where: { orgId: org.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(statusPages);
  } catch (error) {
    console.error('Failed to fetch status pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status pages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const org = await getUserPrimaryOrg(session.user.id);
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check role (viewers cannot create)
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        orgId: org.id,
      },
    });

    if (!membership || membership.role === 'VIEWER' as any) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check status page limit
    const orgWithPlan = await prisma.org.findUnique({
      where: { id: org.id },
      include: {
        SubscriptionPlan: true,
        _count: {
          select: { StatusPage: true },
        },
      },
    });

    if (!orgWithPlan?.SubscriptionPlan) {
      return NextResponse.json({ error: 'No subscription plan found' }, { status: 404 });
    }

    const plan = orgWithPlan.SubscriptionPlan;
    const currentCount = orgWithPlan._count.StatusPage;
    
    // Check if at limit (unlimited is -1)
    if (plan.statusPageLimit !== -1 && currentCount >= plan.statusPageLimit) {
      return NextResponse.json(
        { error: `Status page limit reached (${plan.statusPageLimit}). Please upgrade your plan.` },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createStatusPageSchema.parse(body);

    // Check if slug is already taken
    const existingPage = await prisma.statusPage.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingPage) {
      return NextResponse.json(
        { error: 'Slug is already taken' },
        { status: 400 }
      );
    }

    // Generate access token for private status pages
    const accessToken = crypto.randomBytes(32).toString('hex');

    const statusPage = await prisma.statusPage.create({
      data: {
        id: crypto.randomUUID(),
        orgId: org.id,
        title: validatedData.title,
        slug: validatedData.slug,
        isPublic: validatedData.isPublic,
        accessToken,
        components: validatedData.components as any,
        theme: validatedData.theme as any,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        orgId: org.id,
        userId: session.user.id,
        action: 'STATUS_PAGE_CREATED',
        targetId: statusPage.id,
        meta: {
          slug: statusPage.slug,
          title: statusPage.title,
        },
      },
    });

    return NextResponse.json(statusPage, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to create status page:', error);
    return NextResponse.json(
      { error: 'Failed to create status page' },
      { status: 500 }
    );
  }
}

