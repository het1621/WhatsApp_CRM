import cron from 'node-cron';
import prisma from '../lib/prisma';
import { enqueueMessage } from '../workers/messageQueue';

// Run every minute
export const startCampaignScheduler = () => {
  cron.schedule('* * * * *', async () => {
    console.log('[Cron] Checking for scheduled campaigns...');

    try {
      const now = new Date();

      // Fix #10: Atomically claim campaigns by updating status in a single query.
      // Only the instance whose updateMany modifies rows > 0 will process those campaigns,
      // preventing duplicate sends when multiple app instances run simultaneously.
      const claimed = await prisma.campaign.updateMany({
        where: {
          status: 'scheduled',
          scheduledAt: { lte: now },
        },
        data: { status: 'running' },
      });

      if (claimed.count === 0) return; // Nothing to process

      // Fetch the campaigns we just claimed
      const campaigns = await prisma.campaign.findMany({
        where: {
          status: 'running',
          scheduledAt: { lte: now },
        },
        include: { template: true },
      });

      for (const campaign of campaigns) {
        console.log(`[Cron] Starting scheduled campaign: ${campaign.id}`);

        // Enqueue jobs for active contacts
        const contacts = await prisma.contact.findMany({
          where: { status: 'active' },
        });

        for (const contact of contacts) {
          const variables = contact.name ? [contact.name] : [];

          await enqueueMessage({
            campaignId: campaign.id,
            contactId: contact.id,
            phoneNumber: contact.phone,
            templateName: campaign.template.name,
            variables,
          });
        }

        // Mark campaign completed after all jobs enqueued
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'completed' },
        });
      }
    } catch (error) {
      console.error('[Cron] Error running campaign scheduler:', error);
    }
  });
};

