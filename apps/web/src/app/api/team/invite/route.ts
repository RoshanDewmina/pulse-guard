import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER'], {
    errorMap: () => ({ message: 'Role must be ADMIN or MEMBER' }),
  }),
  orgId: z.string().optional(),
});

// POST /api/team/invite - Send team invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = inviteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, role, orgId } = validation.data;

    // Get user's organization (or use provided orgId)
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        ...(orgId ? { orgId } : {}),
        role: { in: ['OWNER', 'ADMIN'] }, // Only owners/admins can invite
      },
      include: {
        org: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // Check if user already exists in org
    const existingMember = await prisma.membership.findFirst({
      where: {
        orgId: membership.orgId,
        user: {
          email,
        },
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // TODO: Create invitation record in database
    // TODO: Generate invitation token
    // TODO: Set expiration date (e.g., 7 days)
    // TODO: Send invitation email via Resend
    // TODO: Include accept/reject links
    // TODO: Track invitation status (pending/accepted/rejected/expired)

    // Placeholder response
    const invitation = {
      id: `invite_${Date.now()}`,
      email,
      role,
      orgId: membership.orgId,
      orgName: membership.org.name,
      invitedBy: session.user.email,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
    };

    console.log('TODO: Send invitation email to', email);
    console.log('TODO: Create invitation record in database');

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      invitation,
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/team/invite - List pending invitations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const orgId = searchParams.get('orgId');

    // Get user's organization
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        ...(orgId ? { orgId } : {}),
        role: { in: ['OWNER', 'ADMIN'] },
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'Organization not found or insufficient permissions' },
        { status: 404 }
      );
    }

    // TODO: Fetch pending invitations from database
    // TODO: Filter by organization
    // TODO: Include invitation metadata (sent date, expires, etc.)

    // Placeholder response
    const invitations: any[] = [];

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

