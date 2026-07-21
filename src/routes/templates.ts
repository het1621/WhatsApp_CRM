import { Router } from 'express';
import prisma from '../lib/prisma';
import { TemplateEngine } from '../lib/templateEngine';

const router = Router();

// Create template
router.post('/', async (req, res) => {
  const { name, content, language = 'en' } = req.body;
  const userId = req.userId!;

  if (!name || !content) {
    return res.status(400).json({ error: 'Name and content required' });
  }

  try {
    // Extract variables for display
    const variables = TemplateEngine.extractVariables(content);

    const template = await prisma.template.create({
      data: {
        userId,
        name,
        language,
        status: 'approved',
        components: [{ type: 'body', text: content, variables }],
      },
    });

    res.status(201).json(template);
  } catch (error: any) {
    if (error.code === 'P2002') {
      res.status(409).json({ error: 'Template name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// List templates
router.get('/', async (req, res) => {
  const userId = req.userId!;

  try {
    const templates = await prisma.template.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(templates);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get template by ID
router.get('/:id', async (req, res) => {
  const userId = req.userId!;

  try {
    const template = await prisma.template.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  const { name, content, language } = req.body;
  const userId = req.userId!;

  try {
    const template = await prisma.template.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const variables = content ? TemplateEngine.extractVariables(content) : [];

    const updated = await prisma.template.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(language && { language }),
        ...(content && { components: [{ type: 'body', text: content, variables }] }),
      },
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete template
router.delete('/:id', async (req, res) => {
  const userId = req.userId!;

  try {
    const template = await prisma.template.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await prisma.template.delete({ where: { id: req.params.id } });
    res.json({ message: 'Template deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
