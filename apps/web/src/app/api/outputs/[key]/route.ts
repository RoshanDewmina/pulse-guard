import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { getOutput } from '@/lib/s3';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { key } = await params;
    const outputKey = decodeURIComponent(key);

    // Find the run with this output key and verify user has access
    const run = await prisma.run.findFirst({
      where: {
        outputKey,
      },
      include: {
        Monitor: {
          include: {
            Org: {
              include: {
                Membership: {
                  where: {
                    User: {
                      email: session.user.email,
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: 'Output not found' }, { status: 404 });
    }

    // Check if user has access to this org
    if (run.Monitor.Org.Membership.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch output from S3
    const output = await getOutput(outputKey);

    return new NextResponse(output, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error fetching output:', error);
    return NextResponse.json(
      { error: 'Failed to fetch output' },
      { status: 500 }
    );
  }
}




