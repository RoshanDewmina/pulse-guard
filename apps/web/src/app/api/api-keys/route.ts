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
        org: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // TODO: Fetch API keys from database
    // TODO: Filter by organization
    // TODO: Include metadata (created date, last used, expires)
    // TODO: Mask the key (show only last 4 chars)
    // TODO: Sort by creation date

    // Placeholder response
    const apiKeys = [
      {
        id: 'key_1',
        name: 'Production API',
        key: 'tk_**********************abcd',
        createdAt: new Date('2024-01-01'),
        expiresAt: null,
        lastUsedAt: new Date('2024-10-10'),
        status: 'active',
      },
      {
        id: 'key_2',
        name: 'Development API',
        key: 'tk_**********************xyz9',
        createdAt: new Date('2024-02-15'),
        expiresAt: new Date('2025-02-15'),
        lastUsedAt: null,
        status: 'active',
      },
    ];

    return NextResponse.json({ apiKeys });
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

    const { name, expiresInDays } = validation.data;

    // Get user's organization (must be owner/admin)
    const membership = await prisma.membership.findFirst({
      where: {
        userId: session.user.id,
        role: { in: ['OWNER', 'ADMIN'] },
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

    // TODO: Generate secure API key
    // TODO: Hash the key before storing
    // TODO: Create API key record in database
    // TODO: Set expiration date if provided
    // TODO: Track creation metadata
    // TODO: Enforce rate limits on API key creation

    // Generate API key (placeholder)
    const apiKey = `tk_${crypto.randomBytes(32).toString('hex')}`;

    // Calculate expiration
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const newKey = {
      id: `key_${Date.now()}`,
      name,
      key: apiKey,
      orgId: membership.orgId,
      createdBy: session.user.id,
      createdAt: new Date(),
      expiresAt,
      lastUsedAt: null,
      status: 'active',
    };

    console.log('TODO: Store API key in database (hashed)');
    console.log('TODO: Return full key only once (cannot be retrieved again)');

    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save this key securely - it cannot be retrieved again.',
      apiKey: newKey,
    });
  } catch (error) {
    console.error('Error creating API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


