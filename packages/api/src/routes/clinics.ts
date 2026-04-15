import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { param } from '../middleware/params';

export const clinicRouter = Router();
clinicRouter.use(authenticate);

const clinicSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  phone: z.string().optional(),
});

clinicRouter.get('/', async (_req, res: Response) => {
  const clinics = await prisma.clinic.findMany({ orderBy: { name: 'asc' } });
  res.json(clinics);
});

clinicRouter.get('/:id', async (req, res: Response) => {
  const clinic = await prisma.clinic.findUnique({
    where: { id: param(req, 'id') },
    include: { clubs: true },
  });
  if (!clinic) { res.status(404).json({ error: 'Clinic not found' }); return; }
  res.json(clinic);
});

clinicRouter.post('/', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const data = clinicSchema.parse(req.body);
    const clinic = await prisma.clinic.create({ data });
    res.status(201).json(clinic);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

clinicRouter.put('/:id', requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const data = clinicSchema.parse(req.body);
    const clinic = await prisma.clinic.update({ where: { id: param(req, 'id') }, data });
    res.json(clinic);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

clinicRouter.delete('/:id', requireRole('admin'), async (req, res: Response) => {
  await prisma.clinic.delete({ where: { id: param(req, 'id') } });
  res.status(204).send();
});
