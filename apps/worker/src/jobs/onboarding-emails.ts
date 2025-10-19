import { Worker } from 'bullmq';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../logger';
import { sendEmail } from './email';
import { onboardingQueue } from '../queues';

const logger = createLogger('onboarding-emails');

interface OnboardingEmailData {
  userName: string;
  orgName: string;
  dashboardUrl: string;
  monitorsUrl: string;
  settingsUrl: string;
  supportUrl: string;
}

/**
 * Check if user has completed onboarding step
 */
async function hasCompletedStep(userId: string, step: string): Promise<boolean> {
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

  if (!user) return false;

  const org = user.Membership[0]?.Org;
  if (!org) return false;

  switch (step) {
    case 'create_monitor':
      return org.monitors.length > 0;
    case 'configure_alerts':
      return org.alertChannels.length > 0;
    case 'enable_mfa':
      return user.mfaEnabled === true;
    case 'create_status_page':
      const statusPages = await prisma.statusPage.count({
        where: { orgId: org.id },
      });
      return statusPages > 0;
    default:
      return false;
  }
}

/**
 * Get onboarding progress for user
 */
async function getOnboardingProgress(userId: string): Promise<{
  completed: number;
  total: number;
  steps: Array<{ id: string; completed: boolean; name: string }>;
}> {
  const steps = [
    { id: 'create_monitor', name: 'Create your first monitor' },
    { id: 'configure_alerts', name: 'Configure alert channels' },
    { id: 'enable_mfa', name: 'Enable two-factor authentication' },
    { id: 'create_status_page', name: 'Create a status page' },
  ];

  const completedSteps = await Promise.all(
    steps.map(async (step) => ({
      ...step,
      completed: await hasCompletedStep(userId, step.id),
    }))
  );

  const completed = completedSteps.filter(step => step.completed).length;
  const total = steps.length;

  return { completed, total, steps: completedSteps };
}

/**
 * Send welcome email (Day 1)
 */
export async function sendWelcomeEmail(userId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orgs: {
          take: 1,
        },
      },
    });

    if (!user || !user.Membership[0]?.Org) {
      logger.warn({ userId }, 'User or organization not found for welcome email');
      return;
    }

    const org = user.Membership[0]?.Org;
    const data: OnboardingEmailData = {
      userName: user.name || 'there',
      orgName: org.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
      monitorsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/monitors`,
      settingsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
      supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
    };

    const subject = `Welcome to Saturn, ${data.userName}! 🚀`;
    const html = generateWelcomeEmailHTML(data);
    const text = generateWelcomeEmailText(data);

    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });

    logger.info({ userId, email: user.email }, 'Welcome email sent');
  } catch (error) {
    logger.error({ userId, error }, 'Failed to send welcome email');
  }
}

/**
 * Send monitor creation reminder (Day 3)
 */
export async function sendMonitorReminderEmail(userId: string): Promise<void> {
  try {
    const hasMonitor = await hasCompletedStep(userId, 'create_monitor');
    if (hasMonitor) {
      logger.info({ userId }, 'User already has monitors, skipping reminder');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orgs: {
          take: 1,
        },
      },
    });

    if (!user || !user.Membership[0]?.Org) {
      logger.warn({ userId }, 'User or organization not found for monitor reminder');
      return;
    }

    const org = user.Membership[0]?.Org;
    const data: OnboardingEmailData = {
      userName: user.name || 'there',
      orgName: org.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
      monitorsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/monitors`,
      settingsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
      supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
    };

    const subject = `Ready to create your first monitor? 📊`;
    const html = generateMonitorReminderEmailHTML(data);
    const text = generateMonitorReminderEmailText(data);

    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });

    logger.info({ userId, email: user.email }, 'Monitor reminder email sent');
  } catch (error) {
    logger.error({ userId, error }, 'Failed to send monitor reminder email');
  }
}

/**
 * Send onboarding completion reminder (Day 7)
 */
