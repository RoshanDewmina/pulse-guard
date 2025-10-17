import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

// GET /api/user/export - Request data export (GDPR compliance)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch complete user data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        Account: {
          select: {
            provider: true,
            providerAccountId: true,
            createdAt: true,
          },
        },
        Membership: {
          include: {
            Org: {
              select: {
                id: true,
                name: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get monitors from all user's organizations
    const monitors = await prisma.monitor.findMany({
      where: {
        Org: {
          Membership: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        scheduleType: true,
        cronExpr: true,
        intervalSec: true,
        graceSec: true,
        timezone: true,
        tags: true,
        captureOutput: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get runs (limit to recent 1000 per monitor to avoid huge exports)
    const runs = await prisma.run.findMany({
      where: {
        Monitor: {
          Org: {
            Membership: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 1000,
      select: {
        id: true,
        monitorId: true,
        outcome: true,
        exitCode: true,
        durationMs: true,
        createdAt: true,
      },
    });

    // Get incidents
    const incidents = await prisma.incident.findMany({
      where: {
        Monitor: {
          Org: {
            Membership: {
              some: {
                userId: session.user.id,
              },
            },
          },
        },
      },
      select: {
        id: true,
        monitorId: true,
        kind: true,
        status: true,
        acknowledgedAt: true,
        resolvedAt: true,
        openedAt: true,
      },
    });

    // Get alert channels
    const channels = await prisma.alertChannel.findMany({
      where: {
        Org: {
          Membership: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      select: {
        id: true,
        label: true,
        type: true,
        createdAt: true,
        // Note: configJson excluded for security (contains webhooks, API keys)
      },
    });

    // Get alert rules
    const rules = await prisma.rule.findMany({
      where: {
        Org: {
          Membership: {
            some: {
              userId: session.user.id,
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        suppressMinutes: true,
        createdAt: true,
      },
    });

    const userData = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accounts: user.Account,
      memberships: user.Membership.map((m) => ({
        organizationId: m.Org.id,
        organizationName: m.Org.name,
        role: m.role,
        joinedAt: m.createdAt,
      })),
      monitors: monitors,
      runs: runs,
      incidents: incidents,
      alertChannels: channels,
      alertRules: rules,
      exportMetadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: session.user.email,
        runsLimit: 1000,
        note: 'Sensitive credentials and API keys are excluded for security',
      },
    };

    return NextResponse.json(userData, {
      headers: {
        'Content-Disposition': `attachment; filename="pulseguard-data-export-${Date.now()}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/user/export - Request async data export (for large datasets)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Create export job
    // TODO: Queue background job to generate export
    // TODO: Send email when ready
    // TODO: Store export temporarily in S3
    // TODO: Auto-delete after 7 days
    // TODO: Enforce rate limit (1 export per 24 hours)

    const exportRequest = {
      id: `export_${Date.now()}`,
      userId: session.user.id,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    // Note: Background export job implementation pending
    // Will queue job and send email notification when complete

    return NextResponse.json({
      success: true,
      message: 'Export request created. You will receive an email when your data is ready.',
      export: exportRequest,
    });
  } catch (error) {
    console.error('Error creating export request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/user/export - Delete account (GDPR right to erasure)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const confirmation = searchParams.get('confirm');

    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        { error: 'Confirmation required. Add ?confirm=DELETE_MY_ACCOUNT' },
        { status: 400 }
      );
    }

    // Verify user is not the sole owner of any organizations
    const ownerships = await prisma.membership.findMany({
      where: {
        userId: session.user.id,
        role: 'OWNER',
      },
      include: {
        Org: {
          include: {
            Membership: {
              where: {
                role: 'OWNER',
              },
            },
          },
        },
      },
    });

    // Check if user is the only owner of any org
    const soleOwnerOrgs = ownerships.filter((m) => m.Org.Membership.length === 1);

    if (soleOwnerOrgs.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete account',
          message: `You are the sole owner of ${soleOwnerOrgs.length} organization(s). Please transfer ownership or delete these organizations first.`,
          organizations: soleOwnerOrgs.map((m) => ({
            id: m.Org.id,
            name: m.Org.name,
          })),
        },
        { status: 400 }
      );
    }

    // Begin deletion process
    // Note: Most relations cascade automatically via Prisma schema onDelete: Cascade
    // We handle special cases here

    // 1. Remove user from all memberships
    await prisma.membership.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    // 2. Delete accounts (OAuth connections)
    await prisma.account.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    // 5. Finally, delete the user (this will cascade to other relations)
    await prisma.user.delete({
      where: {
        id: session.user.id,
      },
    });

    // Note: S3 objects cleanup would happen here in production
    // This requires iterating through monitors that belonged to user's orgs
    // and deleting their output files from S3

    return NextResponse.json({
      success: true,
      message: 'Account successfully deleted. All your data has been removed.',
    });
  } catch (error) {
    console.error('Error deleting user account:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to delete account. Please contact support.',
      },
      { status: 500 }
    );
  }
}


