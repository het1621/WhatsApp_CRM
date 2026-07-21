import { Router } from 'express';
import prisma from '../lib/prisma';

const router = Router();

// Get overall campaign stats
router.get('/campaigns/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        template: true,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const logs = await prisma.messageLog.groupBy({
      by: ['status'],
      where: { campaignId: id },
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

  try {
    const history = await prisma.messageLog.findMany({
      where: { contactId: id },
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
