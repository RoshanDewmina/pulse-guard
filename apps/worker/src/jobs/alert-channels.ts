import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { createLogger } from '../logger';
import { sendPagerDutyTrigger, sendPagerDutyAcknowledge, sendPagerDutyResolve } from './alerts/pagerduty';
import { sendTeamsOpened, sendTeamsAcknowledged, sendTeamsResolved } from './alerts/teams';
import { sendSMSOpened, sendSMSAcknowledged, sendSMSResolved } from './alerts/sms';

const logger = createLogger('alert-channels');
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export function startAlertChannelsWorker() {
  const worker = new Worker(
    'alerts',
    async (job) => {
      const { name, data } = job;

      try {
        switch (name) {
          case 'send-pagerduty-alert':
            await handlePagerDutyAlert(data);
            break;
          case 'send-teams-alert':
            await handleTeamsAlert(data);
            break;
          case 'send-sms-alert':
            await handleSMSAlert(data);
            break;
          default:
            logger.warn({ jobName: name }, 'Unknown alert channel job type');
        }
      } catch (error) {
        logger.error({ err: error, jobName: name, data }, 'Alert channel job failed');
        throw error;
      }
    },
    { connection }
  );

  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, jobName: job.name }, 'Alert channel job completed');
  });

  worker.on('failed', (job, err) => {
    logger.error({ err, jobId: job?.id, jobName: job?.name }, 'Alert channel job failed');
  });

  return worker;
}

async function handlePagerDutyAlert(data: any) {
  const { incidentId, channelId, action } = data;

  logger.info({ incidentId, channelId, action }, 'Processing PagerDuty alert');

  switch (action) {
    case 'trigger':
      await sendPagerDutyTrigger(incidentId, channelId);
      break;
    case 'acknowledge':
      await sendPagerDutyAcknowledge(incidentId, channelId);
      break;
    case 'resolve':
      await sendPagerDutyResolve(incidentId, channelId);
      break;
    default:
      throw new Error(`Unknown PagerDuty action: ${action}`);
  }
}

async function handleTeamsAlert(data: any) {
  const { incidentId, channelId, action } = data;

  logger.info({ incidentId, channelId, action }, 'Processing Teams alert');

  switch (action) {
    case 'opened':
      await sendTeamsOpened(incidentId, channelId);
      break;
    case 'acked':
      await sendTeamsAcknowledged(incidentId, channelId);
      break;
    case 'resolved':
      await sendTeamsResolved(incidentId, channelId);
      break;
    default:
      throw new Error(`Unknown Teams action: ${action}`);
  }
}

async function handleSMSAlert(data: any) {
  const { incidentId, channelId, action } = data;

  logger.info({ incidentId, channelId, action }, 'Processing SMS alert');

  switch (action) {
    case 'opened':
      await sendSMSOpened(incidentId, channelId);
      break;
    case 'acked':
      await sendSMSAcknowledged(incidentId, channelId);
      break;
    case 'resolved':
      await sendSMSResolved(incidentId, channelId);
      break;
    default:
      throw new Error(`Unknown SMS action: ${action}`);
  }
}

