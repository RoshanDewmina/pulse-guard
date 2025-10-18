import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

const updateStatusPageSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  isPublic: z.boolean().optional(),
  customDomain: z.string().nullable().optional(),
  components: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    monitorIds: z.array(z.string()),
  })).optional(),
  theme: z.object({
    primaryColor: z.string().optional(),
    backgroundColor: z.string().optional(),
    textColor: z.string().optional(),
    logoUrl: z.string().nullable().optional(),
  }).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const statusPage = await prisma.statusPage.findUnique({
      where: { id },
      include: {
        Org: {
          include: {
            Membership: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!statusPage) {
      return NextResponse.json({ error: 'Status page not found' }, { status: 404 });
    }

    // Check if user has access
    if (statusPage.Org.Membership.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(statusPage);
  } catch (error) {
    console.error('Failed to fetch status page:', error);
    return NextResponse.json(
      { error: 'Failed to fetch status page' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const statusPage = await prisma.statusPage.findUnique({
      where: { id },
      include: {
        Org: {
          include: {
            Membership: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!statusPage) {
      return NextResponse.json({ error: 'Status page not found' }, { status: 404 });
    }

    // Check if user has access and is not a viewer
    const membership = statusPage.Org.Membership[0];
    if (!membership || membership.role === 'VIEWER' as any) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = updateStatusPageSchema.parse(body);

    // Check plan limits for custom domains
    if (validatedData.customDomain) {
      const org = await prisma.org.findUnique({
        where: { id: statusPage.orgId },
        include: {
          SubscriptionPlan: true,
        },
      });

      if (!org?.SubscriptionPlan) {
        return NextResponse.json({ error: 'No subscription plan found' }, { status: 404 });
      }

      if (!org.SubscriptionPlan.allowsCustomDomains) {
        return NextResponse.json(
          { error: 'Custom domains require Business plan or higher. Please upgrade your plan.' },
          { status: 403 }
        );
      }
    }

    const updatedStatusPage = await prisma.statusPage.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.isPublic !== undefined && { isPublic: validatedData.isPublic }),
        ...(validatedData.customDomain !== undefined && { customDomain: validatedData.customDomain }),
        ...(validatedData.components && { components: validatedData.components as any }),
        ...(validatedData.theme && { theme: validatedData.theme as any }),
      },
    });

    return NextResponse.json(updatedStatusPage);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Failed to update status page:', error);
    return NextResponse.json(
      { error: 'Failed to update status page' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const statusPage = await prisma.statusPage.findUnique({
      where: { id },
      include: {
        Org: {
          include: {
            Membership: {
              where: { userId: session.user.id },
            },
          },
        },
      },
    });

    if (!statusPage) {
      return NextResponse.json({ error: 'Status page not found' }, { status: 404 });
    }

    // Check if user is admin or owner
    const membership = statusPage.Org.Membership[0];
    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.statusPage.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete status page:', error);
    return NextResponse.json(
      { error: 'Failed to delete status page' },
      { status: 500 }
    );
  }
}

