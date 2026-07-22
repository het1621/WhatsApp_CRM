import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// GET aggregated analytics overview
router.get('/overview', async (req, res) => {
  const userId = req.userId!;

  try {
    const totalContacts = await prisma.contact.count({ where: { userId } });
    const totalCampaigns = await prisma.campaign.count({ where: { userId } });
    const totalTemplates = await prisma.template.count({ where: { userId } });

    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      select: {
        totalMessages: true,
        sentMessages: true,
        failedMessages: true,
        deliveredCount: true,
      },
    });

    const totalTargeted = campaigns.reduce((sum, c) => sum + c.totalMessages, 0);
    const totalSent = campaigns.reduce((sum, c) => sum + c.sentMessages, 0);
    const totalFailed = campaigns.reduce((sum, c) => sum + c.failedMessages, 0);
    const totalDelivered = campaigns.reduce((sum, c) => sum + c.deliveredCount, 0);

    const deliveryRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100;

    res.json({
      totalContacts,
      totalCampaigns,
      totalTemplates,
      totalTargeted,
      totalSent,
      totalFailed,
      totalDelivered,
      deliveryRate,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get overall campaign stats
router.get('/campaigns/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.userId!;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id, userId },
      include: {
        template: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const logs = await prisma.messageLog.groupBy({
      by: ['status'],
      where: { campaignId: id, userId },
      _count: {
        status: true,
      },
    });

    const stats = {
      pending: 0,
      sent: 0,
      delivered: 0,
      read: 0,
      failed: 0,
    };

    logs.forEach(log => {
      if (log.status in stats) {
        stats[log.status as keyof typeof stats] = log._count.status;
      }
    });

    res.json({
      campaign,
      stats,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get recent contact message history
router.get('/contacts/:id/history', async (req, res) => {
  const { id } = req.params;
  const userId = req.userId!;

  try {
    const history = await prisma.messageLog.findMany({
      where: { contactId: id, userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        campaign: {
          select: { name: true },
        },
      },
    });

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
