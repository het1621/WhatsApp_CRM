import { Worker, Job } from 'bullmq';
import prisma from '../lib/prisma';
import { createMetaClient } from '../lib/metaClient';
import { config } from '../config';
import { MessageJobData, sharedRedisConnection } from './messageQueue';

export const messageWorker = new Worker(
  'whatsapp-messages',
  async (job: Job<MessageJobData>) => {
    const { contactId, campaignId, phoneNumber, templateName, textBody, variables } = job.data;

    try {
      // 1. Look up campaign and user to get per-tenant Meta credentials
      let campaign = null;
      let user = null;
      let template = null;

      if (campaignId) {
        campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: { user: true, template: true },
        });
        user = campaign?.user;
        template = campaign?.template;
      }

      if (!user && contactId) {
        const contact = await prisma.contact.findUnique({
          where: { id: contactId },
          include: { user: true },
        });
        user = contact?.user;
      }

      // Use user's saved Meta credentials from DB, fallback to config .env
      const phoneNumberId = user?.whatsappPhoneNumberId || config.meta.phoneNumberId;
      const accessToken = user?.whatsappAccessToken || config.meta.accessToken;
      const appSecret = user?.whatsappAppSecret || config.meta.appSecret;
      const wabaId = user?.whatsappWabaId || config.meta.wabaId;

      if (!phoneNumberId || !accessToken) {
        throw new Error('No WhatsApp Phone Number ID or Access Token configured for this user');
      }

      // Dynamically create client with user's credentials
      const metaClient = createMetaClient(phoneNumberId, accessToken, appSecret || '', wabaId || '');

      let result;

      if (templateName) {
        // Use template language from DB or default to 'en_US'
        const languageCode = template?.language || 'en_US';

        result = await metaClient.sendTemplateMessage(
          phoneNumber,
          templateName,
          languageCode,
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

      // Log successful send — include userId
      const wamid = result.data?.messages?.[0]?.id;
      const userId = user?.id || '';

      await prisma.messageLog.create({
        data: {
          userId,
          contactId,
          campaignId,
          wamid,
          status: 'sent',
        },
      });

      console.log(`✅ Message successfully sent via Meta Cloud API! WAMID: ${wamid}`);
      return { success: true, wamid };
    } catch (error: any) {
      console.error(`❌ Message delivery failed:`, error.message);

      // Only write failure log on LAST attempt to avoid duplicate rows
      const maxAttempts = job.opts.attempts ?? 1;
      const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

      if (isLastAttempt) {
        let userId = '';
        if (campaignId) {
          const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
          userId = campaign?.userId || '';
        }
        if (!userId && contactId) {
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
