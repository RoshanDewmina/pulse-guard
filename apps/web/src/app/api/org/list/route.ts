import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all organizations the user belongs to
    const memberships = await prisma.membership.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        Org: {
          include: {
            _count: {
              select: {
                Monitor: true,
                Membership: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const organizations = memberships.map((m) => ({
      id: m.Org.id,
      name: m.Org.name,
      slug: m.Org.slug,
      role: m.role,
      monitorCount: m.Org._count.Monitor,
      memberCount: m.Org._count.Membership,
      createdAt: m.Org.createdAt,
    }));

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error('List orgs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

