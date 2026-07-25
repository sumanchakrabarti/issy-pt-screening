import { ScoreRecord } from '@prisma/client';

// Catalog taxonomy — kept in sync with the `Exercise` model in schema.prisma.
type ExerciseCategory =
  | 'strengthening'
  | 'balance'
  | 'plyometric'
  | 'mobility'
  | 'stretching'
  | 'proprioception';
type BodyRegion = 'lower_leg' | 'ankle' | 'foot' | 'knee' | 'hip' | 'thigh';
type Difficulty = 'beginner' | 'intermediate' | 'advanced';

/** Catalog metadata for a prescribed exercise. Mirrors the `Exercise` model
 *  so an unseeded exercise can be upserted into the catalog with correct tags. */
interface PrescribedExerciseCatalog {
  name: string;
  category: ExerciseCategory;
  bodyRegion: BodyRegion;
  difficulty: Difficulty;
}

interface PrescribedExercise {
  exercise: PrescribedExerciseCatalog;
  sets: number;
  reps: number;
  duration?: string;
  notes?: string;
}

/**
 * Generates exercise prescriptions based on screening score records and risk category.
 * Maps identified deficits to targeted exercises.
 */
export function generatePrescription(
  scores: ScoreRecord[],
  riskCategory: string
): PrescribedExercise[] {
  const exercises: PrescribedExercise[] = [];

  const movementScores = scores.filter((s) => s.type === 'movement');
  const strengthScores = scores.filter((s) => s.type === 'strength');
  const hopScores = scores.filter((s) => s.type === 'hop');

  // Check for movement deficits (score > 40 = concern)
  for (const s of movementScores) {
    if (s.score !== null && s.score >= 40) {
      exercises.push(...getMovementExercises(s.name, riskCategory));
    }
  }

  // Check for strength asymmetry (> 15% difference)
  for (const s of strengthScores) {
    if (s.valueLeft !== null && s.valueRight !== null) {
      const max = Math.max(s.valueLeft, s.valueRight);
      if (max > 0) {
        const asymmetry = Math.abs(s.valueLeft - s.valueRight) / max;
        if (asymmetry > 0.15) {
          exercises.push(...getStrengthExercises(s.name, riskCategory));
        }
      }
    }
  }

  // Check for hop asymmetry (> 10% difference)
  for (const s of hopScores) {
    if (s.valueLeft !== null && s.valueRight !== null) {
      const max = Math.max(s.valueLeft, s.valueRight);
      if (max > 0) {
        const asymmetry = Math.abs(s.valueLeft - s.valueRight) / max;
        if (asymmetry > 0.10) {
          exercises.push(...getHopExercises(s.name, riskCategory));
        }
      }
    }
  }

  // If no specific deficits but moderate+ risk, add general prevention
  if (exercises.length === 0 && riskCategory !== 'low') {
    exercises.push(
      { exercise: { name: 'Single Leg Balance', category: 'proprioception', bodyRegion: 'ankle', difficulty: 'beginner' }, sets: 3, reps: 1, duration: '30 seconds each side', notes: 'General ACL prevention' },
      { exercise: { name: 'Nordic Hamstring Curl', category: 'strengthening', bodyRegion: 'thigh', difficulty: 'advanced' }, sets: 3, reps: 6, notes: 'Eccentric hamstring strengthening' },
      { exercise: { name: 'Lateral Band Walk', category: 'strengthening', bodyRegion: 'hip', difficulty: 'beginner' }, sets: 3, reps: 15, notes: 'Hip abductor activation' },
    );
  }

  // Deduplicate by exercise name
  const seen = new Set<string>();
  return exercises.filter((e) => {
    if (seen.has(e.exercise.name)) return false;
    seen.add(e.exercise.name);
    return true;
  });
}

function intensityForRisk(risk: string): { sets: number; reps: number } {
  switch (risk) {
    case 'very_high': return { sets: 4, reps: 12 };
    case 'high': return { sets: 3, reps: 12 };
    case 'moderate': return { sets: 3, reps: 10 };
    default: return { sets: 2, reps: 10 };
  }
}

