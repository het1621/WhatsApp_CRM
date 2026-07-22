import { Router } from 'express';
import prisma from '../lib/prisma';
import { phoneNormalizer } from '../lib/phoneNormalizer';
import multer from 'multer';
import { parse } from 'csv-parse/sync';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// Create a single contact
router.post('/', async (req, res) => {
  const { phone, name } = req.body;
  const userId = req.userId!;

  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }

  const normalized = phoneNormalizer.normalizeSingle(phone);

  if (!normalized.valid) {
    return res.status(400).json({ error: `Invalid phone number: ${normalized.error}` });
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        userId,
        phone: normalized.e164 as string,
        name,
      },
    });

    res.status(201).json(contact);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Contact already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Bulk upload contacts via CSV
router.post('/bulk', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const userId = req.userId!;

  try {
    const csvData = req.file.buffer.toString('utf-8');
    const records: any[] = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    let successCount = 0;
    let errors: any[] = [];

    for (const [index, record] of records.entries()) {
      const name = record.name || record.Name || record.NAME || '';
      const phone = record.phone || record.Phone || record.PHONE || record.phoneNumber || record['Phone Number'] || '';

      if (!phone) {
        errors.push({ row: index + 2, error: 'Missing phone number' });
        continue;
      }

      const normalized = phoneNormalizer.normalizeSingle(phone);
      if (!normalized.valid) {
        errors.push({ row: index + 2, error: `Invalid phone: ${normalized.error}` });
        continue;
      }

      try {
        await prisma.contact.upsert({
          where: {
            userId_phone: { userId, phone: normalized.e164 as string },
          },
          update: { name },
          create: { userId, phone: normalized.e164 as string, name },
        });
        successCount++;
      } catch (err: any) {
        errors.push({ row: index + 2, error: err.message });
      }
    }

    res.json({ successCount, errors });
  } catch (error: any) {
    res.status(500).json({ error: `Failed to parse CSV: ${error.message}` });
  }
});

// List contacts (only user's own)
router.get('/', async (req, res) => {
  const userId = req.userId!;

  try {
    const contacts = await prisma.contact.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single contact
router.get('/:id', async (req, res) => {
  const userId = req.userId!;

  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    res.json(contact);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update contact
router.put('/:id', async (req, res) => {
  const userId = req.userId!;
  const { name, phone, status } = req.body;

  try {
    const existing = await prisma.contact.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (status !== undefined) updateData.status = status;
    if (phone) {
      const normalized = phoneNormalizer.normalizeSingle(phone);
      if (!normalized.valid) {
        return res.status(400).json({ error: `Invalid phone number: ${normalized.error}` });
      }
      updateData.phone = normalized.e164;
    }

    const updated = await prisma.contact.update({
      where: { id: req.params.id },
      data: updateData,
    });

    res.json(updated);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Phone number already exists for another contact' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete contact
router.delete('/:id', async (req, res) => {
  const userId = req.userId!;

  try {
    const contact = await prisma.contact.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }

    await prisma.contact.delete({ where: { id: req.params.id } });
    res.json({ message: 'Contact deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
