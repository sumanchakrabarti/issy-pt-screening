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
  exerciseName: string;
  sets?: number;
  reps?: number;
  duration?: string;
  notes?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
