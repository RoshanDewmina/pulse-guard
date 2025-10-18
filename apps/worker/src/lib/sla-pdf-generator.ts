import type { SlaReportData } from './sla-report-generator';
import { format } from 'date-fns';

/**
 * Generate HTML report (can be converted to PDF with tools like Puppeteer or WeasyPrint)
 */
export function generateHtmlReport(reportData: SlaReportData): string {
  const {
    name,
    period,
    startDate,
    endDate,
    uptimePercentage,
    totalChecks,
    successfulChecks,
    failedChecks,
    totalDowntimeMs,
    mttr,
    mtbf,
    incidentCount,
    averageResponseTime,
    p95ResponseTime,
    p99ResponseTime,
    data,
  } = reportData;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      padding: 40px;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1 {
      color: #1a1a1a;
      font-size: 32px;
      margin-bottom: 10px;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 10px;
    }
    h2 {
      color: #1a1a1a;
      font-size: 24px;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 8px;
    }
    h3 {
      color: #1a1a1a;
      font-size: 18px;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    .report-header {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .report-meta {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 20px;
    }
    .meta-item {
      flex: 1;
      min-width: 200px;
    }
    .meta-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-value {
      font-size: 16px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin: 30px 0;
    }
    .stat-card {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
    }
    .stat-value {
      font-size: 36px;
      font-weight: 700;
      color: #0066cc;
      margin-bottom: 5px;
    }
    .stat-value.success { color: #22c55e; }
    .stat-value.warning { color: #f59e0b; }
    .stat-value.danger { color: #ef4444; }
    .stat-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      background: white;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #1a1a1a;
      text-transform: uppercase;
      font-size: 12px;
      letter-spacing: 0.5px;
    }
    tr:hover {
      background: #f8f9fa;
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge.success { background: #dcfce7; color: #166534; }
    .badge.danger { background: #fee2e2; color: #991b1b; }
    .badge.warning { background: #fef3c7; color: #92400e; }
    .uptime-bar {
      width: 100%;
      height: 40px;
      background: #fee2e2;
      border-radius: 8px;
      overflow: hidden;
      position: relative;
    }
    .uptime-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #16a34a);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="report-header">
    <h1>${name}</h1>
    <div class="report-meta">
      <div class="meta-item">
        <div class="meta-label">Report Period</div>
        <div class="meta-value">${period}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Date Range</div>
        <div class="meta-value">${format(new Date(startDate), 'MMM d, yyyy')} - ${format(new Date(endDate), 'MMM d, yyyy')}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">Generated</div>
        <div class="meta-value">${format(new Date(), 'MMM d, yyyy HH:mm')}</div>
      </div>
    </div>
  </div>

  <h2>Overall Performance</h2>
  
  <div style="margin: 20px 0;">
    <div class="uptime-bar">
      <div class="uptime-fill" style="width: ${uptimePercentage.toFixed(2)}%">
        ${uptimePercentage.toFixed(2)}% Uptime
      </div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value success">${successfulChecks.toLocaleString()}</div>
      <div class="stat-label">Successful Checks</div>
    </div>
    <div class="stat-card">
      <div class="stat-value danger">${failedChecks.toLocaleString()}</div>
      <div class="stat-label">Failed Checks</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${totalChecks.toLocaleString()}</div>
      <div class="stat-label">Total Checks</div>
    </div>
    <div class="stat-card">
      <div class="stat-value warning">${incidentCount.toLocaleString()}</div>
      <div class="stat-label">Incidents</div>
    </div>
  </div>

  ${averageResponseTime ? `
  <h3>Response Time Metrics</h3>
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${averageResponseTime.toFixed(0)}ms</div>
      <div class="stat-label">Average</div>
    </div>
    ${p95ResponseTime ? `
    <div class="stat-card">
      <div class="stat-value">${p95ResponseTime.toFixed(0)}ms</div>
      <div class="stat-label">95th Percentile</div>
    </div>
    ` : ''}
    ${p99ResponseTime ? `
    <div class="stat-card">
      <div class="stat-value">${p99ResponseTime.toFixed(0)}ms</div>
      <div class="stat-label">99th Percentile</div>
    </div>
    ` : ''}
  </div>
  ` : ''}

  ${mttr !== undefined || mtbf !== undefined ? `
  <h3>Reliability Metrics</h3>
  <div class="stats-grid">
    ${mttr !== undefined ? `
    <div class="stat-card">
      <div class="stat-value">${formatDuration(mttr)}</div>
      <div class="stat-label">MTTR (Mean Time To Recovery)</div>
    </div>
    ` : ''}
    ${mtbf !== undefined ? `
    <div class="stat-card">
      <div class="stat-value">${formatDuration(mtbf)}</div>
      <div class="stat-label">MTBF (Mean Time Between Failures)</div>
    </div>
    ` : ''}
    <div class="stat-card">
      <div class="stat-value">${formatDuration(totalDowntimeMs)}</div>
      <div class="stat-label">Total Downtime</div>
    </div>
  </div>
  ` : ''}

  ${data.monitors && data.monitors.length > 0 ? `
  <h2>Monitor Summary</h2>
  <table>
    <thead>
      <tr>
        <th>Monitor</th>
        <th>Uptime</th>
        <th>Checks</th>
        <th>Failed</th>
        <th>Avg Response</th>
        <th>Incidents</th>
      </tr>
    </thead>
    <tbody>
      ${data.monitors.map((monitor) => `
      <tr>
        <td><strong>${monitor.name}</strong></td>
        <td>
          <span class="badge ${monitor.uptimePercentage >= 99.9 ? 'success' : monitor.uptimePercentage >= 99 ? 'warning' : 'danger'}">
            ${monitor.uptimePercentage.toFixed(2)}%
          </span>
        </td>
        <td>${monitor.totalChecks.toLocaleString()}</td>
        <td>${monitor.failedChecks.toLocaleString()}</td>
        <td>${monitor.averageResponseTime ? `${monitor.averageResponseTime.toFixed(0)}ms` : 'N/A'}</td>
        <td>${monitor.incidents}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  ` : ''}

  ${data.incidents.length > 0 ? `
  <h2>Incidents (${data.incidents.length})</h2>
  <table>
    <thead>
      <tr>
        <th>Monitor</th>
        <th>Type</th>
        <th>Opened</th>
        <th>Duration</th>
        <th>Summary</th>
      </tr>
    </thead>
    <tbody>
      ${data.incidents.slice(0, 20).map((incident) => `
      <tr>
        <td>${incident.monitorName}</td>
        <td><span class="badge warning">${incident.kind}</span></td>
        <td>${format(new Date(incident.openedAt), 'MMM d, HH:mm')}</td>
        <td>${incident.durationMs ? formatDuration(incident.durationMs) : 'Ongoing'}</td>
        <td>${incident.summary}</td>
      </tr>
      `).join('')}
      ${data.incidents.length > 20 ? `
      <tr>
        <td colspan="5" style="text-align: center; color: #666;">
          ... and ${data.incidents.length - 20} more incidents
        </td>
      </tr>
      ` : ''}
    </tbody>
  </table>
  ` : `
  <h2>Incidents</h2>
  <p style="text-align: center; color: #666; padding: 40px 0;">No incidents during this period 🎉</p>
  `}

  <div class="footer">
    <p>Generated by PulseGuard SLA Reporting</p>
    <p>Report ID: ${reportData.orgId}-${Date.now()}</p>
  </div>
</body>
</html>
  `.trim();

  return html;
}

/**
 * Format duration in milliseconds to human-readable string
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    return `${seconds}s`;
  }
}

