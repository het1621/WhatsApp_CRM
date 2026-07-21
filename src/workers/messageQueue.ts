import { Queue } from 'bullmq';
import { config } from '../config';
import IORedis from 'ioredis';

// Create a robust Redis connection — shared across queue and worker
export const sharedRedisConnection = new IORedis(config.redisUrl, {
  maxRetriesPerRequest: null,
});

export const messageQueue = new Queue('whatsapp-messages', {
  connection: sharedRedisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5 seconds initial delay
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export interface MessageJobData {
  campaignId?: string;
  contactId: string;
  phoneNumber: string;
  templateName?: string;
  textBody?: string;
  variables?: string[];
}

export const enqueueMessage = async (data: MessageJobData) => {
  return await messageQueue.add('send-message', data);
};
