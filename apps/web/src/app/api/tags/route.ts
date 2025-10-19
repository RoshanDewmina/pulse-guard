import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1).max(50),
});

/**
 * GET /api/tags
 * Get all tags for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Verify user has access to this org
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        orgId,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const tags = await prisma.tag.findMany({
      where: { orgId },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(tags);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/tags
 * Create a new tag
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name } = createTagSchema.parse(body);

    // Get user's primary organization
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { Org: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Check if tag already exists
    const existingTag = await prisma.tag.findUnique({
      where: {
        orgId_name: {
          orgId: membership.orgId,
          name,
        },
      },
    });

    if (existingTag) {
      return NextResponse.json({ error: 'Tag already exists' }, { status: 400 });
    }

    const tag = await prisma.tag.create({
      data: {
        orgId: membership.orgId,
        name,
      },
    });

    // Log tag creation
    const { createAuditLog, AuditAction } = await import('@/lib/audit');
    await createAuditLog({
      action: AuditAction.TAG_CREATED,
      orgId: membership.orgId,
      userId: session.user.id,
      targetId: tag.id,
      meta: { name: tag.name },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Error creating tag:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}