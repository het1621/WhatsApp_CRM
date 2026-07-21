import { Router } from 'express';
import prisma from '../lib/prisma';
import { createMetaClient } from '../lib/metaClient';
import { config } from '../config';

const router = Router();

const metaClient = createMetaClient(
  config.meta.phoneNumberId,
  config.meta.accessToken,
  config.meta.appSecret,
  config.meta.wabaId
);

// Meta Webhook Verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.meta.webhookVerifyToken) {
    console.log('Webhook verified!');
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Receive messages and status updates
router.post('/', async (req, res) => {
  const body = req.body;

  // Fix #1: Verify webhook signature to ensure payload is genuinely from Meta
  const signature = req.headers['x-hub-signature-256'] as string;
  if (!signature || !metaClient.verifyWebhookSignature(JSON.stringify(body), signature)) {
    return res.sendStatus(401);
  }

  if (body.object) {
    if (body.entry && body.entry[0].changes && body.entry[0].changes[0] && body.entry[0].changes[0].value.messages) {
      // Handle incoming message
      const phoneNumber = body.entry[0].changes[0].value.contacts[0].wa_id;
      const message = body.entry[0].changes[0].value.messages[0];
      console.log(`Received message from ${phoneNumber}:`, message);
      // You can store incoming messages or trigger auto-replies here
    }

    if (body.entry && body.entry[0].changes && body.entry[0].changes[0] && body.entry[0].changes[0].value.statuses) {
      // Handle status update (sent, delivered, read, failed)
      const statusObj = body.entry[0].changes[0].value.statuses[0];
      const wamid = statusObj.id;
      const status = statusObj.status; // 'sent', 'delivered', 'read', 'failed'

      console.log(`Message ${wamid} status updated to: ${status}`);

      try {
        await prisma.messageLog.update({
          where: { wamid },
          data: { status },
        });
      } catch (err) {
        console.error(`Failed to update message status for wamid ${wamid}`, err);
      }
    }
    res.sendStatus(200);
  } else {
    // Fix #12: Always return 200 to Meta — 404 causes retries and can disable the webhook
    res.sendStatus(200);
  }
});

export default router;
