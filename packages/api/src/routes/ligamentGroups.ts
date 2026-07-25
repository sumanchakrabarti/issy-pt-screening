import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { param } from '../middleware/params';

export const ligamentGroupRouter = Router();
ligamentGroupRouter.use(authenticate);

const ligamentGroupSchema = z.object({
  name: z.string().min(1),
  joint: z.string().optional(),
});

ligamentGroupRouter.get('/', async (_req, res: Response) => {
  const ligamentGroups = await prisma.ligamentGroup.findMany({ orderBy: { name: 'asc' } });
  res.json(ligamentGroups);
});

ligamentGroupRouter.get('/:id', async (req, res: Response) => {
  const ligamentGroup = await prisma.ligamentGroup.findUnique({
    where: { id: param(req, 'id') },
    include: { exercises: { include: { exercise: true } } },
  });
  if (!ligamentGroup) { res.status(404).json({ error: 'Ligament group not found' }); return; }
  res.json({
    ...ligamentGroup,
    exercises: ligamentGroup.exercises.map((e) => e.exercise),
  });
});

ligamentGroupRouter.post('/', requireRole('admin', 'clinician'), async (req: AuthRequest, res: Response) => {
  try {
    const data = ligamentGroupSchema.parse(req.body);
    const ligamentGroup = await prisma.ligamentGroup.create({ data });
    res.status(201).json(ligamentGroup);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

ligamentGroupRouter.put('/:id', requireRole('admin', 'clinician'), async (req: AuthRequest, res: Response) => {
  try {
    const data = ligamentGroupSchema.parse(req.body);
    const ligamentGroup = await prisma.ligamentGroup.update({ where: { id: param(req, 'id') }, data });
    res.json(ligamentGroup);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

ligamentGroupRouter.delete('/:id', requireRole('admin', 'clinician'), async (req, res: Response) => {
  await prisma.ligamentGroup.delete({ where: { id: param(req, 'id') } });
  res.status(204).send();
});
