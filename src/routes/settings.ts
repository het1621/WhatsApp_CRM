import { Router } from 'express';
import prisma from '../lib/prisma';

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
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PUT update user settings
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
      },
    });

    res.json({
      message: 'Settings updated successfully',
      settings: {
        phoneNumberId: updatedUser.whatsappPhoneNumberId || '',
        wabaId: updatedUser.whatsappWabaId || '',
        appSecret: updatedUser.whatsappAppSecret || '',
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
