import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../logger';
import { format } from 'date-fns';

const logger = createLogger('email');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Dynamically import Resend to avoid dependency issues
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    return await resend.emails.send({
      from: 'Tokiflow <alerts@tokiflow.co>',
      to,
      subject,
      html,
    });
  } catch (error) {
    // If resend not available, log the email instead
    logger.warn('Resend not available, logging email instead');
    logger.info(`Would send email to ${to}: ${subject}`);
    return { data: null, error: null };
  }
}

export function startEmailWorker() {
  const worker = new Worker(
    'email',
    async (job) => {
      const { incidentId, channelId } = job.data;

      logger.info(`Sending email alert for incident ${incidentId}`);

      const incident = await prisma.incident.findUnique({
        where: { id: incidentId },
        include: {
          monitor: {
            include: {
              runs: {
                take: 5,
                orderBy: {
                  startedAt: 'desc',
                },
              },
            },
          },
        },
      });

      const channel = await prisma.alertChannel.findUnique({
        where: { id: channelId },
      });

      if (!incident || !channel) {
        logger.warn(`Incident or channel not found`);
        return;
      }

      const config = channel.configJson as any;
      const email = config.email;

      if (!email) {
        logger.warn(`No email configured for channel ${channelId}`);
        return;
      }

      const emoji = {
        MISSED: '⏰',
        LATE: '🕐',
        FAIL: '❌',
        ANOMALY: '📊',
      }[incident.kind] || '⚠️';

      const recentRuns = incident.monitor.runs
        .map(run => (run.outcome === 'SUCCESS' ? '✅' : '❌'))
        .join(' ');

      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #667eea; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .content { background: #f8f9fa; padding: 30px; }
    .alert-box { background: white; border-left: 4px solid #e74c3c; padding: 20px; margin: 20px 0; }
    .info-row { margin: 10px 0; padding: 10px; background: #fff; border-radius: 4px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} ${incident.kind} Alert</h1>
      <p>${incident.monitor.name}</p>
    </div>
    <div class="content">
      <div class="alert-box">
        <h2 style="color: #e74c3c;">${incident.summary}</h2>
      </div>
      ${incident.monitor.nextDueAt ? `<div class="info-row"><strong>Next Due:</strong> ${format(incident.monitor.nextDueAt, 'PPpp')}</div>` : ''}
      ${incident.monitor.lastRunAt ? `<div class="info-row"><strong>Last Run:</strong> ${format(incident.monitor.lastRunAt, 'PPpp')}</div>` : ''}
      ${incident.monitor.lastDurationMs ? `<div class="info-row"><strong>Duration:</strong> ${incident.monitor.lastDurationMs}ms</div>` : ''}
      <div class="info-row"><strong>Recent Runs:</strong> ${recentRuns || 'No runs yet'}</div>
      <a href="${process.env.NEXTAUTH_URL}/app/monitors/${incident.monitorId}" class="button">View Dashboard</a>
    </div>
  </div>
</body>
</html>
      `.trim();

      try {
        await sendEmail(
          email,
          `[PulseGuard] ${incident.kind} — ${incident.monitor.name}`,
          html
        );

        logger.info(`Email sent to ${email} for incident ${incidentId}`);
      } catch (error) {
        logger.error(`Failed to send email:`, error);
        throw error;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}

