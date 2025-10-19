import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import { createLogger } from '../logger';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand } from '@aws-sdk/client-s3';

const logger = createLogger('data-export');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
});

const BUCKET_NAME = process.env.S3_BUCKET || 'saturn-outputs';

// Dynamically import Resend to avoid dependency issues
async function sendEmail(to: string, subject: string, html: string) {
  try {
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    return await resend.emails.send({
      from: process.env.FROM_EMAIL || 'Saturn <alerts@saturn.co>',
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.warn('Resend not available, logging email instead');
    logger.info(`Would send email to ${to}: ${subject}`);
    return { data: null, error: null };
  }
}

export function startDataExportWorker() {
  const worker = new Worker(
    'data-export',
    async (job) => {
      const { exportId, userId } = job.data;

      logger.info(`Processing data export ${exportId} for user ${userId}`);

      try {
        // Update status to PROCESSING
        await prisma.dataExport.update({
          where: { id: exportId },
          data: { status: 'PROCESSING' },
        });

        // Fetch complete user data (same logic as GET /api/user/export)
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            Account: {
              select: {
                provider: true,
                providerAccountId: true,
                createdAt: true,
              },
            },
            Membership: {
              include: {
                Org: {
                  select: {
                    id: true,
                    name: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        // Get monitors from all user's organizations
        const monitors = await prisma.monitor.findMany({
          where: {
            Org: {
              Membership: {
                some: {
                  userId: userId,
                },
              },
            },
          },
          select: {
            id: true,
            name: true,
            scheduleType: true,
            cronExpr: true,
            intervalSec: true,
            graceSec: true,
            timezone: true,
            MonitorTag: {
              include: {
                Tag: true,
              },
            },
            captureOutput: true,
            status: true,
            lastRunAt: true,
            lastDurationMs: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        // Get runs (limit to recent 1000 per monitor to avoid huge exports)
        const runs = await prisma.run.findMany({
          where: {
            Monitor: {
              Org: {
                Membership: {
                  some: {
                    userId: userId,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5000, // Reasonable limit for background job
          select: {
            id: true,
            monitorId: true,
            outcome: true,
            exitCode: true,
            durationMs: true,
            createdAt: true,
          },
        });

        // Get incidents
        const incidents = await prisma.incident.findMany({
          where: {
            Monitor: {
              Org: {
                Membership: {
                  some: {
                    userId: userId,
                  },
                },
              },
            },
          },
          select: {
            id: true,
            monitorId: true,
            kind: true,
            status: true,
            acknowledgedAt: true,
            resolvedAt: true,
            openedAt: true,
            summary: true,
          },
        });

        // Get alert channels
        const channels = await prisma.alertChannel.findMany({
          where: {
            Org: {
              Membership: {
                some: {
                  userId: userId,
                },
              },
            },
          },
          select: {
            id: true,
            label: true,
            type: true,
            createdAt: true,
            // Note: configJson excluded for security
          },
        });

        // Get alert rules
        const rules = await prisma.rule.findMany({
          where: {
            Org: {
              Membership: {
                some: {
                  userId: userId,
                },
              },
            },
          },
          select: {
            id: true,
            name: true,
            suppressMinutes: true,
            createdAt: true,
          },
        });

        // Get API keys
        const apiKeys = await prisma.apiKey.findMany({
          where: {
            userId: userId,
          },
          select: {
            id: true,
            name: true,
            createdAt: true,
            lastUsedAt: true,
            // Note: tokenHash excluded for security
          },
        });

        // Compile complete export data
        const exportData = {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
          accounts: user.Account,
          memberships: user.Membership.map((m) => ({
            organizationId: m.Org.id,
            organizationName: m.Org.name,
            role: m.role,
            joinedAt: m.createdAt,
          })),
          monitors: monitors,
          runs: runs,
          incidents: incidents,
          alertChannels: channels,
          alertRules: rules,
          apiKeys: apiKeys,
          exportMetadata: {
            exportId: exportId,
            exportedAt: new Date().toISOString(),
            exportedBy: user.email,
            runsLimit: 5000,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            note: 'Sensitive credentials and API keys are excluded for security',
          },
        };

        // Upload to S3
        const s3Key = `exports/${exportId}.json`;
        const exportJson = JSON.stringify(exportData, null, 2);
        const fileSize = Buffer.byteLength(exportJson, 'utf8');

        const putCommand = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: exportJson,
          ContentType: 'application/json',
          Metadata: {
            userId: userId,
            exportId: exportId,
          },
          // Set expiration for 7 days
          Expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });

        await s3Client.send(putCommand);

        logger.info(`Uploaded export to S3: ${s3Key} (${fileSize} bytes)`);

        // Generate presigned download URL (valid for 7 days)
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
        });

        const downloadUrl = await getSignedUrl(s3Client, getCommand, {
          expiresIn: 7 * 24 * 60 * 60, // 7 days
        });

        // Update export record
        await prisma.dataExport.update({
          where: { id: exportId },
          data: {
            status: 'COMPLETED',
            s3Key: s3Key,
            downloadUrl: downloadUrl,
            fileSize: fileSize,
            completedAt: new Date(),
          },
        });

        // Send email notification
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
    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border: 1px solid #dee2e6; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
    .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 Your Data Export is Ready</h1>
    </div>
    <div class="content">
      <p>Hi ${user.name || user.email},</p>
      <p>Your requested data export has been generated and is ready for download.</p>
      
      <div class="info-box">
        <p><strong>Export Details:</strong></p>
        <ul>
          <li><strong>File Size:</strong> ${(fileSize / 1024).toFixed(2)} KB</li>
          <li><strong>Monitors:</strong> ${monitors.length}</li>
          <li><strong>Runs:</strong> ${runs.length}</li>
          <li><strong>Incidents:</strong> ${incidents.length}</li>
          <li><strong>Generated:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>Expires:</strong> ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString()}</li>
        </ul>
      </div>
      
      <a href="${downloadUrl}" class="button">Download Your Data</a>
      
      <div class="warning">
        ⚠️ <strong>Important:</strong> This download link will expire in 7 days. Please download your data before then. For security reasons, sensitive credentials and API keys are not included in the export.
      </div>
      
      <p style="margin-top: 30px; color: #6c757d; font-size: 14px;">
        If you didn't request this export, please contact support immediately.
      </p>
    </div>
  </div>
</body>
</html>
        `.trim();

        await sendEmail(
          user.email!,
          '[Saturn] Your Data Export is Ready',
          html
        );

        logger.info(`Data export ${exportId} completed successfully`);

        return {
          success: true,
          exportId,
          fileSize,
          downloadUrl,
        };
      } catch (error) {
        logger.error({ err: error, exportId }, `Data export ${exportId} failed`);

        // Update export record to FAILED
        await prisma.dataExport.update({
          where: { id: exportId },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            errorMsg: error instanceof Error ? error.message : 'Unknown error',
          },
        });

        throw error;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    logger.info(`Data export job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Data export job ${job?.id} failed`);
  });

  return worker;
}

