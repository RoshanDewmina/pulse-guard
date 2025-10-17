import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';
import crypto from 'crypto';

const createKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  expiresInDays: z.number().min(1).max(365).optional(),
});

// GET /api/api-keys - List API keys for user's organization
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
      },
      include: {
        Org: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Fetch API keys from database
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        orgId: membership.orgId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        tokenHash: true,
        lastUsedAt: true,
        createdAt: true,
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Mask the token hash (show only first 4 chars for identification)
    const maskedKeys = apiKeys.map((key) => ({
      id: key.id,
      name: key.name,
      keyPreview: key.tokenHash.substring(0, 4) + '****',
      lastUsedAt: key.lastUsedAt,
      createdAt: key.createdAt,
      createdBy: key.User.name || key.User.email,
    }));

    return NextResponse.json({ apiKeys: maskedKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/api-keys - Create new API key
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createKeySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name } = validation.data;

    // Get user's organization (must be owner/admin)
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] },
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

    // Check existing key count (rate limit: max 20 keys per org)
    const existingKeysCount = await prisma.apiKey.count({
      where: {
        orgId: membership.orgId,
      },
    });

    if (existingKeysCount >= 20) {
      return NextResponse.json(
        { error: 'Maximum number of API keys (20) reached. Delete unused keys first.' },
        { status: 429 }
      );
    }

    // Generate secure API key with prefix
    const keyId = `pk_${crypto.randomBytes(16).toString('hex')}`;
    const apiKey = `${keyId}_${crypto.randomBytes(32).toString('hex')}`;

    // Hash the key using SHA-256 for storage
    const tokenHash = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Create API key record in database
    const newKey = await prisma.apiKey.create({
      data: {
        id: keyId,
        name,
        tokenHash,
        orgId: membership.orgId,
        userId: session.user.id,
      },
      include: {
        User: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    // Return the full key ONLY once (cannot be retrieved again)
    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save this key securely - it cannot be retrieved again.',
      apiKey: {
        id: newKey.id,
        name: newKey.name,
        key: apiKey, // Full key shown only this once
        createdAt: newKey.createdAt,
        createdBy: newKey.User.name || newKey.User.email,
      },
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


