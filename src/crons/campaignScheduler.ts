import cron from 'node-cron';
import prisma from '../lib/prisma';
import { enqueueMessage } from '../workers/messageQueue';
import { TemplateEngine } from '../lib/templateEngine';

// Run every minute
export const startCampaignScheduler = () => {
  cron.schedule('* * * * *', async () => {
    console.log('[Cron] Checking for scheduled campaigns...');

    try {
      const now = new Date();

      // Fix #10: Atomically claim campaigns by updating status in a single query.
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

        // Get all contacts for this user (multi-tenant safe)
        const contacts = await prisma.contact.findMany({
          where: { userId: campaign.userId, status: 'active' },
        });

        // Update total messages count
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { totalMessages: contacts.length },
        });

        // Extract template content for variable substitution
        const templateComponents = campaign.template.components as any[];
        const templateContent = templateComponents?.[0]?.text || '';

        let sentMessages = 0;
        let failedMessages = 0;

        for (const contact of contacts) {
          try {
            // Substitute variables in template content
            let messageContent = '';
            if (templateContent && TemplateEngine.hasValidVariables(templateContent)) {
              messageContent = TemplateEngine.substitute(templateContent, {
                name: contact.name || '',
              });
            }

            const variables = contact.name ? [contact.name] : [];

            await enqueueMessage({
              campaignId: campaign.id,
              contactId: contact.id,
              phoneNumber: contact.phone,
              templateName: campaign.template.name,
              textBody: messageContent || undefined,
              variables,
            });

            sentMessages++;
          } catch (err) {
            failedMessages++;
            console.error(`[Cron] Failed to queue message for ${contact.phone}:`, err);
          }
        }

        // Mark campaign completed after all jobs enqueued
        const finalStatus =
          failedMessages === 0 ? 'completed' :
          sentMessages === 0 ? 'failed' :
          'partial_failed';

        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            status: finalStatus,
            sentMessages,
            failedMessages,
          },
        });

        console.log(`[Cron] Campaign ${campaign.id} completed: ${sentMessages} sent, ${failedMessages} failed`);
      }
    } catch (error) {
      console.error('[Cron] Error running campaign scheduler:', error);
    }
  });
};
