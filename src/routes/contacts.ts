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
          where: { phone: normalized.e164 as string },
          update: { name },
          create: { phone: normalized.e164 as string, name },
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

// List contacts
router.get('/', async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(contacts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
