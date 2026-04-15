/** Predefined screening tests organized by category */

export interface TestDefinition {
  type: 'movement' | 'strength' | 'hop';
  name: string;
  label: string;
  description: string;
  inputMode: 'score' | 'bilateral' | 'both';
  scoreLabel?: string;
  unit?: string;
}

export const MOVEMENT_TESTS: TestDefinition[] = [
  {
    type: 'movement', name: 'single_leg_squat', label: 'Single Leg Squat',
    description: 'Assess knee valgus, trunk lean, and balance during single leg squat.',
    inputMode: 'score', scoreLabel: 'Quality Score (0–100, higher = more risk)',
  },
  {
    type: 'movement', name: 'drop_jump_landing', label: 'Drop Jump Landing',
    description: 'Observe frontal and sagittal plane knee position on landing from a box.',
    inputMode: 'score', scoreLabel: 'Quality Score (0–100, higher = more risk)',
  },
  {
    type: 'movement', name: 'forward_lunge', label: 'Forward Lunge',
    description: 'Evaluate trunk, hip, knee, and ankle alignment during forward lunge.',
    inputMode: 'score', scoreLabel: 'Quality Score (0–100, higher = more risk)',
  },
  {
    type: 'movement', name: 'lateral_step_down', label: 'Lateral Step Down',
    description: 'Assess pelvic drop, knee valgus, and hip control on step down.',
    inputMode: 'score', scoreLabel: 'Quality Score (0–100, higher = more risk)',
  },
];

export const STRENGTH_TESTS: TestDefinition[] = [
  {
    type: 'strength', name: 'quad_strength', label: 'Quad Strength',
    description: 'Isometric or isokinetic quadriceps strength (e.g., hand-held dynamometer).',
    inputMode: 'bilateral', unit: 'lbs',
  },
  {
    type: 'strength', name: 'hamstring_strength', label: 'Hamstring Strength',
    description: 'Isometric or isokinetic hamstring strength measurement.',
    inputMode: 'bilateral', unit: 'lbs',
  },
  {
    type: 'strength', name: 'hip_abduction_strength', label: 'Hip Abduction Strength',
    description: 'Side-lying or standing hip abduction strength.',
    inputMode: 'bilateral', unit: 'lbs',
  },
];

export const HOP_TESTS: TestDefinition[] = [
  {
    type: 'hop', name: 'single_hop_distance', label: 'Single Hop for Distance',
    description: 'Maximum single leg hop for distance, measured in centimeters.',
    inputMode: 'bilateral', unit: 'cm',
  },
  {
    type: 'hop', name: 'triple_hop_distance', label: 'Triple Hop for Distance',
    description: 'Three consecutive single leg hops for total distance.',
    inputMode: 'bilateral', unit: 'cm',
  },
  {
    type: 'hop', name: 'crossover_hop_distance', label: 'Crossover Hop for Distance',
    description: 'Three hops crossing over a line for total distance.',
    inputMode: 'bilateral', unit: 'cm',
  },
  {
    type: 'hop', name: 'timed_hop', label: '6m Timed Hop',
    description: 'Time to hop 6 meters on one leg.',
    inputMode: 'bilateral', unit: 'seconds',
  },
];

export const ALL_TESTS = [...MOVEMENT_TESTS, ...STRENGTH_TESTS, ...HOP_TESTS];

export const SCREENING_STEPS = [
  { key: 'info', label: 'Session Info' },
  { key: 'movement', label: 'Movement Scoring' },
  { key: 'strength', label: 'Strength Testing' },
  { key: 'hop', label: 'Hop Testing' },
  { key: 'review', label: 'Review & Complete' },
] as const;
