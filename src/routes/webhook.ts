import { Router } from 'express';
import prisma from '../lib/prisma';
import { createMetaClient } from '../lib/metaClient';
import { config } from '../config';

const router = Router();

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || config.meta.webhookVerifyToken;

const metaClient = createMetaClient(
  config.meta.phoneNumberId,
  config.meta.accessToken,
  config.meta.appSecret,
  config.meta.wabaId
);

// Meta Webhook Verification (GET)
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('Webhook verified by Meta');
    res.status(200).send(challenge);
  } else {
    console.error('Webhook verification failed');
    res.sendStatus(403);
  }
});

import crypto from 'crypto';

const verifySignature = (payload: string | Buffer, signature: string, appSecret: string): boolean => {
  if (!signature || !appSecret) return true; // Skip if no secret configured in test mode
  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');
  return `sha256=${expectedHash}` === signature;
};

// Receive messages and status updates (POST)
router.post('/', async (req, res) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  const appSecret = process.env.META_APP_SECRET || config.meta.appSecret;

  if (signature && appSecret) {
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    if (!verifySignature(rawBody, signature, appSecret)) {
      console.error('❌ Webhook signature verification failed');
      return res.status(403).json({ error: 'Invalid webhook signature' });
    }
  }

  const body = req.body;

  // Meta requires immediate 200 response
  res.sendStatus(200);

  try {
    if (!body.entry) return;

    for (const entry of body.entry) {
      for (const change of entry.changes) {
        // Handle message status updates (delivered, read, failed)
        if (change.value.statuses) {
          for (const status of change.value.statuses) {
            // Meta status values: sent, delivered, read, failed
            try {
              await prisma.messageLog.updateMany({
                where: { wamid: status.id },
                data: { status: status.status },
              });

              console.log(`Message ${status.id} status: ${status.status}`);

              // Update campaign counts if the message belongs to a campaign
              if (status.status === 'delivered' || status.status === 'failed') {
                const messageLog = await prisma.messageLog.findFirst({
                  where: { wamid: status.id },
                });

                if (messageLog?.campaignId) {
                  if (status.status === 'delivered') {
                    await prisma.campaign.update({
                      where: { id: messageLog.campaignId },
                      data: { deliveredCount: { increment: 1 } },
                    });
                  } else if (status.status === 'failed') {
                    await prisma.campaign.update({
                      where: { id: messageLog.campaignId },
                      data: { failedCount: { increment: 1 } },
                    });
                  }
                }
              }
            } catch (err) {
              console.error(`Failed to update message status for wamid ${status.id}`, err);
            }
          }
        }

        // Handle incoming messages (for future two-way inbox)
        if (change.value.messages) {
          for (const message of change.value.messages) {
            console.log(`Incoming message from ${message.from}: ${message.text?.body}`);
            // Store incoming messages for two-way inbox feature
          }
        }
      }
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
  }
});

export default router;
