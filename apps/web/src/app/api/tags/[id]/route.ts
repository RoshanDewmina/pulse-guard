import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

const updateTagSchema = z.object({
  name: z.string().min(1).max(50),
});

/**
 * PATCH /api/tags/[id]
 * Update a tag
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name } = updateTagSchema.parse(body);

    // Find the tag and verify user has access
    const tag = await (prisma as any).tag.findUnique({
      where: { id },
      include: {
        Org: {
          include: {
            Membership: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    if (tag.Org.Membership.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if tag name already exists (excluding current tag)
    const existingTag = await (prisma as any).tag.findUnique({
      where: {
        orgId_name: {
          orgId: tag.Org.id,
          name,
        },
      },
    });

    if (existingTag && existingTag.id !== id) {
      return NextResponse.json({ error: 'Tag name already exists' }, { status: 400 });
    }

    // Update the tag
    const updatedTag = await (prisma as any).tag.update({
      where: { id },
      data: { name },
    });

    // Log tag update
    const { createAuditLog, AuditAction } = await import('@/lib/audit');
    await createAuditLog({
      action: AuditAction.TAG_UPDATED,
      orgId: tag.Org.id,
      userId: session.user.id,
      targetId: id,
      meta: { name: updatedTag.name },
    });

    return NextResponse.json(updatedTag);
  } catch (error) {
    console.error('Error updating tag:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/tags/[id]
 * Delete a tag
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find the tag and verify user has access
    const tag = await (prisma as any).tag.findUnique({
      where: { id },
      include: {
        Org: {
          include: {
            Membership: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!tag) {
      return NextResponse.json({ error: 'Tag not found' }, { status: 404 });
    }

    if (tag.Org.Membership.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Delete the tag (this will also delete all MonitorTag relationships due to cascade)
        await (prisma as any).tag.delete({
          where: { id },
        });

        // Log tag deletion
        const { createAuditLog, AuditAction } = await import('@/lib/audit');
        await createAuditLog({
          action: AuditAction.TAG_DELETED,
          orgId: tag.Org.id,
          userId: session.user.id,
          targetId: id,
          meta: { name: tag.name },
        });

        return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}