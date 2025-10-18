import { Worker, Job } from 'bullmq';
import { prisma } from '@tokiflow/db';
import { syntheticMonitorQueue } from '@tokiflow/shared';
import { runSyntheticMonitor } from '../lib/synthetic-runner';
import { createLogger } from '../logger';
import crypto from 'crypto';

const logger = createLogger('synthetic-monitor');

/**
 * Process a synthetic monitor check job
 */
export async function processSyntheticMonitorJob(job: Job): Promise<void> {
  const { monitorId } = job.data;

  logger.info({ jobId: job.id, monitorId }, 'Processing synthetic monitor job');

  try {
    // Fetch monitor with plan info
    const monitor = await prisma.syntheticMonitor.findUnique({
      where: { id: monitorId },
      include: {
        Org: {
          include: {
            SubscriptionPlan: true,
          },
        },
      },
    });

    if (!monitor) {
      logger.warn({ monitorId }, 'Synthetic monitor not found');
      return;
    }

    if (!monitor.isEnabled) {
      logger.info({ monitorId }, 'Synthetic monitor is disabled, skipping');
      return;
    }

    // Check synthetic run quota
    const plan = monitor.Org.SubscriptionPlan;
    if (!plan) {
      logger.warn({ monitorId }, 'No subscription plan found');
      return;
    }

    if (plan.syntheticRunsUsed >= plan.syntheticRunsLimit) {
      logger.warn({ monitorId, used: plan.syntheticRunsUsed, limit: plan.syntheticRunsLimit }, 'Synthetic run quota exceeded');
      return;
    }

    // Increment usage counter
    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: {
        syntheticRunsUsed: {
          increment: 1,
        },
      },
    });

    // Create run record
    const run = await prisma.syntheticRun.create({
      data: {
        syntheticMonitorId: monitorId,
        status: 'RUNNING',
      },
    });

    logger.info({ runId: run.id, monitorId }, 'Created synthetic run record');

    try {
      // Execute the synthetic test
      const result = await runSyntheticMonitor(monitorId);

      // Update run with results
      await prisma.syntheticRun.update({
        where: { id: run.id },
        data: {
          status: result.status,
          completedAt: new Date(),
          durationMs: result.durationMs,
          errorMessage: result.errorMessage,
          screenshots: result.screenshots,
        },
      });

      // Create step result records
      for (const stepResult of result.stepResults) {
        await prisma.syntheticStepResult.create({
          data: {
            syntheticRunId: run.id,
            syntheticStepId: stepResult.stepId,
            status: stepResult.status,
            completedAt: new Date(),
            durationMs: stepResult.durationMs,
            errorMessage: stepResult.errorMessage,
            screenshot: stepResult.screenshot,
          },
        });
      }

      // Update monitor last run status
      await prisma.syntheticMonitor.update({
        where: { id: monitorId },
        data: {
          lastRunAt: new Date(),
          lastStatus: result.status,
        },
      });

      // Create incident if test failed
      if (result.status === 'FAILED' || result.status === 'TIMEOUT') {
        await createSyntheticIncident(monitor, run.id, result);
      } else {
        // Resolve any open incidents for this monitor
        await resolveOpenIncidents(monitor.id);
      }

      logger.info(
        {
          runId: run.id,
          monitorId,
          status: result.status,
          durationMs: result.durationMs,
        },
        'Synthetic monitor job completed'
      );
    } catch (error: any) {
      // Update run with error
      await prisma.syntheticRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          durationMs: Date.now() - run.startedAt.getTime(),
          errorMessage: error.message || 'Unknown error',
        },
      });

      // Update monitor status
      await prisma.syntheticMonitor.update({
        where: { id: monitorId },
        data: {
          lastRunAt: new Date(),
          lastStatus: 'FAILED',
        },
      });

      throw error;
    }
  } catch (error: any) {
    logger.error(
      { err: error, jobId: job.id, monitorId },
      'Failed to process synthetic monitor job'
    );
    throw error;
  }
}

/**
 * Create an incident for a failed synthetic test
 */