export async function sendOnboardingReminderEmail(userId: string): Promise<void> {
  try {
    const progress = await getOnboardingProgress(userId);
    
    // Only send if less than 50% complete
    if (progress.completed / progress.total >= 0.5) {
      logger.info({ userId, progress }, 'User has good onboarding progress, skipping reminder');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orgs: {
          take: 1,
        },
      },
    });

    if (!user || !user.Membership[0]?.Org) {
      logger.warn({ userId }, 'User or organization not found for onboarding reminder');
      return;
    }

    const org = user.Membership[0]?.Org;
    const data: OnboardingEmailData = {
      userName: user.name || 'there',
      orgName: org.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
      monitorsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/monitors`,
      settingsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
      supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
    };

    const subject = `Complete your Saturn setup in 5 minutes ⚡`;
    const html = generateOnboardingReminderEmailHTML(data, progress);
    const text = generateOnboardingReminderEmailText(data, progress);

    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });

    logger.info({ userId, email: user.email }, 'Onboarding reminder email sent');
  } catch (error) {
    logger.error({ userId, error }, 'Failed to send onboarding reminder email');
  }
}

/**
 * Send alert configuration suggestion (Day 14)
 */
export async function sendAlertSuggestionEmail(userId: string): Promise<void> {
  try {
    const hasAlerts = await hasCompletedStep(userId, 'configure_alerts');
    if (hasAlerts) {
      logger.info({ userId }, 'User already has alerts configured, skipping suggestion');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orgs: {
          take: 1,
        },
      },
    });

    if (!user || !user.Membership[0]?.Org) {
      logger.warn({ userId }, 'User or organization not found for alert suggestion');
      return;
    }

    const org = user.Membership[0]?.Org;
    const data: OnboardingEmailData = {
      userName: user.name || 'there',
      orgName: org.name,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
      monitorsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/monitors`,
      settingsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app/settings`,
      supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
    };

    const subject = `Don't miss critical incidents - Set up alerts! 🔔`;
    const html = generateAlertSuggestionEmailHTML(data);
    const text = generateAlertSuggestionEmailText(data);

    await sendEmail({
      to: user.email,
      subject,
      html,
      text,
    });

    logger.info({ userId, email: user.email }, 'Alert suggestion email sent');
  } catch (error) {
    logger.error({ userId, error }, 'Failed to send alert suggestion email');
  }
}

/**
 * Generate welcome email HTML
 */
