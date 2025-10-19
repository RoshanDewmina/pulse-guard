import { prisma } from '@tokiflow/db';
import crypto from 'crypto';

/**
 * Audit log actions for GDPR and security compliance
 */
export enum AuditAction {
  // User actions
  USER_CREATED = 'user.created',
  USER_DELETED = 'user.deleted',
  USER_UPDATED = 'user.updated',
  USER_DATA_EXPORTED = 'user.data_exported',
  USER_DATA_EXPORT_DOWNLOADED = 'user.data_export_downloaded',
  USER_PROFILE_UPDATED = 'user.profile_updated',

  // Authentication & Security
  LOGIN_SUCCESS = 'auth.login_success',
  LOGIN_FAILED = 'auth.login_failed',
  LOGOUT = 'auth.logout',
  PASSWORD_CHANGED = 'auth.password_changed',
  PASSWORD_RESET = 'auth.password_reset',
  MFA_ENABLED = 'auth.mfa_enabled',
  MFA_DISABLED = 'auth.mfa_disabled',
  MFA_VERIFIED = 'auth.mfa_verified',
  MFA_BACKUP_CODES_GENERATED = 'auth.mfa_backup_codes_generated',
  MFA_BACKUP_CODES_REGENERATED = 'auth.mfa_backup_codes_regenerated',

  // API key actions
  API_KEY_CREATED = 'api_key.created',
  API_KEY_REVOKED = 'api_key.revoked',
  API_KEY_USED = 'api_key.used',
  API_KEY_UPDATED = 'api_key.updated',

  // Organization actions
  ORG_CREATED = 'org.created',
  ORG_DELETED = 'org.deleted',
  ORG_UPDATED = 'org.updated',
  ORG_MEMBER_ADDED = 'org.member_added',
  ORG_MEMBER_REMOVED = 'org.member_removed',
  ORG_MEMBER_ROLE_CHANGED = 'org.member_role_changed',
  ORG_SWITCHED = 'org.switched',

  // Monitor actions
  MONITOR_CREATED = 'monitor.created',
  MONITOR_DELETED = 'monitor.deleted',
  MONITOR_UPDATED = 'monitor.updated',
  MONITOR_PAUSED = 'monitor.paused',
  MONITOR_RESUMED = 'monitor.resumed',
  MONITOR_ANOMALY_THRESHOLD_UPDATED = 'monitor.anomaly_threshold_updated',
  MONITOR_HTTP_CONFIG_UPDATED = 'monitor.http_config_updated',

  // Tag actions
  TAG_CREATED = 'tag.created',
  TAG_DELETED = 'tag.deleted',
  TAG_UPDATED = 'tag.updated',

  // Incident actions
  INCIDENT_CREATED = 'incident.created',
  INCIDENT_ACKNOWLEDGED = 'incident.acknowledged',
  INCIDENT_RESOLVED = 'incident.resolved',
  INCIDENT_SNOOZED = 'incident.snoozed',
  INCIDENT_UPDATED = 'incident.updated',

  // Status page actions
  STATUS_PAGE_CREATED = 'status_page.created',
  STATUS_PAGE_DELETED = 'status_page.deleted',
  STATUS_PAGE_UPDATED = 'status_page.updated',
  STATUS_PAGE_DOMAIN_VERIFIED = 'status_page.domain_verified',

  // Maintenance window actions
  MAINTENANCE_WINDOW_CREATED = 'maintenance_window.created',
  MAINTENANCE_WINDOW_DELETED = 'maintenance_window.deleted',
  MAINTENANCE_WINDOW_UPDATED = 'maintenance_window.updated',

  // Alert channel actions
  ALERT_CHANNEL_CREATED = 'alert_channel.created',
  ALERT_CHANNEL_DELETED = 'alert_channel.deleted',
  ALERT_CHANNEL_UPDATED = 'alert_channel.updated',
  ALERT_CHANNEL_TESTED = 'alert_channel.tested',

  // Synthetic monitoring actions
  SYNTHETIC_TEST_CREATED = 'synthetic_test.created',
  SYNTHETIC_TEST_DELETED = 'synthetic_test.deleted',
  SYNTHETIC_TEST_UPDATED = 'synthetic_test.updated',
  SYNTHETIC_TEST_RUN = 'synthetic_test.run',

  // Report actions
  REPORT_CREATED = 'report.created',
  REPORT_DELETED = 'report.deleted',
  REPORT_EXPORTED = 'report.exported',

  // Post-mortem actions
  POSTMORTEM_CREATED = 'postmortem.created',
  POSTMORTEM_DELETED = 'postmortem.deleted',
  POSTMORTEM_UPDATED = 'postmortem.updated',
  POSTMORTEM_EXPORTED = 'postmortem.exported',

  // Billing actions
  BILLING_SUBSCRIPTION_CREATED = 'billing.subscription_created',
  BILLING_SUBSCRIPTION_UPDATED = 'billing.subscription_updated',
  BILLING_SUBSCRIPTION_CANCELLED = 'billing.subscription_cancelled',
  BILLING_PAYMENT_SUCCESS = 'billing.payment_success',
  BILLING_PAYMENT_FAILED = 'billing.payment_failed',

  // System actions
  SYSTEM_BACKUP_CREATED = 'system.backup_created',
  SYSTEM_CLEANUP_RUN = 'system.cleanup_run',
  SYSTEM_MAINTENANCE_MODE_ENABLED = 'system.maintenance_mode_enabled',
  SYSTEM_MAINTENANCE_MODE_DISABLED = 'system.maintenance_mode_disabled',
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

