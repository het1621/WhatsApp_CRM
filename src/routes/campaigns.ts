import { Router } from 'express';
import prisma from '../lib/prisma';
import { enqueueMessage } from '../workers/messageQueue';
import { TemplateEngine } from '../lib/templateEngine';

const router = Router();

// List all campaigns (user's own)
router.get('/', async (req, res) => {
  const userId = req.userId!;

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { template: true },
    });
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single campaign by ID
router.get('/:id', async (req, res) => {
  const userId = req.userId!;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId },
      include: { template: true },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign detailed stats
router.get('/:id/stats', async (req, res) => {
  const userId = req.userId!;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId },
      include: { MessageLog: true },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const messageLogs = campaign.MessageLog;
    const statusBreakdown = {
      pending: messageLogs.filter(m => m.status === 'pending').length,
      sent: messageLogs.filter(m => m.status === 'sent').length,
      delivered: messageLogs.filter(m => m.status === 'delivered').length,
      read: messageLogs.filter(m => m.status === 'read').length,
      failed: messageLogs.filter(m => m.status === 'failed').length,
    };

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        totalMessages: campaign.totalMessages,
        sentMessages: campaign.sentMessages,
        failedMessages: campaign.failedMessages,
        deliveredCount: campaign.deliveredCount,
        failedCount: campaign.failedCount,
      },
      messageStats: statusBreakdown,
      deliveryRate: campaign.totalMessages > 0
        ? ((statusBreakdown.delivered / campaign.totalMessages) * 100).toFixed(2) + '%'
        : 'N/A',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new campaign and enqueue jobs
router.post('/', async (req, res) => {
  const { name, templateName, templateId, selectedContacts, customVariables } = req.body;
  const userId = req.userId!;

  if (!name || (!templateName && !templateId)) {
    return res.status(400).json({ error: 'name and templateName (or templateId) are required' });
  }

  try {
    let template;

    if (templateId) {
      // Look up existing template by ID (Phase 3 path)
      template = await prisma.template.findFirst({
        where: { id: templateId, userId },
      });
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
    } else {
      // Upsert by name (backward compatible)
      template = await prisma.template.upsert({
        where: { userId_name: { userId, name: templateName } },
        update: {},
        create: {
          userId,
          name: templateName,
          language: 'en',
        },
      });
    }

    // Get contacts to send to
    let contactsToSend;
    if (selectedContacts && selectedContacts.length > 0) {
      contactsToSend = await prisma.contact.findMany({
        where: {
          userId,
          id: { in: selectedContacts },
          status: 'active',
        },
      });
    } else {
      contactsToSend = await prisma.contact.findMany({
        where: { userId, status: 'active' },
      });
    }

    // Create campaign with actual count
    const campaign = await prisma.campaign.create({
      data: {
        userId,
        name,
        templateId: template.id,
        status: 'running',
        totalMessages: contactsToSend.length,
      },
    });

    let sentMessages = 0;
    let failedMessages = 0;

    // Extract template content for variable substitution (Phase 3)
    const templateComponents = template.components as any[];
    const templateContent = templateComponents?.[0]?.text || '';

    // Enqueue with error tracking
    for (const contact of contactsToSend) {
      try {
        // Get custom variables for this contact, or default to name
        const vars = customVariables?.[contact.id] || { name: contact.name || '' };

        // If template has variable content, substitute it
        let messageContent = '';
        if (templateContent && TemplateEngine.hasValidVariables(templateContent)) {
          messageContent = TemplateEngine.substitute(templateContent, vars);
        }

        // Build variables array for Meta API template messages
        let variables: string[] = [];
        const templateVarCount = templateComponents?.[0]?.variables?.length || 0;
        if (customVariables && customVariables[contact.id]) {
          variables = Object.values(customVariables[contact.id]);
        } else if (templateVarCount > 0) {
          variables = contact.name ? [contact.name] : [];
        } else {
          variables = [];
        }

        await enqueueMessage({
          campaignId: campaign.id,
          contactId: contact.id,
          phoneNumber: contact.phone,
          templateName: template.name,
          textBody: messageContent || undefined,
          variables,
        });
        sentMessages++;
      } catch (err) {
        failedMessages++;
        console.error(`Failed to queue message for ${contact.phone}:`, err);
      }
    }

    // Update with actual results
    const finalStatus =
      failedMessages === 0 ? 'completed' :
      sentMessages === 0 ? 'failed' :
      'partial_failed';

    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: finalStatus,
        sentMessages,
        failedMessages,
      },
      include: { template: true },
    });

    res.status(201).json({
      message: 'Campaign created',
      campaign: updated,
      summary: {
        totalContacts: contactsToSend.length,
        sentMessages,
        failedMessages,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule a campaign
router.post('/:id/schedule', async (req, res) => {
  const { scheduledAt } = req.body;
  const userId = req.userId!;

  if (!scheduledAt) {
    return res.status(400).json({ error: 'scheduledAt date/time required' });
  }

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const scheduledDate = new Date(scheduledAt);

    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }

    const updated = await prisma.campaign.update({
      where: { id: req.params.id },
      data: {
        scheduledAt: scheduledDate,
        status: 'scheduled',
      },
    });

    res.json({
      message: 'Campaign scheduled',
      campaign: updated,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
