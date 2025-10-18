import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';
import { authOptions, hasOrgAccess } from '@/lib/auth';

/**
 * POST /api/incidents/[id]/snooze
 * Snooze an incident (suppress alerts for a specified duration)
 */
export async function POST(
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
    const { minutes, until } = body;

    // Validate input
    if (!minutes && !until) {
      return NextResponse.json(
        { error: 'Either minutes or until is required' },
        { status: 400 }
      );
    }

    // Get incident and check permissions
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        Monitor: {
          select: {
            orgId: true,
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Check org access
    const hasAccess = await hasOrgAccess(session.user.id, incident.Monitor.orgId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Calculate suppression end time
    let suppressUntil: Date;
    
    if (until) {
      suppressUntil = new Date(until);
      
      // Validate future date
      if (suppressUntil <= new Date()) {
        return NextResponse.json(
          { error: 'Until date must be in the future' },
          { status: 400 }
        );
      }
    } else if (minutes) {
      // Validate minutes
      if (minutes <= 0 || minutes > 10080) { // Max 1 week
        return NextResponse.json(
          { error: 'Minutes must be between 1 and 10080 (1 week)' },
          { status: 400 }
        );
      }
      
      suppressUntil = new Date(Date.now() + minutes * 60 * 1000);
    } else {
      return NextResponse.json(
        { error: 'Invalid snooze parameters' },
        { status: 400 }
      );
    }

    // Update incident
    const updated = await prisma.incident.update({
      where: { id },
      data: {
        suppressUntil,
      },
    });

    // Log event
    await prisma.incidentEvent.create({
      data: {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        incidentId: id,
        eventType: 'SNOOZED',
        message: `Incident snoozed until ${suppressUntil.toISOString()}`,
        metadata: {
          snoozedBy: session.user.id,
          snoozedUntil: suppressUntil.toISOString(),
          minutes: minutes || null,
        },
      },
    });

    return NextResponse.json({
      success: true,
      suppressUntil: updated.suppressUntil,
    });
  } catch (error) {
    console.error('Error snoozing incident:', error);
    return NextResponse.json(
      { error: 'Failed to snooze incident' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/incidents/[id]/snooze
 * Unsnooze an incident (remove suppression)
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

    // Get incident and check permissions
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        Monitor: {
          select: {
            orgId: true,
          },
        },
      },
    });

    if (!incident) {
      return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
    }

    // Check org access
    const hasAccess = await hasOrgAccess(session.user.id, incident.Monitor.orgId);
    
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove suppression
    await prisma.incident.update({
      where: { id },
      data: {
        suppressUntil: null,
      },
    });

    // Log event
    await prisma.incidentEvent.create({
      data: {
        id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        incidentId: id,
        eventType: 'UNSNOOZED',
        message: 'Incident unsnoo zed',
        metadata: {
          unsnoozedBy: session.user.id,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsnoozing incident:', error);
    return NextResponse.json(
      { error: 'Failed to unsnooze incident' },
      { status: 500 }
    );
  }
}

