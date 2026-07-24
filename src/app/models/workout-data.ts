/** Shape of GET /workout in portfolio-api. Weights/volumes ship in both the
 *  export's unit and kilograms; the page uses the kg fields throughout. */

export interface WorkoutDay {
  date: string;
  sets: number;
  reps: number;
  volume: number;
  volumeKg: number;
  exerciseCount: number;
  muscles: Record<string, number>;
}

export interface WorkoutWeek {
  week: string;
  sets: number;
  sessions: number;
  muscles: Record<string, number>;
}

export interface WorkoutLift {
  name: string;
  muscle: string;
  sets: number;
  bestE1rm: number;
  bestE1rmKg: number;
  bestE1rmDate: string;
}

export interface StrengthPoint {
  month: string;
  e1rmKg: number;
}

export interface StrengthSeries {
  name: string;
  muscle: string;
  points: StrengthPoint[];
}

export interface MuscleSummary {
  muscle: string;
  sets: number;
  reps: number;
  volume: number;
  volumeKg: number;
  exercises: number;
}

export interface WorkoutFrequency {
  sessionsLast30: number;
  sessionsLast90: number;
  sessionsPerWeek: number;
  currentStreakWeeks: number;
  longestGapDays: number;
}

export interface WorkoutTotals {
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  totalVolumeKg: number;
  unit: string;
  firstDate: string;
  lastDate: string;
  workoutDays: number;
  exerciseCount: number;
  frequency: WorkoutFrequency;
}

export interface WorkoutSummary {
  range: { from: string; to: string };
  unit: string;
  days: WorkoutDay[];
  weeks: WorkoutWeek[];
  lifts: WorkoutLift[];
  strengthSeries: StrengthSeries[];
  muscles: MuscleSummary[];
  topExercises: {
    name: string;
    muscle: string;
    sets: number;
    volume: number;
    volumeKg: number;
    maxWeight: number;
    maxWeightKg: number;
    lastDate: string;
  }[];
  totals: WorkoutTotals;
}