function getMovementExercises(testName: string, risk: string): PrescribedExercise[] {
  const { sets, reps } = intensityForRisk(risk);
  const nameL = testName.toLowerCase();

  if (nameL.includes('squat')) {
    return [
      { exercise: { name: 'Goblet Squat', category: 'strengthening', bodyRegion: 'thigh', difficulty: 'beginner' }, sets, reps, notes: 'Focus on knee tracking over toes' },
      { exercise: { name: 'Single Leg Squat to Box', category: 'strengthening', bodyRegion: 'thigh', difficulty: 'intermediate' }, sets, reps: Math.floor(reps * 0.6), notes: 'Control valgus collapse' },
    ];
  }
  if (nameL.includes('lunge') || nameL.includes('step')) {
    return [
      { exercise: { name: 'Forward Lunge with Pause', category: 'strengthening', bodyRegion: 'thigh', difficulty: 'beginner' }, sets, reps, notes: 'Hold 2s at bottom, maintain alignment' },
      { exercise: { name: 'Lateral Lunge', category: 'strengthening', bodyRegion: 'hip', difficulty: 'beginner' }, sets, reps, notes: 'Hip hinge emphasis' },
    ];
  }
  if (nameL.includes('jump') || nameL.includes('land') || nameL.includes('drop')) {
    return [
      { exercise: { name: 'Box Drop Landing', category: 'plyometric', bodyRegion: 'knee', difficulty: 'intermediate' }, sets, reps: Math.floor(reps * 0.5), notes: 'Soft landing, knees aligned' },
      { exercise: { name: 'Single Leg Hop and Stick', category: 'plyometric', bodyRegion: 'knee', difficulty: 'advanced' }, sets, reps: 6, notes: 'Stick landing for 3 seconds' },
    ];
  }
  return [
    { exercise: { name: 'Single Leg Balance on Unstable Surface', category: 'proprioception', bodyRegion: 'ankle', difficulty: 'beginner' }, sets, reps: 1, duration: '30 seconds each side', notes: `Address deficit in: ${testName}` },
  ];
}

function getStrengthExercises(testName: string, risk: string): PrescribedExercise[] {
  const { sets, reps } = intensityForRisk(risk);
  const nameL = testName.toLowerCase();

  if (nameL.includes('quad')) {
    return [
      { exercise: { name: 'Single Leg Press', category: 'strengthening', bodyRegion: 'thigh', difficulty: 'intermediate' }, sets, reps, notes: 'Focus on weaker side' },
      { exercise: { name: 'Terminal Knee Extension', category: 'strengthening', bodyRegion: 'knee', difficulty: 'beginner' }, sets, reps: 15, notes: 'Band resistance' },
    ];
  }
  if (nameL.includes('hamstring') || nameL.includes('ham')) {
    return [
      { exercise: { name: 'Nordic Hamstring Curl', category: 'strengthening', bodyRegion: 'thigh', difficulty: 'advanced' }, sets, reps: 6, notes: 'Eccentric control' },
      { exercise: { name: 'Single Leg Romanian Deadlift', category: 'strengthening', bodyRegion: 'thigh', difficulty: 'intermediate' }, sets, reps, notes: 'Hamstring and glute activation' },
    ];
  }
  if (nameL.includes('hip') || nameL.includes('glute')) {
    return [
      { exercise: { name: 'Clamshell with Band', category: 'strengthening', bodyRegion: 'hip', difficulty: 'beginner' }, sets, reps: 15, notes: 'External rotation strengthening' },
      { exercise: { name: 'Side-Lying Hip Abduction', category: 'strengthening', bodyRegion: 'hip', difficulty: 'beginner' }, sets, reps: 15, notes: 'Focus on weaker side' },
    ];
  }
  return [
    { exercise: { name: 'Single Leg Strength Exercise', category: 'strengthening', bodyRegion: 'thigh', difficulty: 'beginner' }, sets, reps, notes: `Address asymmetry in: ${testName}` },
  ];
}

function getHopExercises(testName: string, risk: string): PrescribedExercise[] {
  const { sets } = intensityForRisk(risk);
  return [
    { exercise: { name: 'Single Leg Hop Progression', category: 'plyometric', bodyRegion: 'knee', difficulty: 'intermediate' }, sets, reps: 8, notes: `Asymmetry detected in: ${testName}. Start with small hops, progress distance.` },
    { exercise: { name: 'Lateral Bound and Stick', category: 'plyometric', bodyRegion: 'knee', difficulty: 'advanced' }, sets, reps: 6, notes: 'Control landing, stick for 3s' },
  ];
}
