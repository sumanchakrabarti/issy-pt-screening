import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { param } from '../middleware/params';
import { authenticate, AuthRequest } from '../middleware/auth';

export const teamRouter = Router();
teamRouter.use(authenticate);

const teamSchema = z.object({
  name: z.string().min(1),
  clubId: z.string().min(1),
});

teamRouter.get('/', async (req, res: Response) => {
  const { role, userId } = (req as AuthRequest).user!;
  const clubId = typeof req.query.clubId === 'string' ? req.query.clubId : undefined;
  const where: Record<string, unknown> = {};
  if (clubId) where.clubId = clubId;

  if (role === 'coach') {
    const coachClubs = await prisma.coachClub.findMany({ where: { userId }, select: { clubId: true } });
    const clubIds = coachClubs.map((c) => c.clubId);
    if (clubId) {
      if (!clubIds.includes(clubId)) { res.json([]); return; }
    } else {
      where.clubId = { in: clubIds };
    }
  } else if (role === 'parent') {
    const parentAthletes = await prisma.parentAthlete.findMany({ where: { userId }, select: { athlete: { select: { teamId: true } } } });
    const teamIds = [...new Set(parentAthletes.map((pa) => pa.athlete.teamId))];
    where.id = { in: teamIds };
  }

  const teams = await prisma.team.findMany({ where, include: { club: true }, orderBy: { name: 'asc' } });
  res.json(teams);
});

teamRouter.get('/:id', async (req, res: Response) => {
  const team = await prisma.team.findUnique({
    where: { id: param(req, 'id') },
    include: { athletes: true, club: true },
  });
  if (!team) { res.status(404).json({ error: 'Team not found' }); return; }
  res.json(team);
});

teamRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = teamSchema.parse(req.body);
    const team = await prisma.team.create({ data });
    res.status(201).json(team);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

teamRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = teamSchema.parse(req.body);
    const team = await prisma.team.update({ where: { id: param(req, 'id') }, data });
    res.json(team);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

teamRouter.delete('/:id', async (req, res: Response) => {
  await prisma.team.delete({ where: { id: param(req, 'id') } });
  res.status(204).send();
});
