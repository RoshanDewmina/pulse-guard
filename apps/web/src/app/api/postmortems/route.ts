import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

/**
 * GET /api/postmortems
 * List all post-mortems for the user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      select: { orgId: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const postmortems = await prisma.postMortem.findMany({
      where: { orgId: membership.orgId },
      include: {
        Incident: {
          include: {
            Monitor: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(postmortems);
  } catch (error) {
    console.error('Error fetching post-mortems:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/postmortems
 * Create a new post-mortem
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id, role: { in: ['OWNER', 'ADMIN'] } },
      select: { orgId: true },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { incidentId, title, summary, impact, rootCause, timeline, actionItems, contributors } = body;

    if (!incidentId || !title || !summary) {
      return NextResponse.json(
        { error: 'incidentId, title, and summary are required' },
        { status: 400 }
      );
    }

    // Verify incident access
    const incident = await prisma.incident.findFirst({
      where: { id: incidentId, Monitor: { orgId: membership.orgId } },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    const postmortem = await prisma.postMortem.create({
      data: {
        orgId: membership.orgId,
        incidentId,
        title,
        summary,
        impact: impact || null,
        rootCause: rootCause || null,
        timeline: timeline || [],
        actionItems: actionItems || [],
        contributors: contributors || [],
        createdBy: session.user.id,
        status: 'DRAFT',
      },
      include: {
        Incident: {
          include: {
            Monitor: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json(postmortem, { status: 201 });
  } catch (error) {
    console.error('Error creating post-mortem:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

