export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'clinician' | 'coach' | 'parent';
  clinicId?: string;
}

export interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  clubs?: Club[];
}

export interface Club {
  id: string;
  name: string;
  clinicId: string;
  clinic?: Clinic;
  teams?: Team[];
}

export interface Team {
  id: string;
  name: string;
  clubId: string;
  club?: Club;
  athletes?: Athlete[];
}

export interface Athlete {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  medicalHistory?: string;
  teamId: string;
  team?: Team;
  screeningSessions?: ScreeningSession[];
}

export interface ScreeningSession {
  id: string;
  athleteId: string;
  athlete?: Athlete;
  teamId: string;
  team?: Team;
  date: string;
  status: 'in_progress' | 'completed';
  riskScore?: number;
  riskCategory?: 'low' | 'moderate' | 'high' | 'very_high';
  notes?: string;
  scoreRecords?: ScoreRecord[];
  exercisePrescriptions?: ExercisePrescription[];
}

export interface ScoreRecord {
  id: string;
  sessionId: string;
  type: 'movement' | 'strength' | 'hop';
  name: string;
  valueLeft?: number;
  valueRight?: number;
  score?: number;
  notes?: string;
}

export interface ExercisePrescription {
  id: string;
  sessionId: string;
  exerciseId: string;
  exercise?: Exercise;
  sets?: number;
  reps?: number;
  duration?: string;
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  category: string;
  bodyRegion: string;
  difficulty: string;
  defaultSets?: number;
  defaultReps?: number;
  defaultDuration?: string;
  equipment?: string;
  muscleGroups?: MuscleGroup[];
  ligamentGroups?: LigamentGroup[];
  videos?: ExerciseVideo[];
}

export interface MuscleGroup {
  id: string;
  name: string;
  region?: string;
}

export interface LigamentGroup {
  id: string;
  name: string;
  joint?: string;
}

export interface ExerciseVideo {
  id: string;
  exerciseId: string;
  url: string;
  title?: string;
  source?: string;
  durationSeconds?: number;
}

export interface AuthResponse {
  token: string;
  user: User;
}
