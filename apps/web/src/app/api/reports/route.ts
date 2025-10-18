import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { slaReportQueue } from '@tokiflow/shared';

/**
 * GET /api/reports
 * List all SLA reports for the user's organization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        orgId: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get all reports for this org
    const reports = await prisma.slaReport.findMany({
      where: {
        orgId: membership.orgId,
      },
      include: {
        Monitor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
      take: 50, // Last 50 reports
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching SLA reports:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/reports
 * Generate a new SLA report
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
      },
      select: {
        orgId: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    const body = await request.json();
    const { monitorId, period, startDate, endDate } = body;

    // Validation
    if (!period || !['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be one of: DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, CUSTOM' },
        { status: 400 }
      );
    }

    if (period === 'CUSTOM' && (!startDate || !endDate)) {
      return NextResponse.json(
        { error: 'Start and end dates are required for CUSTOM period' },
        { status: 400 }
      );
    }

    // If monitorId is provided, verify access
    if (monitorId) {
      const monitor = await prisma.monitor.findFirst({
        where: {
          id: monitorId,
          orgId: membership.orgId,
        },
      });

      if (!monitor) {
        return NextResponse.json(
          { error: 'Monitor not found or access denied' },
          { status: 404 }
        );
      }
    }

    // Queue report generation job
    const job = await slaReportQueue.add(
      'generate-report',
      {
        orgId: membership.orgId,
        monitorId: monitorId || undefined,
        period,
        startDate,
        endDate,
        generatedBy: session.user.id,
      },
      {
        jobId: `report-${membership.orgId}-${Date.now()}`,
        removeOnComplete: 50,
        removeOnFail: 50,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Report generation started',
      jobId: job.id,
    }, { status: 202 });
  } catch (error) {
    console.error('Error creating SLA report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

