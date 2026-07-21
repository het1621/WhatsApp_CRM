import express from 'express';
import cors from 'cors';
import { config } from './config';
import webhookRoutes from './routes/webhook';
import contactsRoutes from './routes/contacts';
import campaignsRoutes from './routes/campaigns';
import analyticsRoutes from './routes/analytics';
import authRoutes from './routes/auth';
import { requireApiKey } from './middleware/auth';
import { startCampaignScheduler } from './crons/campaignScheduler';
import './workers/messageWorker'; // Fix #14: Start the BullMQ worker so queued jobs are processed


const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register public routes
app.use('/api/auth', authRoutes);
app.use('/webhook', webhookRoutes);

// Register protected routes
app.use('/api/contacts', requireApiKey, contactsRoutes);
app.use('/api/campaigns', requireApiKey, campaignsRoutes);
app.use('/api/analytics', requireApiKey, analyticsRoutes);

// Start background cron jobs
startCampaignScheduler();

app.listen(config.port, () => {
  console.log(`🚀 Server ready at http://localhost:${config.port}`);
});
