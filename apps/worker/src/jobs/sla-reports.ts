import { Worker, Queue, Job } from 'bullmq';
import { prisma } from '@tokiflow/db';
import { uploadToS3, getSignedUrl, slaReportQueue } from '@tokiflow/shared';
import { generateSlaReport } from '../lib/sla-report-generator';
import { generateHtmlReport } from '../lib/sla-pdf-generator';
import { createLogger } from '../logger';

const logger = createLogger('sla-reports');

interface GenerateReportJobData {
  orgId: string;
  monitorId?: string;
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
  generatedBy?: string;
}

/**
 * Process SLA report generation job
 */
export async function processSlaReportJob(job: Job<GenerateReportJobData>): Promise<void> {
  const { orgId, monitorId, period, startDate, endDate, generatedBy } = job.data;

  logger.info({ jobId: job.id, orgId, monitorId, period }, 'Processing SLA report generation');

  try {
    // Generate report data
    const reportData = await generateSlaReport(
      orgId,
      monitorId,
      period,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      generatedBy
    );

    logger.info({ reportData: { ...reportData, data: undefined } }, 'Report data generated');

    // Generate HTML
    const html = generateHtmlReport(reportData);

    // Upload HTML to S3
    const s3Key = `reports/${orgId}/${Date.now()}-${period.toLowerCase()}.html`;
    await uploadToS3(s3Key, Buffer.from(html, 'utf-8'), 'text/html');

    // Generate presigned URL (valid for 7 days)
    const pdfUrl = await getSignedUrl(s3Key, 7 * 24 * 60 * 60); // 7 days

    logger.info({ s3Key, pdfUrl }, 'Report uploaded to S3');

    // Save report to database
    const report = await prisma.slaReport.create({
      data: {
        orgId: reportData.orgId,
        monitorId: reportData.monitorId || null,
        name: reportData.name,
        period: reportData.period as any,
        startDate: reportData.startDate,
        endDate: reportData.endDate,
        generatedBy: reportData.generatedBy || null,
        uptimePercentage: reportData.uptimePercentage,
        totalChecks: reportData.totalChecks,
        successfulChecks: reportData.successfulChecks,
        failedChecks: reportData.failedChecks,
        totalDowntimeMs: reportData.totalDowntimeMs,
        mttr: reportData.mttr ? Math.floor(reportData.mttr) : null,
        mtbf: reportData.mtbf ? Math.floor(reportData.mtbf) : null,
        incidentCount: reportData.incidentCount,
        averageResponseTime: reportData.averageResponseTime || null,
        p95ResponseTime: reportData.p95ResponseTime || null,
        p99ResponseTime: reportData.p99ResponseTime || null,
        data: JSON.parse(JSON.stringify(reportData.data)),
        pdfUrl,
      },
    });

    logger.info(
      { jobId: job.id, reportId: report.id },
      'SLA report generated and saved successfully'
    );
  } catch (error: any) {
    logger.error(
      { err: error, jobId: job.id, orgId, monitorId, period },
      'Failed to generate SLA report'
    );
    throw error;
  }
}

/**
 * Start the SLA report worker
 */
export function startSlaReportWorker(): Worker {
  const { redisConnection } = require('@tokiflow/shared');
  const worker = new Worker('sla-reports', processSlaReportJob, {
    connection: redisConnection,
    concurrency: 2, // Generate up to 2 reports concurrently
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'SLA report job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'SLA report job failed');
  });

  return worker;
}

