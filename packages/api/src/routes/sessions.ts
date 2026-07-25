import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { param } from '../middleware/params';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { calculateRisk } from '../services/riskCalculation';

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

const prescriptionSchema = z.object({
  exerciseId: z.string().min(1),
  sets: z.number().int().optional(),
  reps: z.number().int().optional(),
  duration: z.string().optional(),
  notes: z.string().optional(),
});

// Partial schema for updates — every field optional, exerciseId cannot be blanked.
const prescriptionUpdateSchema = z.object({
  exerciseId: z.string().min(1).optional(),
  sets: z.number().int().nullable().optional(),
  reps: z.number().int().nullable().optional(),
  duration: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

// List sessions
sessionRouter.get('/', async (req, res: Response) => {
  const { role, userId } = (req as AuthRequest).user!;
  const athleteId = typeof req.query.athleteId === 'string' ? req.query.athleteId : undefined;
  const teamId = typeof req.query.teamId === 'string' ? req.query.teamId : undefined;
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;
  const where: Record<string, unknown> = {};
  if (athleteId) where.athleteId = athleteId;
  if (teamId) where.teamId = teamId;
  if (status) where.status = status;

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
      exercisePrescriptions: { include: { exercise: true } },
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

// Calculate risk and move the session into the review queue.
// Prescriptions are NOT generated here — they are a result of the screening that
// a clinician selects during review. This only scores the screening and flags it
// as needing review.
sessionRouter.post('/:id/complete', async (req, res: Response) => {
  try {
    const sessionId = param(req, 'id');
    const session = await prisma.screeningSession.findUnique({
      where: { id: sessionId },
      include: { scoreRecords: true },
    });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }

    const { riskScore, riskCategory } = calculateRisk(session.scoreRecords);

    const updated = await prisma.screeningSession.update({
      where: { id: sessionId },
      data: { status: 'needs_review', riskScore, riskCategory },
      include: {
        scoreRecords: true,
        exercisePrescriptions: { include: { exercise: true } },
        athlete: true,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('Complete session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Finalize a reviewed screening. Only a clinician/admin can sign off, marking the
// screening (and its selected exercise prescriptions) as complete.
sessionRouter.post('/:id/finalize', requireRole('admin', 'clinician'), async (req, res: Response) => {
  try {
    const sessionId = param(req, 'id');
    const session = await prisma.screeningSession.findUnique({ where: { id: sessionId } });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
    if (session.status === 'in_progress') {
      res.status(400).json({ error: 'Screening must be scored before it can be reviewed' });
      return;
    }

    const updated = await prisma.screeningSession.update({
      where: { id: sessionId },
      data: { status: 'completed' },
      include: {
        scoreRecords: true,
        exercisePrescriptions: { include: { exercise: true } },
        athlete: true,
      },
    });
    res.json(updated);
  } catch (err) {
    console.error('Finalize session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Post-completion actions available to the athlete/family after a screening has
// been finalized. From a `completed` screening the athlete can either request a
// consultation with a clinician or archive it (no further follow-up needed).
const sessionInclude = {
  scoreRecords: true,
  exercisePrescriptions: { include: { exercise: true } },
  athlete: true,
} as const;

// Athlete/family requests a consultation on a completed screening.
sessionRouter.post('/:id/request-consultation', async (req, res: Response) => {
  try {
    const sessionId = param(req, 'id');
    const session = await prisma.screeningSession.findUnique({ where: { id: sessionId } });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
    if (session.status !== 'completed') {
      res.status(400).json({ error: 'A consultation can only be requested for a completed screening' });
      return;
    }

    const updated = await prisma.screeningSession.update({
      where: { id: sessionId },
      data: { status: 'consultation_requested' },
      include: sessionInclude,
    });
    res.json(updated);
  } catch (err) {
    console.error('Request consultation error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Archive a screening once no further follow-up is needed. This is the terminal
// state. Anyone can archive a `completed` screening; archiving one that is in the
// `consultation_requested` state requires a clinician/admin (they resolve the request).
sessionRouter.post('/:id/archive', async (req, res: Response) => {
  try {
    const sessionId = param(req, 'id');
    const session = await prisma.screeningSession.findUnique({ where: { id: sessionId } });
    if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
    if (session.status !== 'completed' && session.status !== 'consultation_requested') {
      res.status(400).json({ error: 'Only a completed or consultation-requested screening can be archived' });
      return;
    }

    if (session.status === 'consultation_requested') {
      const { role } = (req as AuthRequest).user!;
      if (role !== 'admin' && role !== 'clinician') {
        res.status(403).json({ error: 'Only a clinician or admin can archive a screening with a requested consultation' });
        return;
      }
    }

    const updated = await prisma.screeningSession.update({
      where: { id: sessionId },
      data: { status: 'archived' },
      include: sessionInclude,
    });
    res.json(updated);
  } catch (err) {
    console.error('Archive session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// Per-session exercise prescriptions (manual management by clinicians/admins).
// ---------------------------------------------------------------------------

// Add a prescription to a session.
sessionRouter.post('/:id/prescriptions', requireRole('admin', 'clinician'), async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = param(req, 'id');
    const data = prescriptionSchema.parse(req.body);
    const exercise = await prisma.exercise.findUnique({ where: { id: data.exerciseId } });
    if (!exercise) { res.status(400).json({ error: 'Exercise not found' }); return; }
    const prescription = await prisma.exercisePrescription.create({
      data: { ...data, sessionId },
      include: { exercise: true },
    });
    res.status(201).json(prescription);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a prescription on a session.
sessionRouter.put('/:id/prescriptions/:pid', requireRole('admin', 'clinician'), async (req: AuthRequest, res: Response) => {
  try {
    const sessionId = param(req, 'id');
    const pid = param(req, 'pid');
    const data = prescriptionUpdateSchema.parse(req.body);

    const existing = await prisma.exercisePrescription.findUnique({ where: { id: pid } });
    if (!existing || existing.sessionId !== sessionId) {
      res.status(404).json({ error: 'Prescription not found' }); return;
    }
    if (data.exerciseId) {
      const exercise = await prisma.exercise.findUnique({ where: { id: data.exerciseId } });
      if (!exercise) { res.status(400).json({ error: 'Exercise not found' }); return; }
    }
    const prescription = await prisma.exercisePrescription.update({
      where: { id: pid },
      data,
      include: { exercise: true },
    });
    res.json(prescription);
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove a prescription from a session.
sessionRouter.delete('/:id/prescriptions/:pid', requireRole('admin', 'clinician'), async (req, res: Response) => {
  const sessionId = param(req, 'id');
  const pid = param(req, 'pid');
  const existing = await prisma.exercisePrescription.findUnique({ where: { id: pid } });
  if (!existing || existing.sessionId !== sessionId) {
    res.status(404).json({ error: 'Prescription not found' }); return;
  }
  await prisma.exercisePrescription.delete({ where: { id: pid } });
  res.status(204).send();
});

// Delete session and related data
sessionRouter.delete('/:id', async (req, res: Response) => {
  const sessionId = param(req, 'id');
  await prisma.scoreRecord.deleteMany({ where: { sessionId } });
  await prisma.exercisePrescription.deleteMany({ where: { sessionId } });
  await prisma.screeningSession.delete({ where: { id: sessionId } });
  res.status(204).send();
});
