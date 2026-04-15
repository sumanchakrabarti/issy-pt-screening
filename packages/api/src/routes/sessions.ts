import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { param } from '../middleware/params';
import { authenticate, AuthRequest } from '../middleware/auth';
import { calculateRisk } from '../services/riskCalculation';
import { generatePrescription } from '../services/exercisePrescription';

export const sessionRouter = Router();
sessionRouter.use(authenticate);

const sessionSchema = z.object({
  athleteId: z.string().min(1),
  teamId: z.string().min(1),
  notes: z.string().optional(),
});

const scoreSchema = z.object({
  type: z.enum(['movement', 'strength', 'hop']),
  name: z.string().min(1),
  valueLeft: z.number().optional(),
  valueRight: z.number().optional(),
  score: z.number().optional(),
  notes: z.string().optional(),
});

// List sessions
sessionRouter.get('/', async (req, res: Response) => {
  const { role, userId } = (req as AuthRequest).user!;
  const athleteId = typeof req.query.athleteId === 'string' ? req.query.athleteId : undefined;
  const teamId = typeof req.query.teamId === 'string' ? req.query.teamId : undefined;
  const where: Record<string, unknown> = {};
  if (athleteId) where.athleteId = athleteId;
  if (teamId) where.teamId = teamId;

  if (role === 'coach') {
    const coachClubs = await prisma.coachClub.findMany({ where: { userId }, select: { clubId: true } });
    const clubIds = coachClubs.map((c) => c.clubId);
    where.team = { clubId: { in: clubIds } };
  } else if (role === 'parent') {
    const parentAthletes = await prisma.parentAthlete.findMany({ where: { userId }, select: { athleteId: true } });
    where.athleteId = { in: parentAthletes.map((pa) => pa.athleteId) };
  }

  const sessions = await prisma.screeningSession.findMany({
    where,
    include: { athlete: true, team: true },
    orderBy: { date: 'desc' },
  });
  res.json(sessions);
});

// Get single session with all data
sessionRouter.get('/:id', async (req, res: Response) => {
  const session = await prisma.screeningSession.findUnique({
    where: { id: param(req, 'id') },
    include: {
      athlete: true,
      team: { include: { club: true } },
      scoreRecords: true,
      exercisePrescriptions: true,
    },
  });
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  res.json(session);
});

// Create session
sessionRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = sessionSchema.parse(req.body);
    const session = await prisma.screeningSession.create({ data });
    res.status(201).json(session);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add score record to session
sessionRouter.post('/:id/scores', async (req: AuthRequest, res: Response) => {
  try {
    const data = scoreSchema.parse(req.body);
    const record = await prisma.scoreRecord.create({
      data: { ...data, sessionId: param(req, 'id') },
    });
    res.status(201).json(record);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate risk and complete session
sessionRouter.post('/:id/complete', async (req, res: Response) => {
  try {
    const sessionId = param(req, 'id');
    const session = await prisma.screeningSession.findUnique({
      where: { id: sessionId },
      include: { scoreRecords: true },
    });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

    const { riskScore, riskCategory } = calculateRisk(session.scoreRecords);

    // Generate exercise prescriptions based on scores
    const prescribedExercises = generatePrescription(session.scoreRecords, riskCategory);
    
    // Delete any existing prescriptions and create new ones
    await prisma.exercisePrescription.deleteMany({ where: { sessionId } });
    if (prescribedExercises.length > 0) {
      await prisma.exercisePrescription.createMany({
        data: prescribedExercises.map((ex) => ({ ...ex, sessionId })),
      });
    }

    const updated = await prisma.screeningSession.update({
      where: { id: sessionId },
      data: { status: 'completed', riskScore, riskCategory },
      include: { scoreRecords: true, exercisePrescriptions: true, athlete: true },
    });
    res.json(updated);
  } catch (err) {
    console.error('Complete session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete session and related data
sessionRouter.delete('/:id', async (req, res: Response) => {
  const sessionId = param(req, 'id');
  await prisma.scoreRecord.deleteMany({ where: { sessionId } });
  await prisma.exercisePrescription.deleteMany({ where: { sessionId } });
  await prisma.screeningSession.delete({ where: { id: sessionId } });
  res.status(204).send();
});