function generateWelcomeEmailHTML(data: OnboardingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Saturn</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #2563eb; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .button:hover { background: #1d4ed8; }
        .feature { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #2563eb; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🚀 Saturn</div>
          <h1>Welcome to Saturn, ${data.userName}!</h1>
        </div>
        
        <div class="content">
          <p>Thanks for joining Saturn! You're now part of a community that never sleeps when it comes to monitoring critical systems.</p>
          
          <p>Here's what you can do with Saturn:</p>
          
          <div class="feature">
            <h3>📊 Monitor Anything</h3>
            <p>Track cron jobs, APIs, websites, and more with our powerful monitoring platform.</p>
          </div>
          
          <div class="feature">
            <h3>🔔 Smart Alerts</h3>
            <p>Get notified instantly when something goes wrong via email, Slack, SMS, and more.</p>
          </div>
          
          <div class="feature">
            <h3>📈 Beautiful Dashboards</h3>
            <p>Create stunning status pages and dashboards to keep your team informed.</p>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.monitorsUrl}" class="button">Create Your First Monitor</a>
          </p>
          
          <p>Need help getting started? Check out our <a href="${data.supportUrl}">documentation</a> or reach out to our support team.</p>
        </div>
        
        <div class="footer">
          <p>Happy monitoring!<br>The Saturn Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate welcome email text
 */
function generateWelcomeEmailText(data: OnboardingEmailData): string {
  return `
Welcome to Saturn, ${data.userName}!

Thanks for joining Saturn! You're now part of a community that never sleeps when it comes to monitoring critical systems.

Here's what you can do with Saturn:

📊 Monitor Anything
Track cron jobs, APIs, websites, and more with our powerful monitoring platform.

🔔 Smart Alerts
Get notified instantly when something goes wrong via email, Slack, SMS, and more.

📈 Beautiful Dashboards
Create stunning status pages and dashboards to keep your team informed.

Get started: ${data.monitorsUrl}

Need help? Check out our documentation: ${data.supportUrl}

Happy monitoring!
The Saturn Team
  `;
}

/**
 * Generate monitor reminder email HTML
 */
function generateMonitorReminderEmailHTML(data: OnboardingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ready to create your first monitor?</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #2563eb; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .button:hover { background: #1d4ed8; }
        .step { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; }
        .step-number { display: inline-block; background: #2563eb; color: white; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: bold; margin-right: 10px; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">📊 Saturn</div>
          <h1>Ready to create your first monitor?</h1>
        </div>
        
        <div class="content">
          <p>Hi ${data.userName},</p>
          
          <p>You've been using Saturn for a few days now, but we noticed you haven't created your first monitor yet. Let's change that!</p>
          
          <p>Creating a monitor is super easy:</p>
          
          <div class="step">
            <span class="step-number">1</span>
            <strong>Choose what to monitor</strong><br>
            Cron jobs, APIs, websites, or any HTTP endpoint
          </div>
          
          <div class="step">
            <span class="step-number">2</span>
            <strong>Set the schedule</strong><br>
            How often should we check? Every minute, hour, or custom schedule
          </div>
          
          <div class="step">
            <span class="step-number">3</span>
            <strong>Configure alerts</strong><br>
            Get notified when something goes wrong
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.monitorsUrl}" class="button">Create Your First Monitor</a>
          </p>
          
          <p>Need inspiration? Check out our <a href="${data.supportUrl}">monitoring examples</a>.</p>
        </div>
        
        <div class="footer">
          <p>Questions? Just reply to this email!<br>The Saturn Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate monitor reminder email text
 */
function generateMonitorReminderEmailText(data: OnboardingEmailData): string {
  return `
Ready to create your first monitor?

Hi ${data.userName},

You've been using Saturn for a few days now, but we noticed you haven't created your first monitor yet. Let's change that!

Creating a monitor is super easy:

1. Choose what to monitor
   Cron jobs, APIs, websites, or any HTTP endpoint

2. Set the schedule
   How often should we check? Every minute, hour, or custom schedule

3. Configure alerts
   Get notified when something goes wrong

Get started: ${data.monitorsUrl}

Need inspiration? Check out our monitoring examples: ${data.supportUrl}

Questions? Just reply to this email!
The Saturn Team
  `;
}

/**
 * Generate onboarding reminder email HTML
 */
function generateOnboardingReminderEmailHTML(data: OnboardingEmailData, progress: any): string {
  const completedSteps = progress.steps.filter((step: any) => step.completed);
  const remainingSteps = progress.steps.filter((step: any) => !step.completed);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Complete your Saturn setup</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #2563eb; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
        .progress { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .progress-bar { background: #e5e7eb; height: 8px; border-radius: 4px; overflow: hidden; }
        .progress-fill { background: #2563eb; height: 100%; width: ${(progress.completed / progress.total) * 100}%; }
        .step { margin: 15px 0; padding: 10px; border-radius: 6px; }
        .step-completed { background: #d1fae5; color: #065f46; }
        .step-pending { background: #fef3c7; color: #92400e; }
        .checkmark { color: #10b981; font-weight: bold; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .button:hover { background: #1d4ed8; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">⚡ Saturn</div>
          <h1>Complete your Saturn setup in 5 minutes</h1>
        </div>
        
        <div class="content">
          <p>Hi ${data.userName},</p>
          
          <p>You're ${progress.completed} of ${progress.total} steps away from having a fully configured monitoring setup!</p>
          
          <div class="progress">
            <div class="progress-bar">
              <div class="progress-fill"></div>
            </div>
            <p style="text-align: center; margin: 10px 0; font-weight: 500;">${progress.completed}/${progress.total} steps completed</p>
          </div>
          
          ${completedSteps.length > 0 ? `
            <h3>✅ Completed:</h3>
            ${completedSteps.map((step: any) => `
              <div class="step step-completed">
                <span class="checkmark">✓</span> ${step.name}
              </div>
            `).join('')}
          ` : ''}
          
          ${remainingSteps.length > 0 ? `
            <h3>⏳ Still to do:</h3>
            ${remainingSteps.map((step: any) => `
              <div class="step step-pending">
                ${step.name}
              </div>
            `).join('')}
          ` : ''}
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.dashboardUrl}" class="button">Complete Setup</a>
          </p>
          
          <p>Need help? Our <a href="${data.supportUrl}">support team</a> is here to help!</p>
        </div>
        
        <div class="footer">
          <p>You're almost there!<br>The Saturn Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate onboarding reminder email text
 */
function generateOnboardingReminderEmailText(data: OnboardingEmailData, progress: any): string {
  const completedSteps = progress.steps.filter((step: any) => step.completed);
  const remainingSteps = progress.steps.filter((step: any) => !step.completed);
  
  return `
Complete your Saturn setup in 5 minutes

Hi ${data.userName},

You're ${progress.completed} of ${progress.total} steps away from having a fully configured monitoring setup!

${completedSteps.length > 0 ? `
Completed:
${completedSteps.map((step: any) => `✓ ${step.name}`).join('\n')}
` : ''}

${remainingSteps.length > 0 ? `
Still to do:
${remainingSteps.map((step: any) => `• ${step.name}`).join('\n')}
` : ''}

Complete setup: ${data.dashboardUrl}

Need help? Our support team is here: ${data.supportUrl}

You're almost there!
The Saturn Team
  `;
}

/**
 * Generate alert suggestion email HTML
 */
function generateAlertSuggestionEmailHTML(data: OnboardingEmailData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Don't miss critical incidents</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: bold; color: #2563eb; }
        .content { background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
        .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; }
        .button:hover { background: #1d4ed8; }
        .alert-type { margin: 20px 0; padding: 15px; background: white; border-radius: 6px; border-left: 4px solid #2563eb; }
        .footer { text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔔 Saturn</div>
          <h1>Don't miss critical incidents!</h1>
        </div>
        
        <div class="content">
          <p>Hi ${data.userName},</p>
          
          <p>We noticed you have monitors set up (awesome! 🎉), but you haven't configured any alert channels yet. This means you won't be notified when something goes wrong.</p>
          
          <p>Here are the alert channels you can set up:</p>
          
          <div class="alert-type">
            <h3>📧 Email Alerts</h3>
            <p>Get instant notifications sent to your inbox when incidents occur.</p>
          </div>
          
          <div class="alert-type">
            <h3>💬 Slack Integration</h3>
            <p>Send alerts directly to your team's Slack channels.</p>
          </div>
          
          <div class="alert-type">
            <h3>📱 SMS Notifications</h3>
            <p>Receive critical alerts via text message for urgent issues.</p>
          </div>
          
          <div class="alert-type">
            <h3>🔗 Webhook Alerts</h3>
            <p>Integrate with any service that accepts webhook notifications.</p>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="${data.settingsUrl}" class="button">Configure Alert Channels</a>
          </p>
          
          <p>Setting up alerts takes just 2 minutes and could save you hours of downtime!</p>
        </div>
        
        <div class="footer">
          <p>Stay informed, stay ahead!<br>The Saturn Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate alert suggestion email text
 */
function generateAlertSuggestionEmailText(data: OnboardingEmailData): string {
  return `
Don't miss critical incidents!

Hi ${data.userName},

We noticed you have monitors set up (awesome! 🎉), but you haven't configured any alert channels yet. This means you won't be notified when something goes wrong.

Here are the alert channels you can set up:

📧 Email Alerts
Get instant notifications sent to your inbox when incidents occur.

💬 Slack Integration
Send alerts directly to your team's Slack channels.

📱 SMS Notifications
Receive critical alerts via text message for urgent issues.

🔗 Webhook Alerts
Integrate with any service that accepts webhook notifications.

Configure alerts: ${data.settingsUrl}

Setting up alerts takes just 2 minutes and could save you hours of downtime!

Stay informed, stay ahead!
The Saturn Team
  `;
}

/**
 * Start onboarding email worker
 */
export function startOnboardingEmailWorker(): void {
  const worker = new Worker(
    'onboarding',
    async (job) => {
      const { userId, emailType } = job.data;
      
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
          throw new Error(`Unknown email type: ${emailType}`);
      }
    },
    {
      connection: onboardingQueue.opts.connection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, userId: job.data.userId, emailType: job.data.emailType }, 'Onboarding email sent');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, userId: job?.data?.userId, emailType: job?.data?.emailType, error: err }, 'Onboarding email failed');
  });

  logger.info('Onboarding email worker started');
}