async function createSyntheticIncident(
  monitor: { id: string; name: string; orgId: string },
  runId: string,
  result: { status: string; errorMessage?: string; durationMs: number }
): Promise<void> {
  try {
    // Create a dedupe hash based on monitor ID and status
    const dedupeString = `synthetic-${monitor.id}-${result.status}`;
    const dedupeHash = crypto.createHash('sha256').update(dedupeString).digest('hex');

    // Check if similar incident already exists and is open
    const existingIncident = await prisma.incident.findFirst({
      where: {
        dedupeHash,
        status: { in: ['OPEN', 'ACKED'] },
      },
    });

    if (existingIncident) {
      logger.info({ incidentId: existingIncident.id }, 'Incident already exists, updating');
      
      // Update existing incident
      await prisma.incident.update({
        where: { id: existingIncident.id },
        data: {
          lastAlertedAt: new Date(),
          details: `Last failed run: ${runId}\nError: ${result.errorMessage || 'Unknown'}\nDuration: ${result.durationMs}ms`,
        },
      });

      // Add event to incident
      await prisma.incidentEvent.create({
        data: {
          id: crypto.randomUUID(),
          incidentId: existingIncident.id,
          eventType: 'ALERT',
          message: `Synthetic test failed again`,
          metadata: {
            runId,
            status: result.status,
            errorMessage: result.errorMessage,
            durationMs: result.durationMs,
          },
        },
      });

      return;
    }

    // Create new incident - need to find a related monitor
    // Since SyntheticMonitor is separate from Monitor, we need to handle this differently
    // For now, we'll skip incident creation for synthetic monitors
    // In a real implementation, you might want to create a mapping or use a different approach
    
    logger.warn(
      { monitorId: monitor.id },
      'Synthetic monitor incidents not yet linked to regular monitors'
    );
  } catch (error: any) {
    logger.error({ err: error, monitorId: monitor.id }, 'Failed to create synthetic incident');
  }
}

/**
 * Resolve open incidents for a monitor when test passes
 */
async function resolveOpenIncidents(monitorId: string): Promise<void> {
  try {
    const dedupeString = `synthetic-${monitorId}-FAILED`;
    const dedupeHash = crypto.createHash('sha256').update(dedupeString).digest('hex');

    const openIncidents = await prisma.incident.findMany({
      where: {
        dedupeHash,
        status: { in: ['OPEN', 'ACKED'] },
      },
    });

    for (const incident of openIncidents) {
      await prisma.incident.update({
        where: { id: incident.id },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });

      await prisma.incidentEvent.create({
        data: {
          id: crypto.randomUUID(),
          incidentId: incident.id,
          eventType: 'RESOLVED',
          message: 'Synthetic test passed',
        },
      });

      logger.info({ incidentId: incident.id }, 'Resolved synthetic incident');
    }
  } catch (error: any) {
    logger.error({ err: error, monitorId }, 'Failed to resolve open incidents');
  }
}

/**
 * Schedule all enabled synthetic monitors
 */
export async function scheduleAllSyntheticMonitors(): Promise<void> {
  logger.info('Scheduling all synthetic monitors');

  try {
    const monitors = await prisma.syntheticMonitor.findMany({
      where: {
        isEnabled: true,
      },
      select: {
        id: true,
        name: true,
        intervalMinutes: true,
      },
    });

    logger.info({ count: monitors.length }, 'Found enabled synthetic monitors');

    for (const monitor of monitors) {
      // Schedule job with repeat
      await syntheticMonitorQueue.add(
        `check-synthetic-${monitor.id}`,
        { monitorId: monitor.id },
        {
          jobId: `synthetic-${monitor.id}`,
          repeat: {
            every: monitor.intervalMinutes * 60 * 1000, // Convert minutes to milliseconds
          },
          removeOnComplete: 50,
          removeOnFail: 50,
        }
      );

      logger.info(
        { monitorId: monitor.id, intervalMinutes: monitor.intervalMinutes },
        'Scheduled synthetic monitor'
      );
    }
  } catch (error: any) {
    logger.error({ err: error }, 'Failed to schedule synthetic monitors');
    throw error;
  }
}

/**
 * Start the synthetic monitor worker
 */
export function startSyntheticMonitorWorker(): Worker {
  const { redisConnection } = require('@tokiflow/shared');
  const worker = new Worker('synthetic-monitor', processSyntheticMonitorJob, {
    connection: redisConnection,
    concurrency: 2, // Run up to 2 synthetic tests concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 60000, // per minute
    },
  });

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Synthetic monitor job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Synthetic monitor job failed');
  });

  return worker;
}

