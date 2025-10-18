import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

/**
 * GET /api/postmortems/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const postmortem = await prisma.postMortem.findFirst({
      where: {
        id,
        Org: {
          Membership: {
            some: { userId: session.user.id },
          },
        },
      },
      include: {
        Incident: {
          include: {
            Monitor: { select: { id: true, name: true } },
            IncidentEvent: { orderBy: { createdAt: 'asc' } },
          },
        },
      },
    });

    if (!postmortem) {
      return NextResponse.json({ error: 'Post-mortem not found' }, { status: 404 });
    }

    return NextResponse.json(postmortem);
  } catch (error) {
    console.error('Error fetching post-mortem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/postmortems/:id
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const postmortem = await prisma.postMortem.findFirst({
      where: {
        id,
        Org: {
          Membership: {
            some: { userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
          },
        },
      },
    });

    if (!postmortem) {
      return NextResponse.json(
        { error: 'Post-mortem not found or insufficient permissions' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, summary, impact, rootCause, timeline, actionItems, contributors, status } = body;

    const updated = await prisma.postMortem.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(summary !== undefined && { summary }),
        ...(impact !== undefined && { impact }),
        ...(rootCause !== undefined && { rootCause }),
        ...(timeline !== undefined && { timeline }),
        ...(actionItems !== undefined && { actionItems }),
        ...(contributors !== undefined && { contributors }),
        ...(status !== undefined && {
          status,
          ...(status === 'PUBLISHED' && !postmortem.publishedAt && { publishedAt: new Date() }),
        }),
      },
      include: {
        Incident: {
          include: {
            Monitor: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating post-mortem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/postmortems/:id
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const postmortem = await prisma.postMortem.findFirst({
      where: {
        id,
        Org: {
          Membership: {
            some: { userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
          },
        },
      },
    });

    if (!postmortem) {
      return NextResponse.json(
        { error: 'Post-mortem not found or insufficient permissions' },
        { status: 404 }
      );
    }

    await prisma.postMortem.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting post-mortem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

