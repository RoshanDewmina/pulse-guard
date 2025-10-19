import { Job, Worker } from 'bullmq';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../logger';
import {
  sendWelcomeEmail,
  sendMonitorReminderEmail,
  sendOnboardingReminderEmail,
  sendAlertSuggestionEmail,
} from './onboarding-emails';

const logger = createLogger('onboarding-scheduler');

/**
 * Process onboarding email job
 */
export async function processOnboardingEmailJob(job: Job): Promise<void> {
  const { userId, emailType } = job.data;

  logger.info({ userId, emailType }, 'Processing onboarding email job');

  try {
    switch (emailType) {
      case 'welcome':
        await sendWelcomeEmail(userId);
        break;
      case 'monitor_reminder':
        await sendMonitorReminderEmail(userId);
        break;
      case 'onboarding_reminder':
        await sendOnboardingReminderEmail(userId);
        break;
      case 'alert_suggestion':
        await sendAlertSuggestionEmail(userId);
        break;
      default:
        logger.warn({ emailType }, 'Unknown email type');
        throw new Error(`Unknown email type: ${emailType}`);
    }

    logger.info({ userId, emailType }, 'Onboarding email sent successfully');
  } catch (error) {
    logger.error({ userId, emailType, error }, 'Failed to send onboarding email');
    throw error;
  }
}

/**
 * Schedule onboarding emails for new user
 */
export async function scheduleOnboardingEmails(userId: string): Promise<void> {
  const { onboardingQueue } = await import('../queues');

  try {
    // Schedule welcome email immediately
    await onboardingQueue.add(
      'welcome-email',
      { userId, emailType: 'welcome' },
      { delay: 0 }
    );

    // Schedule monitor reminder after 3 days
    await onboardingQueue.add(
      'monitor-reminder',
      { userId, emailType: 'monitor_reminder' },
      { delay: 3 * 24 * 60 * 60 * 1000 } // 3 days
    );

    // Schedule onboarding reminder after 7 days
    await onboardingQueue.add(
      'onboarding-reminder',
      { userId, emailType: 'onboarding_reminder' },
      { delay: 7 * 24 * 60 * 60 * 1000 } // 7 days
    );

    // Schedule alert suggestion after 14 days
    await onboardingQueue.add(
      'alert-suggestion',
      { userId, emailType: 'alert_suggestion' },
      { delay: 14 * 24 * 60 * 60 * 1000 } // 14 days
    );

    logger.info({ userId }, 'Onboarding emails scheduled');
  } catch (error) {
    logger.error({ userId, error }, 'Failed to schedule onboarding emails');
    throw error;
  }
}

/**
 * Cancel onboarding emails for user
 */
export async function cancelOnboardingEmails(userId: string): Promise<void> {
  const { onboardingQueue } = await import('../queues');

  try {
    // Remove all pending onboarding emails for this user
    const jobs = await onboardingQueue.getJobs(['waiting', 'delayed']);
    
    for (const job of jobs) {
      if (job.data.userId === userId) {
        await job.remove();
        logger.info({ userId, jobId: job.id }, 'Cancelled onboarding email job');
      }
    }

    logger.info({ userId }, 'Onboarding emails cancelled');
  } catch (error) {
    logger.error({ userId, error }, 'Failed to cancel onboarding emails');
    throw error;
  }
}

/**
 * Reschedule onboarding emails based on user activity
 */
export async function rescheduleOnboardingEmails(userId: string): Promise<void> {
  try {
    // Cancel existing emails
    await cancelOnboardingEmails(userId);

    // Check if user has completed onboarding
    const user = await prisma.user.findUnique({
      where: { id: userId },
    include: {
      Membership: {
        include: {
          Org: {
            include: {
              Monitor: true,
              AlertChannel: true,
            },
          },
        },
      },
    },
    });

    if (!user || !user.Membership[0]?.Org) {
      logger.warn({ userId }, 'User or organization not found for rescheduling');
      return;
    }

    const org = user.Membership[0]?.Org;
    const hasMonitors = org.monitors.length > 0;
    const hasAlerts = org.alertChannels.length > 0;
    const hasMfa = user.mfaEnabled;

    // If user has completed most onboarding steps, don't send reminder emails
    const completedSteps = [hasMonitors, hasAlerts, hasMfa].filter(Boolean).length;
    if (completedSteps >= 2) {
      logger.info({ userId, completedSteps }, 'User has good onboarding progress, skipping reminder emails');
      return;
    }

    // Reschedule based on current progress
    if (!hasMonitors) {
      // Schedule monitor reminder in 1 day
      const { onboardingQueue } = await import('../queues');
      await onboardingQueue.add(
        'monitor-reminder',
        { userId, emailType: 'monitor_reminder' },
        { delay: 1 * 24 * 60 * 60 * 1000 } // 1 day
      );
    }

    if (hasMonitors && !hasAlerts) {
      // Schedule alert suggestion in 3 days
      const { onboardingQueue } = await import('../queues');
      await onboardingQueue.add(
        'alert-suggestion',
        { userId, emailType: 'alert_suggestion' },
        { delay: 3 * 24 * 60 * 60 * 1000 } // 3 days
      );
    }

    logger.info({ userId, hasMonitors, hasAlerts, hasMfa }, 'Onboarding emails rescheduled based on progress');
  } catch (error) {
    logger.error({ userId, error }, 'Failed to reschedule onboarding emails');
    throw error;
  }
}

/**
 * Clean up old onboarding email jobs
 */
export async function cleanupOnboardingEmails(): Promise<void> {
  const { onboardingQueue } = await import('../queues');

  try {
    // Remove completed jobs older than 30 days
    const completedJobs = await onboardingQueue.getJobs(['completed']);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    for (const job of completedJobs) {
      if (job.timestamp < thirtyDaysAgo) {
        await job.remove();
        logger.info({ jobId: job.id }, 'Removed old completed onboarding email job');
      }
    }

    // Remove failed jobs older than 7 days
    const failedJobs = await onboardingQueue.getJobs(['failed']);
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    for (const job of failedJobs) {
      if (job.timestamp < sevenDaysAgo) {
        await job.remove();
        logger.info({ jobId: job.id }, 'Removed old failed onboarding email job');
      }
    }

    logger.info('Onboarding email cleanup completed');
  } catch (error) {
    logger.error({ error }, 'Failed to cleanup onboarding emails');
    throw error;
  }
}

/**
 * Get onboarding email statistics
 */
export async function getOnboardingEmailStats(): Promise<{
  totalJobs: number;
  completedJobs: number;
  failedJobs: number;
  waitingJobs: number;
  delayedJobs: number;
}> {
  const { onboardingQueue } = await import('../queues');

  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      onboardingQueue.getJobs(['waiting']),
      onboardingQueue.getJobs(['active']),
      onboardingQueue.getJobs(['completed']),
      onboardingQueue.getJobs(['failed']),
      onboardingQueue.getJobs(['delayed']),
    ]);

    return {
      totalJobs: waiting.length + active.length + completed.length + failed.length + delayed.length,
      completedJobs: completed.length,
      failedJobs: failed.length,
      waitingJobs: waiting.length,
      delayedJobs: delayed.length,
    };
  } catch (error) {
    logger.error({ error }, 'Failed to get onboarding email stats');
    throw error;
  }
}
