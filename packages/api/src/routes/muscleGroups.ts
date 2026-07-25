import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { param } from '../middleware/params';

export const muscleGroupRouter = Router();
muscleGroupRouter.use(authenticate);

const muscleGroupSchema = z.object({
  name: z.string().min(1),
  region: z.string().optional(),
});

muscleGroupRouter.get('/', async (_req, res: Response) => {
  const muscleGroups = await prisma.muscleGroup.findMany({ orderBy: { name: 'asc' } });
  res.json(muscleGroups);
});

muscleGroupRouter.get('/:id', async (req, res: Response) => {
  const muscleGroup = await prisma.muscleGroup.findUnique({
    where: { id: param(req, 'id') },
    include: { exercises: { include: { exercise: true } } },
  });
  if (!muscleGroup) { res.status(404).json({ error: 'Muscle group not found' }); return; }
  res.json({
    ...muscleGroup,
    exercises: muscleGroup.exercises.map((e) => e.exercise),
  });
});

muscleGroupRouter.post('/', requireRole('admin', 'clinician'), async (req: AuthRequest, res: Response) => {
  try {
    const data = muscleGroupSchema.parse(req.body);
    const muscleGroup = await prisma.muscleGroup.create({ data });
    res.status(201).json(muscleGroup);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

muscleGroupRouter.put('/:id', requireRole('admin', 'clinician'), async (req: AuthRequest, res: Response) => {
  try {
    const data = muscleGroupSchema.parse(req.body);
    const muscleGroup = await prisma.muscleGroup.update({ where: { id: param(req, 'id') }, data });
    res.json(muscleGroup);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

muscleGroupRouter.delete('/:id', requireRole('admin', 'clinician'), async (req, res: Response) => {
  await prisma.muscleGroup.delete({ where: { id: param(req, 'id') } });
  res.status(204).send();
});
