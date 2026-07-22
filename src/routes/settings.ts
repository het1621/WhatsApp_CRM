import { Router } from 'express';
import prisma from '../lib/prisma';
import axios from 'axios';

const router = Router();

// GET user settings (WhatsApp API credentials)
router.get('/', async (req, res) => {
  const userId = req.userId!;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        whatsappPhoneNumberId: true,
        whatsappWabaId: true,
        whatsappAppSecret: true,
        whatsappAccessToken: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      phoneNumberId: user.whatsappPhoneNumberId || '',
      wabaId: user.whatsappWabaId || '',
      appSecret: user.whatsappAppSecret || '',
      hasToken: !!user.whatsappAccessToken,
      isConnected: !!(user.whatsappPhoneNumberId && user.whatsappAccessToken),
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user settings manually
router.put('/', async (req, res) => {
  const userId = req.userId!;
  const { phoneNumberId, accessToken, wabaId, appSecret } = req.body;

  try {
    const dataToUpdate: any = {};
    if (phoneNumberId !== undefined) dataToUpdate.whatsappPhoneNumberId = phoneNumberId;
    if (accessToken !== undefined && accessToken !== '') dataToUpdate.whatsappAccessToken = accessToken;
    if (wabaId !== undefined) dataToUpdate.whatsappWabaId = wabaId;
    if (appSecret !== undefined) dataToUpdate.whatsappAppSecret = appSecret;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        name: true,
        whatsappPhoneNumberId: true,
        whatsappWabaId: true,
        whatsappAppSecret: true,
        whatsappAccessToken: true,
      },
    });

    res.json({
      message: 'Settings updated successfully',
      settings: {
        phoneNumberId: updatedUser.whatsappPhoneNumberId || '',
        wabaId: updatedUser.whatsappWabaId || '',
        appSecret: updatedUser.whatsappAppSecret || '',
        hasToken: !!updatedUser.whatsappAccessToken,
        isConnected: !!(updatedUser.whatsappPhoneNumberId && updatedUser.whatsappAccessToken),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Meta Embedded Signup Handshake (1-Click Facebook Connect)
router.post('/embedded-signup', async (req, res) => {
  const userId = req.userId!;
  const { code, wabaId, phoneNumberId, accessToken } = req.body;

  if (!wabaId && !phoneNumberId && !code && !accessToken) {
    return res.status(400).json({ error: 'Embedded signup data required' });
  }

  try {
    let finalAccessToken = accessToken || '';

    // Exchange auth code for long-lived Access Token if code is provided and Meta App creds exist
    if (code && process.env.META_APP_ID && process.env.META_APP_SECRET) {
      try {
        const tokenRes = await axios.get('https://graph.facebook.com/v19.0/oauth/access_token', {
          params: {
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            code: code,
          },
        });
        if (tokenRes.data?.access_token) {
          finalAccessToken = tokenRes.data.access_token;
        }
      } catch (err: any) {
        console.warn('[Embedded Signup] Code exchange warning:', err.response?.data || err.message);
      }
    }

    const dataToUpdate: any = {};
    if (phoneNumberId) dataToUpdate.whatsappPhoneNumberId = phoneNumberId;
    if (wabaId) dataToUpdate.whatsappWabaId = wabaId;
    if (finalAccessToken) dataToUpdate.whatsappAccessToken = finalAccessToken;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate,
    });

    res.json({
      success: true,
      message: 'WhatsApp account connected successfully via Embedded Signup!',
      settings: {
        phoneNumberId: updatedUser.whatsappPhoneNumberId || '',
        wabaId: updatedUser.whatsappWabaId || '',
        hasToken: !!updatedUser.whatsappAccessToken,
        isConnected: !!(updatedUser.whatsappPhoneNumberId && updatedUser.whatsappAccessToken),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: `Embedded signup failed: ${error.message}` });
  }
});

export default router;
