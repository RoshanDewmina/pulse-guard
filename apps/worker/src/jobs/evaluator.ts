import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { prisma } from '@tokiflow/db';
import { evaluateQueue, alertsQueue } from '../queues';
import { createLogger } from '../logger';
import crypto from 'crypto';

const logger = createLogger('evaluator');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export function startEvaluator() {
  // Schedule evaluation every 60 seconds
  const scheduleEvaluation = async () => {
    await evaluateQueue.add(
      'evaluate-monitors',
      {},
      {
        repeat: {
          every: 60000, // 60 seconds
        },
        jobId: 'evaluate-monitors',
      }
    );
  };

  scheduleEvaluation();

  // Worker to process evaluations
  const worker = new Worker(
    'evaluate',
    async (job) => {
      logger.info('Running monitor evaluation...');

      const now = new Date();

      // Find monitors that are overdue (nextDueAt + graceSec < now)
      const overdueMonitors = await prisma.monitor.findMany({
        where: {
          status: {
            not: 'DISABLED',
          },
          nextDueAt: {
            lt: new Date(now.getTime() - 0), // Already past due
          },
        },
        include: {
          org: true,
        },
      });

      logger.info(`Found ${overdueMonitors.length} potentially overdue monitors`);

      for (const monitor of overdueMonitors) {
        const gracePeriodEnd = new Date(
          monitor.nextDueAt!.getTime() + monitor.graceSec * 1000
        );

        // Check if we're past the grace period
        if (now > gracePeriodEnd) {
          // Check if there was a successful run since nextDueAt
          const recentRun = await prisma.run.findFirst({
            where: {
              monitorId: monitor.id,
              ...(monitor.nextDueAt && {
                startedAt: {
                  gte: monitor.nextDueAt,
                },
              }),
              outcome: {
                in: ['SUCCESS', 'FAIL', 'LATE'],
              },
            },
            orderBy: {
              startedAt: 'desc',
            },
          });

          if (!recentRun) {
            logger.info(`Monitor ${monitor.name} (${monitor.id}) is MISSED`);

            // Update monitor status
            await prisma.monitor.update({
              where: { id: monitor.id },
              data: {
                status: 'MISSED',
              },
            });

            // Create MISSED run record
            await prisma.run.create({
              data: {
                monitorId: monitor.id,
                startedAt: monitor.nextDueAt!,
                finishedAt: now,
                outcome: 'MISSED',
              },
            });

            // Create or update incident
            const dedupeHash = crypto
              .createHash('sha256')
              .update(`${monitor.id}-MISSED-${monitor.nextDueAt!.toISOString().slice(0, 13)}`)
              .digest('hex');

            const existingIncident = await prisma.incident.findFirst({
              where: {
                monitorId: monitor.id,
                dedupeHash,
                status: {
                  in: ['OPEN', 'ACKED'],
                },
              },
            });

            if (!existingIncident) {
              const missedSeconds = Math.floor(
                (now.getTime() - gracePeriodEnd.getTime()) / 1000
              );

              const incident = await prisma.incident.create({
                data: {
                  monitorId: monitor.id,
                  kind: 'MISSED',
                  summary: `Job missed by ${missedSeconds}s`,
                  details: `Expected to run at ${monitor.nextDueAt!.toISOString()}, grace period ended at ${gracePeriodEnd.toISOString()}`,
                  dedupeHash,
                },
              });

              logger.info(`Created MISSED incident ${incident.id} for monitor ${monitor.name}`);

              // Queue alert
              await alertsQueue.add('dispatch-alert', {
                incidentId: incident.id,
              });
            }
          }
        }
      }

      logger.info('Monitor evaluation complete');
    },
    { connection }
  );

  worker.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id }, `Job ${job?.id} failed`);
  });

  return worker;
}

