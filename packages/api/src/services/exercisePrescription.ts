import { ScoreRecord } from '@prisma/client';

interface PrescribedExercise {
  exerciseName: string;
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
      { exerciseName: 'Single Leg Balance', sets: 3, reps: 1, duration: '30 seconds each side', notes: 'General ACL prevention' },
      { exerciseName: 'Nordic Hamstring Curl', sets: 3, reps: 6, notes: 'Eccentric hamstring strengthening' },
      { exerciseName: 'Lateral Band Walk', sets: 3, reps: 15, notes: 'Hip abductor activation' },
    );
  }

  // Deduplicate by exercise name
  const seen = new Set<string>();
  return exercises.filter((e) => {
    if (seen.has(e.exerciseName)) return false;
    seen.add(e.exerciseName);
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
      { exerciseName: 'Goblet Squat', sets, reps, notes: 'Focus on knee tracking over toes' },
      { exerciseName: 'Single Leg Squat to Box', sets, reps: Math.floor(reps * 0.6), notes: 'Control valgus collapse' },
    ];
  }
  if (nameL.includes('lunge') || nameL.includes('step')) {
    return [
      { exerciseName: 'Forward Lunge with Pause', sets, reps, notes: 'Hold 2s at bottom, maintain alignment' },
      { exerciseName: 'Lateral Lunge', sets, reps, notes: 'Hip hinge emphasis' },
    ];
  }
  if (nameL.includes('jump') || nameL.includes('land') || nameL.includes('drop')) {
    return [
      { exerciseName: 'Box Drop Landing', sets, reps: Math.floor(reps * 0.5), notes: 'Soft landing, knees aligned' },
      { exerciseName: 'Single Leg Hop and Stick', sets, reps: 6, notes: 'Stick landing for 3 seconds' },
    ];
  }
  return [
    { exerciseName: 'Single Leg Balance on Unstable Surface', sets, reps: 1, duration: '30 seconds each side', notes: `Address deficit in: ${testName}` },
  ];
}

function getStrengthExercises(testName: string, risk: string): PrescribedExercise[] {
  const { sets, reps } = intensityForRisk(risk);
  const nameL = testName.toLowerCase();

  if (nameL.includes('quad')) {
    return [
      { exerciseName: 'Single Leg Press', sets, reps, notes: 'Focus on weaker side' },
      { exerciseName: 'Terminal Knee Extension', sets, reps: 15, notes: 'Band resistance' },
    ];
  }
  if (nameL.includes('hamstring') || nameL.includes('ham')) {
    return [
      { exerciseName: 'Nordic Hamstring Curl', sets, reps: 6, notes: 'Eccentric control' },
      { exerciseName: 'Single Leg Romanian Deadlift', sets, reps, notes: 'Hamstring and glute activation' },
    ];
  }
  if (nameL.includes('hip') || nameL.includes('glute')) {
    return [
      { exerciseName: 'Clamshell with Band', sets, reps: 15, notes: 'External rotation strengthening' },
      { exerciseName: 'Side-Lying Hip Abduction', sets, reps: 15, notes: 'Focus on weaker side' },
    ];
  }
  return [
    { exerciseName: 'Single Leg Strength Exercise', sets, reps, notes: `Address asymmetry in: ${testName}` },
  ];
}

function getHopExercises(testName: string, risk: string): PrescribedExercise[] {
  const { sets } = intensityForRisk(risk);
  return [
    { exerciseName: 'Single Leg Hop Progression', sets, reps: 8, notes: `Asymmetry detected in: ${testName}. Start with small hops, progress distance.` },
    { exerciseName: 'Lateral Bound and Stick', sets, reps: 6, notes: 'Control landing, stick for 3s' },
  ];
}
