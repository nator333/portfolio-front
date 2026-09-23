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

/** An inclusive set-count range. */
export interface SetRange {
  min: number;
  max: number;
}

/** `maintenance`: at or above the maintenance floor, below the hypertrophy range. */
export type VolumeStatus = "under" | "maintenance" | "in_range" | "over";

/**
 * One muscle's verdict from GET /muscle-volume-status.
 *
 * `countedSets` rather than `sets` is what `status` reflects: the plan may state
 * one target across several muscles (glutes and hamstrings share one), and a
 * shared target only means anything against the shared total.
 */
export interface MuscleVolumeRow {
  muscle: string;
  /** The target as the plan states it, per week. */
  weeklyTarget: SetRange;
  /** `weeklyTarget` restated over the requested window; equal to it at 7 days. */
  target: SetRange;
  /** The maintenance floor per week; null where the plan sets none. It runs up to `weeklyTarget.min`. */
  weeklyMaintenance: number | null;
  /** `weeklyMaintenance` restated over the window, as `target` is. */
  maintenance: number | null;
  sets: number;
  countedSets: number;
  sharedWith: string[];
  status: VolumeStatus;
}

/**
 * Shape of GET /muscle-volume-status — the single source of truth for whether a
 * muscle is under, in range or over its target volume.
 *
 * The page used to answer this itself from a hard-coded table of ranges, which
 * drifted from the training plan those ranges were meant to describe: chest and
 * lats were judged against numbers the plan had never asked for, and abs, traps
 * and forearms had ranges here that the plan did not carry at all. Nothing on
 * this page recomputes the verdict now; it renders what the endpoint returns.
 */
export interface MuscleVolumeStatus {
  /** The instant the rollup was computed. A trailing window moves, so two
   *  readings taken at different times legitimately differ; this is what makes
   *  them comparable. */
  asOf: string;
  window: { days: number; from: string; to: string };
  plan: { planId: string; version: number; name: string; sessionsPerWeek: number };
  /** Distinct days trained within the window. */
  sessions: number;
  /** True when the window holds more sessions than the rotation prescribes, so
   *  the bonus-week targets are the ones in force. */
  bonusWindow: boolean;
  muscles: MuscleVolumeRow[];
  /** Trained in the window, but the plan sets no target for it. */
  untargeted: { muscle: string; sets: number }[];
}
