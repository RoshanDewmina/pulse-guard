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
        MonitorTag: {
          select: {
            Tag: {
              select: {
                name: true,
              },
            },
          },
        },
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
        image: user.image,
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
      monitors: monitors.map((m) => ({
        ...m,
        tags: m.MonitorTag?.map((mt) => mt.Tag.name) || [],
        MonitorTag: undefined, // Remove the nested structure
      })),
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

    // Rate limit: Check for recent exports (1 per 24 hours)
    const recentExport = await prisma.dataExport.findFirst({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (recentExport) {
      const hoursRemaining = Math.ceil(
        (24 * 60 * 60 * 1000 - (Date.now() - recentExport.createdAt.getTime())) / (60 * 60 * 1000)
      );

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You can only request one data export per 24 hours. Please try again in ${hoursRemaining} hour(s).`,
          nextAvailable: new Date(recentExport.createdAt.getTime() + 24 * 60 * 60 * 1000),
        },
        { status: 429 }
      );
    }

    // Create export record in database
    const dataExport = await prisma.dataExport.create({
      data: {
        userId: session.user.id,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      },
    });

    // Queue background job to generate export
    const { dataExportQueue } = await import('@/lib/queues');
    await dataExportQueue.add(
      'generate-export',
      {
        exportId: dataExport.id,
        userId: session.user.id,
      },
      {
        jobId: `export-${dataExport.id}`,
        removeOnComplete: 10,
        removeOnFail: 10,
      }
    );

    // Create audit log
    const { createAuditLog, AuditAction } = await import('@/lib/audit');
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
    });
    
    if (membership) {
      await createAuditLog({
        action: AuditAction.USER_DATA_EXPORTED,
        orgId: membership.orgId,
        userId: session.user.id,
        targetId: dataExport.id,
        meta: {
          exportId: dataExport.id,
          expiresAt: dataExport.expiresAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Export request created. You will receive an email when your data is ready (usually within 5-10 minutes).',
      export: {
        id: dataExport.id,
        status: dataExport.status,
        createdAt: dataExport.createdAt,
        expiresAt: dataExport.expiresAt,
      },
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

    // 1. Cleanup S3 objects (outputs and data exports)
    console.log('🗑️ Cleaning up S3 objects...');
    
    try {
      const { deleteObjectsByPrefix, deleteDataExport } = await import('@/lib/s3');
      
      // Delete monitor outputs for all monitors in user's organizations
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
        },
      });

      let s3DeletedCount = 0;
      for (const monitor of monitors) {
        const deleted = await deleteObjectsByPrefix(`outputs/${monitor.id}/`);
        s3DeletedCount += deleted;
      }

      // Delete any data export files
      const dataExports = await prisma.dataExport.findMany({
        where: {
          userId: session.user.id,
          s3Key: { not: null },
        },
      });

      for (const dataExport of dataExports) {
        try {
          await deleteDataExport(dataExport.id);
        } catch (error) {
          console.error(`Failed to delete export ${dataExport.id}:`, error);
        }
      }

      console.log(`✅ Deleted ${s3DeletedCount} S3 objects`);
    } catch (error) {
      console.error('⚠️ Error cleaning up S3 objects:', error);
      // Continue with deletion even if S3 cleanup fails
    }

    // 2. Create audit log before deletion
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
    });

    if (membership) {
      const { createAuditLog, AuditAction } = await import('@/lib/audit');
      await createAuditLog({
        action: AuditAction.USER_DELETED,
        orgId: membership.orgId,
        userId: session.user.id,
        meta: {
          deletedAt: new Date(),
          email: session.user.email,
        },
      });
    }

    // 3. Remove user from all memberships
    await prisma.membership.deleteMany({
      where: {
        userId: session.user.id,
      },
    });

    // 4. Delete accounts (OAuth connections)
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

    console.log(`✅ Account deleted: ${session.user.email}`);

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


