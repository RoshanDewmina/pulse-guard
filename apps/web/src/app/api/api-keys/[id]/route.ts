import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';

// DELETE /api/api-keys/:id - Revoke API key
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find the API key and verify it belongs to user's organization
    const apiKey = await prisma.apiKey.findUnique({
      where: { id },
      include: {
        Org: {
          include: {
            Membership: {
              where: {
                userId: session.user.id,
                role: { in: ['OWNER', 'ADMIN'] },
              },
            },
          },
        },
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 });
    }

    // Verify user has permission (must be owner/admin of the org)
    if (apiKey.Org.Membership.length === 0) {
      return NextResponse.json(
        { error: 'Insufficient permissions to revoke this API key' },
        { status: 403 }
      );
    }

    // Delete the API key (hard delete as we're using hashed tokens)
    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
      keyId: id,
    });
  } catch (error) {
    console.error('Error revoking API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


