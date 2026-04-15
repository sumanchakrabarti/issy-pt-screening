import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { param } from '../middleware/params';
import { authenticate, AuthRequest } from '../middleware/auth';

export const athleteRouter = Router();
athleteRouter.use(authenticate);

const athleteSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().transform((s) => new Date(s)),
  gender: z.string().min(1),
  medicalHistory: z.string().optional(),
  teamId: z.string().min(1),
});

athleteRouter.get('/', async (req, res: Response) => {
  const { role, userId } = (req as AuthRequest).user!;
  const teamId = typeof req.query.teamId === 'string' ? req.query.teamId : undefined;
  const where: Record<string, unknown> = {};
  if (teamId) where.teamId = teamId;

  if (role === 'coach') {
    const coachClubs = await prisma.coachClub.findMany({ where: { userId }, select: { clubId: true } });
    const clubIds = coachClubs.map((c) => c.clubId);
    where.team = { clubId: { in: clubIds } };
  } else if (role === 'parent') {
    const parentAthletes = await prisma.parentAthlete.findMany({ where: { userId }, select: { athleteId: true } });
    where.id = { in: parentAthletes.map((pa) => pa.athleteId) };
  }

  const athletes = await prisma.athlete.findMany({ where, include: { team: true }, orderBy: { lastName: 'asc' } });
  res.json(athletes);
});

athleteRouter.get('/:id', async (req, res: Response) => {
  const athlete = await prisma.athlete.findUnique({
    where: { id: param(req, 'id') },
    include: { team: { include: { club: true } }, screeningSessions: { orderBy: { date: 'desc' } } },
  });
  if (!athlete) { res.status(404).json({ error: 'Athlete not found' }); return; }
  res.json(athlete);
});

athleteRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = athleteSchema.parse(req.body);
    const athlete = await prisma.athlete.create({ data });
    res.status(201).json(athlete);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

athleteRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = athleteSchema.parse(req.body);
    const athlete = await prisma.athlete.update({ where: { id: param(req, 'id') }, data });
    res.json(athlete);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

athleteRouter.delete('/:id', async (req, res: Response) => {
  await prisma.athlete.delete({ where: { id: param(req, 'id') } });
  res.status(204).send();
});
