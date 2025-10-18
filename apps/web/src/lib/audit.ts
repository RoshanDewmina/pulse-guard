import { prisma } from '@tokiflow/db';
import crypto from 'crypto';

/**
 * Audit log actions for GDPR and security compliance
 */
export enum AuditAction {
  // User actions
  USER_CREATED = 'user.created',
  USER_DELETED = 'user.deleted',
  USER_DATA_EXPORTED = 'user.data_exported',
  USER_DATA_EXPORT_DOWNLOADED = 'user.data_export_downloaded',

  // API key actions
  API_KEY_CREATED = 'api_key.created',
  API_KEY_REVOKED = 'api_key.revoked',
  API_KEY_USED = 'api_key.used',

  // Organization actions
  ORG_CREATED = 'org.created',
  ORG_DELETED = 'org.deleted',
  ORG_MEMBER_ADDED = 'org.member_added',
  ORG_MEMBER_REMOVED = 'org.member_removed',
  ORG_MEMBER_ROLE_CHANGED = 'org.member_role_changed',

  // Monitor actions
  MONITOR_CREATED = 'monitor.created',
  MONITOR_DELETED = 'monitor.deleted',
  MONITOR_UPDATED = 'monitor.updated',

  // Security actions
  LOGIN_SUCCESS = 'auth.login_success',
  LOGIN_FAILED = 'auth.login_failed',
  LOGOUT = 'auth.logout',
  PASSWORD_CHANGED = 'auth.password_changed',
  PASSWORD_RESET = 'auth.password_reset',
}

export interface AuditLogOptions {
  action: AuditAction | string;
  orgId: string;
  userId?: string;
  targetId?: string;
  meta?: Record<string, any>;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  action,
  orgId,
  userId,
  targetId,
  meta,
}: AuditLogOptions): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        id: crypto.randomUUID(),
        action,
        orgId,
        userId: userId || null,
        targetId: targetId || null,
        meta: meta || undefined,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    // Don't fail the main operation if audit logging fails
    // But log the error for monitoring
    console.error('Failed to create audit log:', error);
  }
}

/**
 * Get audit logs for an organization
 */
export async function getAuditLogs(
  orgId: string,
  options?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  const { limit = 100, offset = 0, userId, action, startDate, endDate } = options || {};

  return prisma.auditLog.findMany({
    where: {
      orgId,
      ...(userId && { userId }),
      ...(action && { action }),
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate && { gte: startDate }),
              ...(endDate && { lte: endDate }),
            },
          }
        : {}),
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
    skip: offset,
    include: {
      User: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get audit logs for a specific user (for GDPR data export)
 */
export async function getUserAuditLogs(userId: string, orgId?: string) {
  return prisma.auditLog.findMany({
    where: {
      userId,
      ...(orgId && { orgId }),
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      action: true,
      targetId: true,
      meta: true,
      createdAt: true,
      orgId: true,
    },
  });
}

/**
 * Clean up old audit logs (for data retention policies)
 * Keeps logs for 90 days by default
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

