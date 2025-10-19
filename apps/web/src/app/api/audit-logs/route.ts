import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions, hasOrgAccess, isOrgAdmin } from '@/lib/auth';
import { prisma } from '@tokiflow/db';
import { z } from 'zod';

export const runtime = 'nodejs';

const auditLogQuerySchema = z.object({
  orgId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(1000).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  action: z.string().optional(),
  userId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  format: z.enum(['json', 'csv']).default('json'),
});

// GET /api/audit-logs - List audit logs for user's organization
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = auditLogQuerySchema.parse({
      orgId: searchParams.get('orgId'),
      limit: searchParams.get('limit'),
      offset: searchParams.get('offset'),
      action: searchParams.get('action'),
      userId: searchParams.get('userId'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      format: searchParams.get('format'),
    });

    // Verify user has access to this org
    const hasAccess = await hasOrgAccess(session.user.id, query.orgId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Build where clause
    const where: any = {
      orgId: query.orgId,
    };

    if (query.action) {
      where.action = query.action;
    }

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Fetch audit logs
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: query.limit,
        skip: query.offset,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Handle CSV export
    if (query.format === 'csv') {
      const csvHeaders = [
        'Timestamp',
        'User',
        'User Email',
        'Action',
        'Target ID',
        'Metadata',
        'Organization ID'
      ];

      const csvRows = logs.map(log => [
        log.createdAt.toISOString(),
        log.User?.name || 'System',
        log.User?.email || '',
        log.action,
        log.targetId || '',
        log.meta ? JSON.stringify(log.meta) : '',
        log.orgId
      ]);

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({
      logs,
      total,
      limit: query.limit,
      offset: query.offset,
      hasMore: query.offset + query.limit < total,
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid query parameters', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


