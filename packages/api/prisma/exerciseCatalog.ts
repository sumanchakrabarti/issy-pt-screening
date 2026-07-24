import { PrismaClient } from '@prisma/client';

/**
 * Exercise catalog seed data and loader.
 *
 * This module defines a reusable, searchable library of exercises (focused on
 * lower-leg injury rehab and prevention) along with the muscle and ligament
 * groups they target and links to demonstration videos.
 *
 * NOTE: The video URLs below are illustrative placeholders. Replace them with
 * your clinic's vetted demonstration videos before using in production.
 */

interface MuscleGroupSeed {
  name: string;
  region: string;
}

interface LigamentGroupSeed {
  name: string;
  joint: string;
}

interface VideoSeed {
  url: string;
  title: string;
  source: string;
  durationSeconds?: number;
}

interface ExerciseSeed {
  name: string;
  category: string; // strengthening, balance, plyometric, mobility, stretching, proprioception
  bodyRegion: string; // lower_leg, ankle, foot, knee, hip, thigh
  difficulty: string; // beginner, intermediate, advanced
  defaultSets?: number;
  defaultReps?: number;
  defaultDuration?: string;
  equipment?: string;
  description?: string;
  instructions?: string;
  muscles?: string[];
  ligaments?: string[];
  videos?: VideoSeed[];
}

const MUSCLE_GROUPS: MuscleGroupSeed[] = [
  { name: 'Gastrocnemius', region: 'lower_leg' },
  { name: 'Soleus', region: 'lower_leg' },
  { name: 'Achilles Tendon', region: 'lower_leg' },
  { name: 'Tibialis Anterior', region: 'lower_leg' },
  { name: 'Tibialis Posterior', region: 'lower_leg' },
  { name: 'Peroneus Longus', region: 'lower_leg' },
  { name: 'Peroneus Brevis', region: 'lower_leg' },
  { name: 'Intrinsic Foot Muscles', region: 'foot' },
  { name: 'Hamstrings', region: 'thigh' },
  { name: 'Quadriceps', region: 'thigh' },
  { name: 'Gluteus Medius', region: 'hip' },
  { name: 'Gluteus Maximus', region: 'hip' },
];

const LIGAMENT_GROUPS: LigamentGroupSeed[] = [
  { name: 'Anterior Talofibular Ligament (ATFL)', joint: 'ankle' },
  { name: 'Calcaneofibular Ligament (CFL)', joint: 'ankle' },
  { name: 'Posterior Talofibular Ligament (PTFL)', joint: 'ankle' },
  { name: 'Deltoid Ligament', joint: 'ankle' },
  { name: 'Anterior Inferior Tibiofibular Ligament (AITFL)', joint: 'ankle' },
  { name: 'Spring Ligament', joint: 'foot' },
  { name: 'Anterior Cruciate Ligament (ACL)', joint: 'knee' },
];

