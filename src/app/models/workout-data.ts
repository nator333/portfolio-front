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
  /**
   * True for a strength-range lift of the plan in force; false for a
   * long-history lift no longer being logged. Absent from responses cached
   * before the API sent it, which read as tracked.
   */
  tracked?: boolean;
}

export interface StrengthPoint {
  month: string;
  e1rmKg: number;
}

export interface StrengthSeries {
  name: string;
  muscle: string;
  /** See WorkoutLift.tracked. */
  tracked?: boolean;
  points: StrengthPoint[];
}

/** When a version of the training plan took effect. */
export interface PlanChange {
  version: number;
  /** YYYY-MM-DD. */
  effectiveFrom: string;
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
  /** Absent from responses cached before the API sent it. */
  planChanges?: PlanChange[];
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

/**
 * One month of the owner's bodyweight, as GET /bodyweight serves it: the
 * average of that month's daily morning weigh-ins from their smart scale.
 * Only months with at least 7 weigh-in days are published, and nothing finer
 * than a month is ever stored or served.
 */
export interface BodyweightMonth {
  /** "YYYY-MM". */
  month: string;
  kg: number;
  lb: number;
  /** False for the month still in progress. */
  complete: boolean;
}

export interface BodyweightSnapshot {
  months: BodyweightMonth[];
  /** When the averages were last refreshed; null before the first refresh. */
  updatedAt: string | null;
}

/** One prescribed slot in a session; `options` are interchangeable, the first the default. */
export interface PlanExercise {
  order: number;
  options: string[];
  muscle: string;
  sets: SetRange;
  reps: SetRange;
  /** Prescribed effort, RPE 1–10; null where the plan leaves it open. */
  rpe: SetRange | null;
  notes: string;
}

export interface PlanSession {
  id: string;
  name: string;
  notes: string;
  exercises: PlanExercise[];
}

/** A weekly set target as GET /workout-plan states it. */
export interface PlanWeeklyTarget {
  /** Several when the plan states them together, e.g. glutes and hamstrings. */
  muscles: string[];
  sets: SetRange;
  bonusWeekSets: SetRange | null;
  maintenanceSets?: number | null;
}

/** Shape of GET /workout-plan in portfolio-api: the program currently in force. */
export interface WorkoutPlan {
  planId: string;
  version: number;
  name: string;
  sessionsPerWeek: number;
  /** Session ids in the order they are performed, cycling. */
  rotation: string[];
  /** Session ids added only on weeks with an extra visit. */
  bonusSessions: string[];
  sessions: PlanSession[];
  weeklySetTargets: PlanWeeklyTarget[];
  /** YYYY-MM-DD; null when the block's start was never recorded. */
  effectiveFrom: string | null;
  effectiveTo: string | null;
  notes: string;
  /** Why this version differs from the one before it; empty for the first. */
  changeNote: string;
}
