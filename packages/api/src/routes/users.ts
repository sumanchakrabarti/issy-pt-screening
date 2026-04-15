import { Router, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import prisma from '../db';
import { param } from '../middleware/params';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

export const userRouter = Router();
userRouter.use(authenticate);
userRouter.use(requireRole('admin'));

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['admin', 'clinician', 'coach', 'parent']),
  clinicId: z.string().optional(),
});

const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['admin', 'clinician', 'coach', 'parent']).optional(),
  clinicId: z.string().nullable().optional(),
});

// List all users
userRouter.get('/', async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, firstName: true, lastName: true, role: true, clinicId: true, clinic: true, createdAt: true },
    orderBy: { lastName: 'asc' },
  });
  res.json(users);
});

// Get single user
userRouter.get('/:id', async (req, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: param(req, 'id') },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, clinicId: true, clinic: true, createdAt: true },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json(user);
});

// Create user (admin invites)
userRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createUserSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) { res.status(409).json({ error: 'Email already registered' }); return; }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { email: data.email, passwordHash, firstName: data.firstName, lastName: data.lastName, role: data.role, clinicId: data.clinicId },
      select: { id: true, email: true, firstName: true, lastName: true, role: true, clinicId: true, createdAt: true },
    });
    res.status(201).json(user);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user role/info
userRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateUserSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: param(req, 'id') },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, role: true, clinicId: true, createdAt: true },
    });
    res.json(user);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user
userRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  if (req.user!.userId === param(req, 'id')) {
    res.status(400).json({ error: 'Cannot delete your own account' });
    return;
  }
  await prisma.user.delete({ where: { id: param(req, 'id') } });
  res.status(204).send();
});

// Dashboard stats
export const statsRouter = Router();
statsRouter.use(authenticate);

statsRouter.get('/', async (req, res: Response) => {
  const { role, userId } = (req as AuthRequest).user!;

  // Build scope filters based on role
  let clubFilter: Record<string, unknown> = {};
  let teamFilter: Record<string, unknown> = {};
  let athleteFilter: Record<string, unknown> = {};
  let sessionFilter: Record<string, unknown> = {};

  if (role === 'coach') {
    const coachClubs = await prisma.coachClub.findMany({ where: { userId }, select: { clubId: true } });
    const clubIds = coachClubs.map((c) => c.clubId);
    clubFilter = { id: { in: clubIds } };
    teamFilter = { clubId: { in: clubIds } };
    athleteFilter = { team: { clubId: { in: clubIds } } };
    sessionFilter = { team: { clubId: { in: clubIds } } };
  } else if (role === 'parent') {
    const parentAthletes = await prisma.parentAthlete.findMany({ where: { userId }, select: { athleteId: true } });
    const athleteIds = parentAthletes.map((pa) => pa.athleteId);
    clubFilter = { teams: { some: { athletes: { some: { id: { in: athleteIds } } } } } };
    teamFilter = { athletes: { some: { id: { in: athleteIds } } } };
    athleteFilter = { id: { in: athleteIds } };
    sessionFilter = { athleteId: { in: athleteIds } };
  }

  const isRestricted = role === 'coach' || role === 'parent';

  const [users, clinics, clubs, teams, athletes, sessions, completedSessions] = await Promise.all([
    isRestricted ? Promise.resolve(0) : prisma.user.count(),
    isRestricted ? Promise.resolve(0) : prisma.clinic.count(),
    prisma.club.count({ where: clubFilter }),
    prisma.team.count({ where: teamFilter }),
    prisma.athlete.count({ where: athleteFilter }),
    prisma.screeningSession.count({ where: sessionFilter }),
    prisma.screeningSession.count({ where: { ...sessionFilter, status: 'completed' } }),
  ]);

  const riskDistribution = await prisma.screeningSession.groupBy({
    by: ['riskCategory'],
    where: { ...sessionFilter, status: 'completed', riskCategory: { not: null } },
    _count: true,
  });

  const recentSessions = await prisma.screeningSession.findMany({
    take: 10,
    where: sessionFilter,
    orderBy: { date: 'desc' },
    include: { athlete: true, team: true },
  });

  res.json({
    counts: { users, clinics, clubs, teams, athletes, sessions, completedSessions },
    riskDistribution: riskDistribution.map((r) => ({ category: r.riskCategory, count: r._count })),
    recentSessions,
  });
});
