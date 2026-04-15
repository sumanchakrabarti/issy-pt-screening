import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { param } from '../middleware/params';
import { authenticate, AuthRequest } from '../middleware/auth';

export const clubRouter = Router();
clubRouter.use(authenticate);

const clubSchema = z.object({
  name: z.string().min(1),
  clinicId: z.string().min(1),
});

clubRouter.get('/', async (req, res: Response) => {
  const { role, userId } = (req as AuthRequest).user!;
  const clinicId = typeof req.query.clinicId === 'string' ? req.query.clinicId : undefined;
  const where: Record<string, unknown> = {};
  if (clinicId) where.clinicId = clinicId;

  if (role === 'coach') {
    const coachClubs = await prisma.coachClub.findMany({ where: { userId }, select: { clubId: true } });
    where.id = { in: coachClubs.map((c) => c.clubId) };
  } else if (role === 'parent') {
    const parentAthletes = await prisma.parentAthlete.findMany({ where: { userId }, select: { athlete: { select: { team: { select: { clubId: true } } } } } });
    const clubIds = [...new Set(parentAthletes.map((pa) => pa.athlete.team.clubId))];
    where.id = { in: clubIds };
  }

  const clubs = await prisma.club.findMany({ where, include: { clinic: true }, orderBy: { name: 'asc' } });
  res.json(clubs);
});

clubRouter.get('/:id', async (req, res: Response) => {
  const club = await prisma.club.findUnique({
    where: { id: param(req, 'id') },
    include: { teams: true, clinic: true },
  });
  if (!club) { res.status(404).json({ error: 'Club not found' }); return; }
  res.json(club);
});

clubRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = clubSchema.parse(req.body);
    const club = await prisma.club.create({ data });
    res.status(201).json(club);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

clubRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = clubSchema.parse(req.body);
    const club = await prisma.club.update({ where: { id: param(req, 'id') }, data });
    res.json(club);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

clubRouter.delete('/:id', async (req, res: Response) => {
  await prisma.club.delete({ where: { id: param(req, 'id') } });
  res.status(204).send();
});
