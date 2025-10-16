import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');
    const status = searchParams.get('status');
    const kind = searchParams.get('kind');
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    }

    // Check access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_orgId: {
          userId: session.user.id,
          orgId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const where: any = {
      Monitor: {
        orgId,
      },
    };

    if (status) {
      where.status = status;
    }

    if (kind) {
      where.kind = kind;
    }

    const incidents = await prisma.incident.findMany({
      where,
      take: limit,
      orderBy: {
        openedAt: 'desc',
      },
      include: {
        Monitor: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ incidents });
  } catch (error) {
    console.error('Get incidents error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

