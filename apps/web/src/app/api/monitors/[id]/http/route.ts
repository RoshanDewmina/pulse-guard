import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@tokiflow/db';
import { authOptions, hasOrgAccess, isOrgAdmin } from '@/lib/auth';
import { z } from 'zod';

const updateHttpConfigSchema = z.object({
  monitorType: z.enum(['HEARTBEAT', 'HTTP_CHECK']).optional(),
  httpMethod: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).optional(),
  httpHeaders: z.record(z.string()).optional(),
  httpBody: z.string().optional(),
  expectedStatusCode: z.number().int().min(100).max(599).optional(),
  responseAssertions: z.array(z.object({
    type: z.enum(['status_code', 'response_time', 'body_contains', 'body_not_contains', 'header_contains', 'json_path']),
    value: z.string(),
    operator: z.enum(['equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'regex']).optional(),
  })).optional(),
  responseTimeSla: z.number().int().min(100).optional(),
});

/**
 * PATCH /api/monitors/[id]/http
 * Update HTTP monitoring configuration for a monitor
 */
export async function PATCH(
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
    const validatedData = updateHttpConfigSchema.parse(body);

    // Get monitor and check permissions
    const monitor = await prisma.monitor.findUnique({
      where: { id },
      select: {
        orgId: true,
        monitorType: true,
        httpMethod: true,
        httpHeaders: true,
        httpBody: true,
        expectedStatusCode: true,
        responseAssertions: true,
        responseTimeSla: true,
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

    // Prepare updates
    const updates: any = {};

    if (validatedData.monitorType !== undefined) {
      updates.monitorType = validatedData.monitorType;
    }

    if (validatedData.httpMethod !== undefined) {
      updates.httpMethod = validatedData.httpMethod;
    }

    if (validatedData.httpHeaders !== undefined) {
      updates.httpHeaders = validatedData.httpHeaders;
    }

    if (validatedData.httpBody !== undefined) {
      updates.httpBody = validatedData.httpBody;
    }

    if (validatedData.expectedStatusCode !== undefined) {
      updates.expectedStatusCode = validatedData.expectedStatusCode;
    }

    if (validatedData.responseAssertions !== undefined) {
      updates.responseAssertions = validatedData.responseAssertions;
    }

    if (validatedData.responseTimeSla !== undefined) {
      updates.responseTimeSla = validatedData.responseTimeSla;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No valid HTTP configuration provided' },
        { status: 400 }
      );
    }

    // Update monitor
    const updated = await prisma.monitor.update({
      where: { id },
      data: updates,
      select: {
        monitorType: true,
        httpMethod: true,
        httpHeaders: true,
        httpBody: true,
        expectedStatusCode: true,
        responseAssertions: true,
        responseTimeSla: true,
      },
    });

    return NextResponse.json({
      success: true,
      ...updated,
    });
  } catch (error) {
    console.error('Error updating HTTP configuration:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Failed to update HTTP configuration' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/monitors/[id]/http
 * Get current HTTP monitoring configuration for a monitor
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
        monitorType: true,
        httpMethod: true,
        httpHeaders: true,
        httpBody: true,
        expectedStatusCode: true,
        responseAssertions: true,
        responseTimeSla: true,
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
      monitorType: monitor.monitorType,
      httpMethod: monitor.httpMethod,
      httpHeaders: monitor.httpHeaders,
      httpBody: monitor.httpBody,
      expectedStatusCode: monitor.expectedStatusCode,
      responseAssertions: monitor.responseAssertions,
      responseTimeSla: monitor.responseTimeSla,
    });
  } catch (error) {
    console.error('Error fetching HTTP configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch HTTP configuration' },
      { status: 500 }
    );
  }
}
