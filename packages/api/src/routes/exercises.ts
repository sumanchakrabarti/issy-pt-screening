import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../db';
import { param } from '../middleware/params';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

export const exerciseRouter = Router();
exerciseRouter.use(authenticate);

const CATEGORIES = ['strengthening', 'balance', 'plyometric', 'mobility', 'stretching', 'proprioception'] as const;
const BODY_REGIONS = ['lower_leg', 'ankle', 'foot', 'knee', 'hip', 'thigh'] as const;
const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

const videoSchema = z.object({
  url: z.string().min(1),
  title: z.string().optional(),
  source: z.string().optional(),
  durationSeconds: z.number().int().optional(),
});

const exerciseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  instructions: z.string().optional(),
  category: z.enum(CATEGORIES),
  bodyRegion: z.enum(BODY_REGIONS).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  defaultSets: z.number().int().optional(),
  defaultReps: z.number().int().optional(),
  defaultDuration: z.string().optional(),
  equipment: z.string().optional(),
  // Arrays of MuscleGroup / LigamentGroup ids to associate with this exercise.
  muscleGroupIds: z.array(z.string()).optional(),
  ligamentGroupIds: z.array(z.string()).optional(),
  // Full replacement set of instructional videos.
  videos: z.array(videoSchema).optional(),
});

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

// Build the nested-write payload for muscle/ligament group associations and videos.
type ExerciseInput = z.infer<typeof exerciseSchema>;
function buildRelations(data: ExerciseInput) {
  const relations: Record<string, unknown> = {};
  if (data.muscleGroupIds) {
    relations.muscleGroups = {
      create: data.muscleGroupIds.map((muscleGroupId) => ({ muscleGroupId })),
    };
  }
  if (data.ligamentGroupIds) {
    relations.ligamentGroups = {
      create: data.ligamentGroupIds.map((ligamentGroupId) => ({ ligamentGroupId })),
    };
  }
  if (data.videos) {
    relations.videos = { create: data.videos };
  }
  return relations;
}

// Scalar (non-relational) fields of the exercise.
function scalarFields(data: ExerciseInput) {
  return {
    name: data.name,
    description: data.description,
    instructions: data.instructions,
    category: data.category,
    bodyRegion: data.bodyRegion,
    difficulty: data.difficulty,
    defaultSets: data.defaultSets,
    defaultReps: data.defaultReps,
    defaultDuration: data.defaultDuration,
    equipment: data.equipment,
  };
}

exerciseRouter.post('/', requireRole('admin', 'clinician'), async (req: AuthRequest, res: Response) => {
  try {
    const data = exerciseSchema.parse(req.body);
    const exercise = await prisma.exercise.create({
      data: { ...scalarFields(data), ...buildRelations(data) },
      include: exerciseInclude,
    });
    res.status(201).json(serialize(exercise));
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

exerciseRouter.put('/:id', requireRole('admin', 'clinician'), async (req: AuthRequest, res: Response) => {
  try {
    const id = param(req, 'id');
    const data = exerciseSchema.parse(req.body);

    // Replace associations only when the corresponding array is provided, so a
    // caller can update scalar fields without wiping tags/videos.
    const exercise = await prisma.$transaction(async (tx) => {
      if (data.muscleGroupIds) {
        await tx.exerciseMuscleGroup.deleteMany({ where: { exerciseId: id } });
      }
      if (data.ligamentGroupIds) {
        await tx.exerciseLigamentGroup.deleteMany({ where: { exerciseId: id } });
      }
      if (data.videos) {
        await tx.exerciseVideo.deleteMany({ where: { exerciseId: id } });
      }
      return tx.exercise.update({
        where: { id },
        data: { ...scalarFields(data), ...buildRelations(data) },
        include: exerciseInclude,
      });
    });
    res.json(serialize(exercise));
  } catch (err) {
    if (err instanceof z.ZodError) { res.status(400).json({ error: 'Validation failed', details: err.errors }); return; }
    res.status(500).json({ error: 'Internal server error' });
  }
});

exerciseRouter.delete('/:id', requireRole('admin', 'clinician'), async (req, res: Response) => {
  const id = param(req, 'id');
  // Block deletion if the exercise is referenced by any prescription (FK has no cascade).
  const inUse = await prisma.exercisePrescription.count({ where: { exerciseId: id } });
  if (inUse > 0) {
    res.status(409).json({ error: 'Cannot delete: exercise is used by existing prescriptions' });
    return;
  }
  await prisma.exercise.delete({ where: { id } });
  res.status(204).send();
});
