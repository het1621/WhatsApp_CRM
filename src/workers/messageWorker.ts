import { Worker, Job } from 'bullmq';
import prisma from '../lib/prisma';
import { createMetaClient } from '../lib/metaClient';
import { config } from '../config';
import { MessageJobData, sharedRedisConnection } from './messageQueue';

const metaClient = createMetaClient(
  config.meta.phoneNumberId,
  config.meta.accessToken,
  config.meta.appSecret,
  config.meta.wabaId
);

export const messageWorker = new Worker(
  'whatsapp-messages',
  async (job: Job<MessageJobData>) => {
    const { contactId, campaignId, phoneNumber, templateName, textBody, variables } = job.data;

    try {
      let result;

      if (templateName) {
        result = await metaClient.sendTemplateMessage(
          phoneNumber,
          templateName,
          'en', // default language
          variables || []
        );
      } else if (textBody) {
        result = await metaClient.sendTextMessage(phoneNumber, textBody);
      } else {
        throw new Error('Neither templateName nor textBody provided');
      }

      if (result.error) {
        throw new Error(`Meta API Error: ${JSON.stringify(result.error)}`);
      }

      // Log successful send — include userId from the campaign
      const wamid = result.data?.messages?.[0]?.id;

      // Look up userId from campaign (or contact)
      let userId = '';
      if (campaignId) {
        const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
        userId = campaign?.userId || '';
      }
      if (!userId) {
        const contact = await prisma.contact.findUnique({ where: { id: contactId } });
        userId = contact?.userId || '';
      }

      await prisma.messageLog.create({
        data: {
          userId,
          contactId,
          campaignId,
          wamid,
          status: 'sent',
        },
      });

      return { success: true, wamid };
    } catch (error: any) {
      // Fix #9: Only write a failure log on the LAST attempt to avoid duplicate rows.
      const maxAttempts = job.opts.attempts ?? 1;
      const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

      if (isLastAttempt) {
        // Look up userId from campaign (or contact)
        let userId = '';
        if (campaignId) {
          const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
          userId = campaign?.userId || '';
        }
        if (!userId) {
          const contact = await prisma.contact.findUnique({ where: { id: contactId } });
          userId = contact?.userId || '';
        }

        await prisma.messageLog.create({
          data: {
            userId,
            contactId,
            campaignId,
            status: 'failed',
            error: error.message,
          },
        });
      }

      // Re-throw to let BullMQ handle retries
      throw error;
    }
  },
  {
    connection: sharedRedisConnection as any,
    concurrency: 5,
  }
);

messageWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed!`);
});

messageWorker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`);
});
