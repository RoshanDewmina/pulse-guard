import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  try {
    const result = await resend.emails.send({
      from: 'Saturn <alerts@Saturn.co>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

interface IncidentEmailData {
  monitorName: string;
  incidentKind: string;
  summary: string;
  details?: string;
  nextDueAt?: string;
  lastRunAt?: string;
  lastDuration?: string;
  lastExitCode?: number;
  recentRuns?: string[];
  dashboardUrl: string;
}

export function generateIncidentEmail(data: IncidentEmailData): string {
  const {
    monitorName,
    incidentKind,
    summary,
    details,
    nextDueAt,
    lastRunAt,
    lastDuration,
    lastExitCode,
    recentRuns,
    dashboardUrl,
  } = data;

  const emoji = {
    MISSED: '⏰',
    LATE: '🕐',
    FAIL: '❌',
    ANOMALY: '📊',
  }[incidentKind] || '⚠️';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Saturn Alert</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; }
    .alert-box { background: white; border-left: 4px solid #e74c3c; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: #fff; border-radius: 4px; }
    .info-label { font-weight: 600; color: #666; }
    .info-value { color: #333; }
    .Run { display: flex; gap: 8px; margin: 15px 0; }
    .run { width: 12px; height: 12px; border-radius: 50%; }
    .run-success { background: #27ae60; }
    .run-fail { background: #e74c3c; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .footer { text-align: center; margin-top: 30px; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${emoji} ${incidentKind} Alert</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">${monitorName}</p>
    </div>
    
    <div class="content">
      <div class="alert-box">
        <h2 style="margin-top: 0; color: #e74c3c;">${summary}</h2>
        ${details ? `<p style="color: #666;">${details}</p>` : ''}
      </div>

      ${nextDueAt ? `
      <div class="info-row">
        <span class="info-label">Next Due</span>
        <span class="info-value">${nextDueAt}</span>
      </div>` : ''}

      ${lastRunAt ? `
      <div class="info-row">
        <span class="info-label">Last Run</span>
        <span class="info-value">${lastRunAt}</span>
      </div>` : ''}

      ${lastDuration ? `
      <div class="info-row">
        <span class="info-label">Duration</span>
        <span class="info-value">${lastDuration}</span>
      </div>` : ''}

      ${lastExitCode !== undefined ? `
      <div class="info-row">
        <span class="info-label">Exit Code</span>
        <span class="info-value">${lastExitCode}</span>
      </div>` : ''}

      ${recentRuns && recentRuns.length > 0 ? `
      <div style="margin: 20px 0;">
        <p class="info-label" style="margin-bottom: 10px;">Recent Runs</p>
        <div class="runs">
          ${recentRuns.map(status => 
            `<div class="run run-${status.toLowerCase()}"></div>`
          ).join('')}
        </div>
      </div>` : ''}

      <a href="${dashboardUrl}" class="button">View Dashboard</a>

      <div class="footer">
        <p>You're receiving this alert from Saturn</p>
        <p>Manage your alert settings in the dashboard</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

