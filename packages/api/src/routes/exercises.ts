import { Router, Response } from 'express';
import prisma from '../db';
import { param } from '../middleware/params';
import { authenticate, AuthRequest } from '../middleware/auth';

export const exerciseRouter = Router();
exerciseRouter.use(authenticate);

const exerciseInclude = {
  muscleGroups: { include: { muscleGroup: true } },
  ligamentGroups: { include: { ligamentGroup: true } },
  videos: true,
} as const;

// Flatten the join-table shape into simple arrays for clients.
function serialize(exercise: any) {
  return {
    ...exercise,
    muscleGroups: exercise.muscleGroups.map((m: any) => m.muscleGroup),
    ligamentGroups: exercise.ligamentGroups.map((l: any) => l.ligamentGroup),
  };
}

// List / search exercises.
// Query params (all optional):
//   q            - free-text match on name/description
//   category     - e.g. strengthening, balance, plyometric, mobility, stretching, proprioception
//   bodyRegion   - e.g. lower_leg, ankle, foot, knee, hip, thigh
//   difficulty   - beginner, intermediate, advanced
//   muscleGroup  - muscle group name or id (repeatable) — matches ANY provided
//   ligamentGroup- ligament group name or id (repeatable) — matches ANY provided
exerciseRouter.get('/', async (req, res: Response) => {
  const q = typeof req.query.q === 'string' ? req.query.q : undefined;
  const category = typeof req.query.category === 'string' ? req.query.category : undefined;
  const bodyRegion = typeof req.query.bodyRegion === 'string' ? req.query.bodyRegion : undefined;
  const difficulty = typeof req.query.difficulty === 'string' ? req.query.difficulty : undefined;

  const asArray = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string')
      : typeof v === 'string' ? [v] : [];
  const muscleGroups = asArray(req.query.muscleGroup);
  const ligamentGroups = asArray(req.query.ligamentGroup);

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (bodyRegion) where.bodyRegion = bodyRegion;
  if (difficulty) where.difficulty = difficulty;
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { description: { contains: q } },
    ];
  }
  if (muscleGroups.length > 0) {
    where.muscleGroups = {
      some: { muscleGroup: { OR: [{ id: { in: muscleGroups } }, { name: { in: muscleGroups } }] } },
    };
  }
  if (ligamentGroups.length > 0) {
    where.ligamentGroups = {
      some: { ligamentGroup: { OR: [{ id: { in: ligamentGroups } }, { name: { in: ligamentGroups } }] } },
    };
  }

  const exercises = await prisma.exercise.findMany({
    where,
    include: exerciseInclude,
    orderBy: { name: 'asc' },
  });
  res.json(exercises.map(serialize));
});

// Distinct tag lists to power filter UIs.
exerciseRouter.get('/tags', async (_req, res: Response) => {
  const [muscleGroups, ligamentGroups] = await Promise.all([
    prisma.muscleGroup.findMany({ orderBy: { name: 'asc' } }),
    prisma.ligamentGroup.findMany({ orderBy: { name: 'asc' } }),
  ]);
  res.json({ muscleGroups, ligamentGroups });
});

exerciseRouter.get('/:id', async (req, res: Response) => {
  const exercise = await prisma.exercise.findUnique({
    where: { id: param(req, 'id') },
    include: exerciseInclude,
  });
  if (!exercise) { res.status(404).json({ error: 'Exercise not found' }); return; }
  res.json(serialize(exercise));
});
