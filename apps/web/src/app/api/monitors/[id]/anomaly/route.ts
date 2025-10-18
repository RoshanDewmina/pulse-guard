import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';
import { authOptions, hasOrgAccess, isOrgAdmin } from '@/lib/auth';

/**
 * PATCH /api/monitors/[id]/anomaly
 * Update anomaly detection thresholds for a monitor
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Anomaly tuning API disabled - fields don't exist in schema yet
  return NextResponse.json({ error: 'Anomaly tuning not implemented' }, { status: 501 });

  /* Uncomment when schema migration is applied
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { 
      anomalyZScoreThreshold,
      anomalyMedianMultiplier,
      anomalyOutputDropFraction,
    } = body;

    // Get monitor and check permissions
    const monitor = await prisma.monitor.findUnique({
      where: { id },
      select: {
        orgId: true,
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Check org access and admin role
    const hasAccess = await hasOrgAccess(session.user.id, monitor.orgId);
    const isAdmin = await isOrgAdmin(session.user.id, monitor.orgId);
    
    if (!hasAccess || !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate thresholds
    const updates: any = {};

    if (anomalyZScoreThreshold !== undefined) {
      if (typeof anomalyZScoreThreshold !== 'number' || anomalyZScoreThreshold < 1 || anomalyZScoreThreshold > 10) {
        return NextResponse.json(
          { error: 'Z-score threshold must be between 1 and 10' },
          { status: 400 }
        );
      }
      updates.anomalyZScoreThreshold = anomalyZScoreThreshold;
    }

    if (anomalyMedianMultiplier !== undefined) {
      if (typeof anomalyMedianMultiplier !== 'number' || anomalyMedianMultiplier < 1 || anomalyMedianMultiplier > 20) {
        return NextResponse.json(
          { error: 'Median multiplier must be between 1 and 20' },
          { status: 400 }
        );
      }
      updates.anomalyMedianMultiplier = anomalyMedianMultiplier;
    }

    if (anomalyOutputDropFraction !== undefined) {
      if (typeof anomalyOutputDropFraction !== 'number' || anomalyOutputDropFraction < 0 || anomalyOutputDropFraction > 1) {
        return NextResponse.json(
          { error: 'Output drop fraction must be between 0 and 1' },
          { status: 400 }
        );
      }
      updates.anomalyOutputDropFraction = anomalyOutputDropFraction;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid anomaly parameters provided' },
        { status: 400 }
      );
    }

    // Update monitor
    const updated = await prisma.monitor.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({
      success: true,
      anomalyZScoreThreshold: updated.anomalyZScoreThreshold,
      anomalyMedianMultiplier: updated.anomalyMedianMultiplier,
      anomalyOutputDropFraction: updated.anomalyOutputDropFraction,
    });
  } catch (error) {
    console.error('Error updating anomaly settings:', error);
    return NextResponse.json(
      { error: 'Failed to update anomaly settings' },
      { status: 500 }
    );
  }
  */
}

/**
 * GET /api/monitors/[id]/anomaly
 * Get current anomaly detection thresholds for a monitor
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Anomaly tuning API disabled - fields don't exist in schema yet
  return NextResponse.json({
    anomalyZScoreThreshold: 3.0,
    anomalyMedianMultiplier: 5.0,
    anomalyOutputDropFraction: 0.5,
  });

  /* Uncomment when schema migration is applied
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get monitor and check permissions
    const monitor = await prisma.monitor.findUnique({
      where: { id },
      select: {
        orgId: true,
        anomalyZScoreThreshold: true,
        anomalyMedianMultiplier: true,
        anomalyOutputDropFraction: true,
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
    }

    // Check org access
    const hasAccess = await hasOrgAccess(session.user.id, monitor.orgId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      anomalyZScoreThreshold: monitor.anomalyZScoreThreshold,
      anomalyMedianMultiplier: monitor.anomalyMedianMultiplier,
      anomalyOutputDropFraction: monitor.anomalyOutputDropFraction,
    });
  } catch (error) {
    console.error('Error fetching anomaly settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anomaly settings' },
      { status: 500 }
    );
  }
  */
}

