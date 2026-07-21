import request from 'supertest';
import express from 'express';
import { requireApiKey } from '../src/middleware/auth';

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/protected', requireApiKey, (req, res) => {
  res.json({ status: 'success' });
});

describe('API Routes', () => {
  it('should return ok for health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('should reject unauthenticated requests to protected routes', async () => {
    const res = await request(app).get('/api/protected');
    expect(res.status).toBe(401);
  });

  it('should allow authenticated requests to protected routes', async () => {
    // Generate a valid token for testing
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: 'test', email: 'test@example.com' }, process.env.JWT_SECRET || 'fallback_secret_key_change_in_production');

    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
