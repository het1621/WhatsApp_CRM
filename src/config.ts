import dotenv from 'dotenv';

dotenv.config();

// Fix #3: Crash loudly in production if JWT_SECRET is not set
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable must be set in production');
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10), // Fix #15: always number
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/whatsapp_crm',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  meta: {
    phoneNumberId: process.env.PHONE_NUMBER_ID || '',
    accessToken: process.env.META_ACCESS_TOKEN || '',
    appSecret: process.env.META_APP_SECRET || '',
    webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'crm_verify_token',
    wabaId: process.env.WABA_ID || '', // Fix #11: needed for fetchTemplates
  },
  apiKey: process.env.API_KEY || 'default_dev_key',
};