const EXERCISES: ExerciseSeed[] = [
  // ---- Lower-leg: calf / Achilles ----
  {
    name: 'Standing Calf Raise',
    category: 'strengthening', bodyRegion: 'lower_leg', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'bodyweight',
    description: 'Foundational calf strengthening targeting the gastrocnemius and soleus.',
    instructions: 'Stand tall, rise onto the balls of both feet, pause 1s at the top, then lower slowly under control.',
    muscles: ['Gastrocnemius', 'Soleus', 'Achilles Tendon'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-standing-calf-raise', title: 'Standing Calf Raise Demo', source: 'youtube', durationSeconds: 60 }],
  },
  {
    name: 'Seated Calf Raise',
    category: 'strengthening', bodyRegion: 'lower_leg', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'bodyweight',
    description: 'Bent-knee calf raise that biases the soleus.',
    instructions: 'Seated with knees bent 90°, drive through the balls of the feet to lift the heels, then lower slowly.',
    muscles: ['Soleus', 'Achilles Tendon'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-seated-calf-raise', title: 'Seated Calf Raise Demo', source: 'youtube', durationSeconds: 55 }],
  },
  {
    name: 'Eccentric Heel Drop (Alfredson Protocol)',
    category: 'strengthening', bodyRegion: 'lower_leg', difficulty: 'intermediate',
    defaultSets: 3, defaultReps: 15, equipment: 'step',
    description: 'Eccentric loading protocol commonly used for Achilles tendinopathy.',
    instructions: 'Rise onto both feet at the edge of a step, shift to the affected leg, then lower the heel slowly below the step. Use the other leg to return to the top.',
    muscles: ['Gastrocnemius', 'Soleus', 'Achilles Tendon'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-eccentric-heel-drop', title: 'Eccentric Heel Drop (Alfredson)', source: 'youtube', durationSeconds: 90 }],
  },
  // ---- Ankle: banded strengthening (sprain rehab) ----
  {
    name: 'Resisted Ankle Dorsiflexion',
    category: 'strengthening', bodyRegion: 'ankle', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'resistance band',
    description: 'Banded dorsiflexion for the tibialis anterior; useful for shin splints and foot-drop.',
    instructions: 'Anchor a band around the top of the foot, pull the toes toward the shin against resistance, then return slowly.',
    muscles: ['Tibialis Anterior'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-ankle-dorsiflexion', title: 'Resisted Dorsiflexion Demo', source: 'youtube', durationSeconds: 50 }],
  },
  {
    name: 'Resisted Ankle Plantarflexion',
    category: 'strengthening', bodyRegion: 'ankle', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'resistance band',
    description: 'Banded plantarflexion targeting the calf complex.',
    instructions: 'Loop a band around the ball of the foot, point the toes away against resistance, then return slowly.',
    muscles: ['Gastrocnemius', 'Soleus'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-ankle-plantarflexion', title: 'Resisted Plantarflexion Demo', source: 'youtube', durationSeconds: 50 }],
  },
  {
    name: 'Resisted Ankle Inversion',
    category: 'strengthening', bodyRegion: 'ankle', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'resistance band',
    description: 'Banded inversion for the tibialis posterior; supports the medial ankle.',
    instructions: 'With a band providing outward pull, turn the sole of the foot inward against resistance, then return slowly.',
    muscles: ['Tibialis Posterior'],
    ligaments: ['Deltoid Ligament', 'Spring Ligament'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-ankle-inversion', title: 'Resisted Inversion Demo', source: 'youtube', durationSeconds: 50 }],
  },
  {
    name: 'Resisted Ankle Eversion',
    category: 'strengthening', bodyRegion: 'ankle', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'resistance band',
    description: 'Banded eversion strengthening the peroneals — key for lateral ankle sprain rehab.',
    instructions: 'With a band providing inward pull, turn the sole of the foot outward against resistance, then return slowly.',
    muscles: ['Peroneus Longus', 'Peroneus Brevis'],
    ligaments: ['Anterior Talofibular Ligament (ATFL)', 'Calcaneofibular Ligament (CFL)'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-ankle-eversion', title: 'Resisted Eversion Demo', source: 'youtube', durationSeconds: 50 }],
  },
  // ---- Ankle: balance / proprioception ----
  {
    name: 'Single Leg Balance',
    category: 'proprioception', bodyRegion: 'ankle', difficulty: 'beginner',
    defaultSets: 3, defaultDuration: '30 seconds each side', equipment: 'bodyweight',
    description: 'Foundational proprioceptive drill for ankle stability after sprain.',
    instructions: 'Stand on one leg with a slight knee bend; hold your balance. Progress by closing the eyes.',
    muscles: ['Peroneus Longus', 'Tibialis Posterior'],
    ligaments: ['Anterior Talofibular Ligament (ATFL)', 'Calcaneofibular Ligament (CFL)', 'Posterior Talofibular Ligament (PTFL)'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-single-leg-balance', title: 'Single Leg Balance Demo', source: 'youtube', durationSeconds: 45 }],
  },
  {
    name: 'Single Leg Balance on Unstable Surface',
    category: 'proprioception', bodyRegion: 'ankle', difficulty: 'intermediate',
    defaultSets: 3, defaultDuration: '30 seconds each side', equipment: 'bosu / foam pad',
    description: 'Progression of single-leg balance onto an unstable surface.',
    instructions: 'Balance on one leg atop a foam pad or Bosu; maintain a level pelvis and quiet foot.',
    ligaments: ['Anterior Talofibular Ligament (ATFL)', 'Calcaneofibular Ligament (CFL)'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-unstable-balance', title: 'Unstable Surface Balance Demo', source: 'youtube', durationSeconds: 50 }],
  },
  {
    name: 'Bosu Ball Balance Reach',
    category: 'proprioception', bodyRegion: 'ankle', difficulty: 'intermediate',
    defaultSets: 3, defaultReps: 8, equipment: 'bosu',
    description: 'Dynamic single-leg reaching drill (star-excursion style) on an unstable surface.',
    instructions: 'Balance on one leg on a Bosu and reach the free foot forward, sideways, and behind without touching down.',
    ligaments: ['Anterior Talofibular Ligament (ATFL)', 'Calcaneofibular Ligament (CFL)', 'Deltoid Ligament'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-bosu-reach', title: 'Bosu Balance Reach Demo', source: 'youtube', durationSeconds: 60 }],
  },
  {
    name: 'Ankle Proprioception with Perturbation',
    category: 'proprioception', bodyRegion: 'ankle', difficulty: 'advanced',
    defaultSets: 3, defaultDuration: '30 seconds each side', equipment: 'partner / band',
    description: 'Reactive balance training with external perturbations for late-stage sprain rehab.',
    instructions: 'Balance on one leg while a partner applies light, unpredictable taps; resist and re-stabilize each time.',
    ligaments: ['Anterior Talofibular Ligament (ATFL)', 'Calcaneofibular Ligament (CFL)', 'Deltoid Ligament'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-perturbation', title: 'Perturbation Training Demo', source: 'youtube', durationSeconds: 70 }],
  },
  // ---- Foot / shin ----
  {
    name: 'Toe Curls with Towel',
    category: 'strengthening', bodyRegion: 'foot', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'towel',
    description: 'Intrinsic foot strengthening to support the medial arch.',
    instructions: 'Place a towel under the foot and scrunch it toward you using only the toes; reset and repeat.',
    muscles: ['Intrinsic Foot Muscles'],
    ligaments: ['Spring Ligament'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-towel-curls', title: 'Towel Toe Curls Demo', source: 'youtube', durationSeconds: 45 }],
  },
  {
    name: 'Heel Walks',
    category: 'strengthening', bodyRegion: 'lower_leg', difficulty: 'beginner',
    defaultSets: 3, defaultDuration: '20 meters', equipment: 'bodyweight',
    description: 'Tibialis anterior endurance drill often used for shin splints.',
    instructions: 'Walk on your heels with the toes lifted off the ground, keeping tall posture.',
    muscles: ['Tibialis Anterior'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-heel-walks', title: 'Heel Walks Demo', source: 'youtube', durationSeconds: 40 }],
  },
  {
    name: 'Toe Walks',
    category: 'strengthening', bodyRegion: 'lower_leg', difficulty: 'beginner',
    defaultSets: 3, defaultDuration: '20 meters', equipment: 'bodyweight',
    description: 'Calf endurance drill walking on the balls of the feet.',
    instructions: 'Walk on the balls of your feet with heels raised, maintaining a tall, controlled gait.',
    muscles: ['Gastrocnemius', 'Soleus'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-toe-walks', title: 'Toe Walks Demo', source: 'youtube', durationSeconds: 40 }],
  },
  // ---- Lower-leg: mobility / stretching ----
  {
    name: 'Gastrocnemius Wall Stretch',
    category: 'stretching', bodyRegion: 'lower_leg', difficulty: 'beginner',
    defaultSets: 3, defaultDuration: '30 seconds each side', equipment: 'wall',
    description: 'Straight-knee calf stretch targeting the gastrocnemius.',
    instructions: 'Hands on the wall, step one foot back keeping the knee straight and heel down; lean in until a stretch is felt.',
    muscles: ['Gastrocnemius', 'Achilles Tendon'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-gastroc-stretch', title: 'Gastrocnemius Stretch Demo', source: 'youtube', durationSeconds: 45 }],
  },
  {
    name: 'Soleus Wall Stretch (Bent Knee)',
    category: 'stretching', bodyRegion: 'lower_leg', difficulty: 'beginner',
    defaultSets: 3, defaultDuration: '30 seconds each side', equipment: 'wall',
    description: 'Bent-knee calf stretch that biases the soleus.',
    instructions: 'From the calf-stretch position, bend the back knee slightly while keeping the heel down to shift the stretch lower.',
    muscles: ['Soleus', 'Achilles Tendon'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-soleus-stretch', title: 'Soleus Stretch Demo', source: 'youtube', durationSeconds: 45 }],
  },
  {
    name: 'Ankle Alphabet',
    category: 'mobility', bodyRegion: 'ankle', difficulty: 'beginner',
    defaultSets: 2, defaultReps: 1, defaultDuration: 'trace A–Z',
    description: 'Active range-of-motion drill for the ankle in all directions.',
    instructions: 'With the foot lifted, trace the letters of the alphabet in the air using only the ankle.',
    muscles: ['Tibialis Anterior', 'Peroneus Longus', 'Tibialis Posterior'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-ankle-alphabet', title: 'Ankle Alphabet Demo', source: 'youtube', durationSeconds: 40 }],
  },
  {
    name: 'Lateral Hop and Stick',
    category: 'plyometric', bodyRegion: 'ankle', difficulty: 'advanced',
    defaultSets: 3, defaultReps: 6, equipment: 'bodyweight',
    description: 'Late-stage lateral plyometric for ankle stability and peroneal control.',
    instructions: 'Hop sideways onto one leg and "stick" the landing for 3 seconds with a stable, aligned ankle before the next rep.',
    muscles: ['Peroneus Longus', 'Peroneus Brevis'],
    ligaments: ['Anterior Talofibular Ligament (ATFL)', 'Calcaneofibular Ligament (CFL)'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-lateral-hop-stick', title: 'Lateral Hop and Stick Demo', source: 'youtube', durationSeconds: 55 }],
  },

  // ---- Knee / hip / thigh (used by the auto-prescription generator) ----
  {
    name: 'Nordic Hamstring Curl',
    category: 'strengthening', bodyRegion: 'thigh', difficulty: 'advanced',
    defaultSets: 3, defaultReps: 6, equipment: 'partner / anchor',
    description: 'Eccentric hamstring strengthening shown to reduce hamstring and knee injury risk.',
    instructions: 'Kneel with ankles anchored; lower the torso forward as slowly as possible, catching with the hands, then push back up.',
    muscles: ['Hamstrings'],
    videos: [{ url: 'https://www.youtube.com/watch?v=example-nordic-curl', title: 'Nordic Hamstring Curl Demo', source: 'youtube', durationSeconds: 60 }],
  },
  {
    name: 'Lateral Band Walk',
    category: 'strengthening', bodyRegion: 'hip', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'resistance band',
    description: 'Hip abductor activation for gluteus medius control.',
    instructions: 'With a band around the legs and a quarter-squat stance, step sideways keeping tension without letting the knees cave.',
    muscles: ['Gluteus Medius'],
  },
  {
    name: 'Goblet Squat',
    category: 'strengthening', bodyRegion: 'thigh', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 10, equipment: 'dumbbell / kettlebell',
    description: 'Bilateral squat pattern emphasizing knee tracking and depth.',
    instructions: 'Hold a weight at the chest, squat to depth keeping knees tracking over the toes, then drive up.',
    muscles: ['Quadriceps', 'Gluteus Maximus'],
  },
  {
    name: 'Single Leg Squat to Box',
    category: 'strengthening', bodyRegion: 'thigh', difficulty: 'intermediate',
    defaultSets: 3, defaultReps: 6, equipment: 'box',
    description: 'Single-leg squat controlling knee valgus onto a box target.',
    instructions: 'Standing on one leg, sit back to lightly touch a box, keeping the knee aligned over the foot, then stand.',
    muscles: ['Quadriceps', 'Gluteus Medius'],
    ligaments: ['Anterior Cruciate Ligament (ACL)'],
  },
  {
    name: 'Forward Lunge with Pause',
    category: 'strengthening', bodyRegion: 'thigh', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 10, equipment: 'bodyweight',
    description: 'Split-stance strengthening with an isometric pause for control.',
    instructions: 'Step forward into a lunge, pause 2s at the bottom with the knee aligned, then push back to standing.',
    muscles: ['Quadriceps', 'Gluteus Maximus'],
  },
  {
    name: 'Lateral Lunge',
    category: 'strengthening', bodyRegion: 'hip', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 10, equipment: 'bodyweight',
    description: 'Frontal-plane lunge emphasizing hip hinge and lateral control.',
    instructions: 'Step out to the side, hinge at the hip and bend the stepping knee, then return to center.',
    muscles: ['Gluteus Medius', 'Quadriceps'],
  },
  {
    name: 'Box Drop Landing',
    category: 'plyometric', bodyRegion: 'knee', difficulty: 'intermediate',
    defaultSets: 3, defaultReps: 6, equipment: 'box',
    description: 'Landing mechanics drill to reduce knee valgus and stiff landings.',
    instructions: 'Drop from a low box and land softly on both feet with bent knees aligned over the toes; absorb quietly.',
    muscles: ['Quadriceps', 'Hamstrings'],
    ligaments: ['Anterior Cruciate Ligament (ACL)'],
  },
  {
    name: 'Single Leg Hop and Stick',
    category: 'plyometric', bodyRegion: 'knee', difficulty: 'intermediate',
    defaultSets: 3, defaultReps: 6, equipment: 'bodyweight',
    description: 'Single-leg hop with a controlled stuck landing.',
    instructions: 'Hop forward onto one leg and stick the landing for 3 seconds with a stable, aligned knee.',
    ligaments: ['Anterior Cruciate Ligament (ACL)'],
  },
  {
    name: 'Single Leg Press',
    category: 'strengthening', bodyRegion: 'thigh', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 10, equipment: 'leg press machine',
    description: 'Unilateral quad strengthening to address side-to-side asymmetry.',
    instructions: 'Press through one leg with control, focusing extra volume on the weaker side.',
    muscles: ['Quadriceps'],
  },
  {
    name: 'Terminal Knee Extension',
    category: 'strengthening', bodyRegion: 'thigh', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'resistance band',
    description: 'Banded end-range knee extension for quad/VMO control.',
    instructions: 'With a band behind the knee, straighten the knee fully against resistance, then return slowly.',
    muscles: ['Quadriceps'],
  },
  {
    name: 'Single Leg Romanian Deadlift',
    category: 'strengthening', bodyRegion: 'thigh', difficulty: 'intermediate',
    defaultSets: 3, defaultReps: 12, equipment: 'dumbbell',
    description: 'Single-leg hip hinge for posterior chain strength and balance.',
    instructions: 'Balancing on one leg, hinge at the hip lowering the weight toward the floor with a flat back, then return.',
    muscles: ['Hamstrings', 'Gluteus Maximus'],
  },
  {
    name: 'Clamshell with Band',
    category: 'strengthening', bodyRegion: 'hip', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'resistance band',
    description: 'Hip external-rotation strengthening for the gluteus medius.',
    instructions: 'Side-lying with a band around the knees and hips/knees bent, open the top knee against the band, then lower slowly.',
    muscles: ['Gluteus Medius'],
  },
  {
    name: 'Side-Lying Hip Abduction',
    category: 'strengthening', bodyRegion: 'hip', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 15, equipment: 'bodyweight',
    description: 'Isolated gluteus medius strengthening.',
    instructions: 'Side-lying, lift the top leg straight up with the toes pointing forward, then lower slowly. Focus on the weaker side.',
    muscles: ['Gluteus Medius'],
  },
  {
    name: 'Single Leg Hop Progression',
    category: 'plyometric', bodyRegion: 'knee', difficulty: 'intermediate',
    defaultSets: 3, defaultReps: 8, equipment: 'bodyweight',
    description: 'Progressive single-leg hopping to restore hop symmetry.',
    instructions: 'Begin with small controlled hops on one leg, progressing distance as landing control improves.',
    ligaments: ['Anterior Cruciate Ligament (ACL)'],
  },
  {
    name: 'Lateral Bound and Stick',
    category: 'plyometric', bodyRegion: 'knee', difficulty: 'advanced',
    defaultSets: 3, defaultReps: 6, equipment: 'bodyweight',
    description: 'Frontal-plane bounding with a controlled landing for knee stability.',
    instructions: 'Bound laterally onto one leg and stick the landing for 3 seconds with the knee aligned, then bound back.',
    muscles: ['Gluteus Medius'],
    ligaments: ['Anterior Cruciate Ligament (ACL)'],
  },
  {
    name: 'Single Leg Strength Exercise',
    category: 'strengthening', bodyRegion: 'thigh', difficulty: 'beginner',
    defaultSets: 3, defaultReps: 10, equipment: 'bodyweight',
    description: 'General single-leg strengthening placeholder to address an identified asymmetry.',
    instructions: 'Perform a controlled single-leg strengthening movement (e.g., step-up or split squat), prioritizing the weaker side.',
    muscles: ['Quadriceps', 'Gluteus Medius'],
  },
];

/**
 * Seeds muscle groups, ligament groups, exercises, their tag links, and videos.
 * Idempotent: safe to run repeatedly (uses upsert on unique names).
 *
 * @returns a map of exercise name -> exercise id for linking prescriptions.
 */
export async function seedExerciseCatalog(prisma: PrismaClient): Promise<Map<string, string>> {
  // Muscle groups
  const muscleIdByName = new Map<string, string>();
  for (const mg of MUSCLE_GROUPS) {
    const rec = await prisma.muscleGroup.upsert({
      where: { name: mg.name },
      update: { region: mg.region },
      create: mg,
    });
    muscleIdByName.set(mg.name, rec.id);
  }

  // Ligament groups
  const ligamentIdByName = new Map<string, string>();
  for (const lg of LIGAMENT_GROUPS) {
    const rec = await prisma.ligamentGroup.upsert({
      where: { name: lg.name },
      update: { joint: lg.joint },
      create: lg,
    });
    ligamentIdByName.set(lg.name, rec.id);
  }

  // Exercises + tags + videos
  const exerciseIdByName = new Map<string, string>();
  for (const ex of EXERCISES) {
    const exercise = await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {
        description: ex.description,
        instructions: ex.instructions,
        category: ex.category,
        bodyRegion: ex.bodyRegion,
        difficulty: ex.difficulty,
        defaultSets: ex.defaultSets,
        defaultReps: ex.defaultReps,
        defaultDuration: ex.defaultDuration,
        equipment: ex.equipment,
      },
      create: {
        name: ex.name,
        description: ex.description,
        instructions: ex.instructions,
        category: ex.category,
        bodyRegion: ex.bodyRegion,
        difficulty: ex.difficulty,
        defaultSets: ex.defaultSets,
        defaultReps: ex.defaultReps,
        defaultDuration: ex.defaultDuration,
        equipment: ex.equipment,
      },
    });
    exerciseIdByName.set(ex.name, exercise.id);

    // Reset tag/video links so re-seeding stays consistent.
    await prisma.exerciseMuscleGroup.deleteMany({ where: { exerciseId: exercise.id } });
    await prisma.exerciseLigamentGroup.deleteMany({ where: { exerciseId: exercise.id } });
    await prisma.exerciseVideo.deleteMany({ where: { exerciseId: exercise.id } });

    for (const muscle of ex.muscles ?? []) {
      const muscleGroupId = muscleIdByName.get(muscle);
      if (muscleGroupId) {
        await prisma.exerciseMuscleGroup.create({ data: { exerciseId: exercise.id, muscleGroupId } });
      }
    }
    for (const ligament of ex.ligaments ?? []) {
      const ligamentGroupId = ligamentIdByName.get(ligament);
      if (ligamentGroupId) {
        await prisma.exerciseLigamentGroup.create({ data: { exerciseId: exercise.id, ligamentGroupId } });
      }
    }
    for (const video of ex.videos ?? []) {
      await prisma.exerciseVideo.create({ data: { exerciseId: exercise.id, ...video } });
    }
  }

  console.log(
    `Seeded exercise catalog: ${EXERCISES.length} exercises, ${MUSCLE_GROUPS.length} muscle groups, ${LIGAMENT_GROUPS.length} ligament groups`
  );
  return exerciseIdByName;
}
