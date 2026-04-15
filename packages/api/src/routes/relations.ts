import { Router, Response } from 'express';
import prisma from '../db';
import { param } from '../middleware/params';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

export const relationRouter = Router();
relationRouter.use(authenticate);
relationRouter.use(requireRole('admin'));

// --- Coach ↔ Club ---

// Get clubs for a coach
relationRouter.get('/coaches/:id/clubs', async (req, res: Response) => {
  const links = await prisma.coachClub.findMany({
    where: { userId: param(req, 'id') },
    include: { club: true },
  });
  res.json(links.map((l) => l.club));
});

// Get coaches for a club
relationRouter.get('/clubs/:id/coaches', async (req, res: Response) => {
  const links = await prisma.coachClub.findMany({
    where: { clubId: param(req, 'id') },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
  });
  res.json(links.map((l) => l.user));
});

// Assign coach to club
relationRouter.post('/coaches/:userId/clubs/:clubId', async (req, res: Response) => {
  try {
    await prisma.coachClub.create({
      data: { userId: param(req, 'userId'), clubId: param(req, 'clubId') },
    });
    res.status(201).json({ success: true });
  } catch {
    res.status(409).json({ error: 'Relationship already exists' });
  }
});

// Remove coach from club
relationRouter.delete('/coaches/:userId/clubs/:clubId', async (req, res: Response) => {
  await prisma.coachClub.deleteMany({
    where: { userId: param(req, 'userId'), clubId: param(req, 'clubId') },
  });
  res.status(204).send();
});

// --- Parent ↔ Athlete ---

// Get athletes for a parent
relationRouter.get('/parents/:id/athletes', async (req, res: Response) => {
  const links = await prisma.parentAthlete.findMany({
    where: { userId: param(req, 'id') },
    include: { athlete: { include: { team: true } } },
  });
  res.json(links.map((l) => l.athlete));
});

// Get parents for an athlete
relationRouter.get('/athletes/:id/parents', async (req, res: Response) => {
  const links = await prisma.parentAthlete.findMany({
    where: { athleteId: param(req, 'id') },
    include: { user: { select: { id: true, email: true, firstName: true, lastName: true, role: true } } },
  });
  res.json(links.map((l) => l.user));
});

// Assign parent to athlete
relationRouter.post('/parents/:userId/athletes/:athleteId', async (req, res: Response) => {
  try {
    await prisma.parentAthlete.create({
      data: { userId: param(req, 'userId'), athleteId: param(req, 'athleteId') },
    });
    res.status(201).json({ success: true });
  } catch {
    res.status(409).json({ error: 'Relationship already exists' });
  }
});

// Remove parent from athlete
relationRouter.delete('/parents/:userId/athletes/:athleteId', async (req, res: Response) => {
  await prisma.parentAthlete.deleteMany({
    where: { userId: param(req, 'userId'), athleteId: param(req, 'athleteId') },
  });
  res.status(204).send();
});
