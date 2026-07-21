import { Router } from 'express';
import prisma from '../lib/prisma';
import { enqueueMessage } from '../workers/messageQueue';

const router = Router();

// List all campaigns — Fix #13
router.get('/', async (req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: { template: true },
    });
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single campaign by ID — Fix #13
router.get('/:id', async (req, res) => {
  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: req.params.id },
      include: { template: true },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new campaign and enqueue jobs
router.post('/', async (req, res) => {
  const { name, templateName, variablesList } = req.body;
  // variablesList is an array of objects mapping contactId to variables []

  if (!name || !templateName) {
    return res.status(400).json({ error: 'name and templateName are required' });
  }

  try {
    // Upsert template (in a real scenario, you'd fetch this from Meta or use a pre-approved template ID)
    const template = await prisma.template.upsert({
      where: { name: templateName },
      update: {},
      create: {
        name: templateName,
        language: 'en',
      },
    });

    // Fix #8: Start as 'running' (active), will be updated to 'completed' or 'failed' below
    const campaign = await prisma.campaign.create({
      data: {
        name,
        templateId: template.id,
        status: 'running',
      },
    });

    // Enqueue a job for all active contacts if no specific list is provided
    const contacts = await prisma.contact.findMany({
      where: { status: 'active' },
    });

    let enqueued = 0;
    try {
      for (const contact of contacts) {
        // Logic for variables (find in variablesList if provided)
        let variables: string[] = [];
        if (variablesList && Array.isArray(variablesList)) {
          const customVars = variablesList.find(v => v.contactId === contact.id);
          if (customVars) {
            variables = customVars.variables;
          } else {
            // You could default to the contact's name if a variable is expected
            variables = contact.name ? [contact.name] : [];
          }
        } else {
          variables = contact.name ? [contact.name] : [];
        }

        await enqueueMessage({
          campaignId: campaign.id,
          contactId: contact.id,
          phoneNumber: contact.phone,
          templateName: template.name,
          variables,
        });
        enqueued++;
      }

      // Fix #8: Mark campaign as completed once all jobs are enqueued
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'completed' },
      });

      res.status(201).json({
        message: 'Campaign created and messages enqueued',
        campaign: { ...campaign, status: 'completed' },
        enqueuedMessages: enqueued,
      });
    } catch (enqueueError: any) {
      // Fix #8: Mark campaign as failed if enqueue loop fails
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'failed' },
      });
      throw enqueueError;
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

