import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';
import crypto from 'crypto';
import { sendEmail } from '@/lib/email';

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
        Org: true,
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
        User: {
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

    // Generate secure invitation token (JWT-like)
    const inviteData = {
      email,
      role,
      orgId: membership.orgId,
      orgName: membership.Org.name,
      invitedBy: session.user.email,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Create signed token
    const token = Buffer.from(JSON.stringify(inviteData)).toString('base64');
    const signature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'fallback-secret')
      .update(token)
      .digest('hex');

    const inviteToken = `${token}.${signature}`;

    // Generate invitation URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/team/accept-invite?token=${encodeURIComponent(inviteToken)}`;

    // Send invitation email
    try {
      await sendEmail({
        to: email,
        subject: `You're invited to join ${membership.Org.name} on PulseGuard`,
        html: `
          <h2>You're invited!</h2>
          <p>${session.user.name || session.user.email} has invited you to join <strong>${membership.Org.name}</strong> as a ${role}.</p>
          <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#10B981;color:white;text-decoration:none;border-radius:6px;">Accept Invitation</a></p>
          <p style="color:#666;font-size:14px;">This invitation expires in 7 days.</p>
          <p style="color:#999;font-size:12px;margin-top:24px;">Or copy and paste this link: ${inviteUrl}</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      return NextResponse.json(
        { error: 'Failed to send invitation email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      invitation: {
        email,
        role,
        orgName: membership.Org.name,
        invitedBy: session.user.email,
        expiresAt: new Date(inviteData.expiresAt),
      },
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/team/invite - List pending invitations
// Note: With token-based invitations, we can't list pending invites from database
// This would require storing invitations if needed. For now, return empty array
// Organizations can track who they've invited externally if needed
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

    // Token-based invitations don't have persistent storage
    // To implement this, add an Invitation model to Prisma schema
    const invitations: any[] = [];

    return NextResponse.json({
      invitations,
      note: 'Token-based invitations are not stored. To track invitations, add an Invitation model to the database schema.',
    });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


