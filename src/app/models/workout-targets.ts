/** Shape of GET/PUT /workout-plan/targets in portfolio-api — the admin editor's data. */

import { SetRange } from "./workout-data";

/**
 * One weekly set target, as the plan states it.
 *
 * `muscles` may name several: the plan states glutes and hamstrings together,
 * and a shared target is only meaningful against their combined total.
 */
export interface WeeklySetTarget {
  muscles: string[];
  /** The hypertrophy range. */
  sets: SetRange;
  /** Target on weeks that take the bonus session; null where it is unchanged. */
  bonusWeekSets: SetRange | null;
  /**
   * The maintenance floor. One number because its ceiling is `sets.min`, where
   * hypertrophy begins; null (or absent on older target sets) where none is set.
   */
  maintenanceSets?: number | null;
}

/**
 * What the training sessions themselves prescribe, per muscle.
 *
 * Sent so the editor can show the intent against the program it serves. The
 * dependency runs one way — a menu must respect the targets, never define them —
 * so a target *below* what is prescribed here is the one thing the API refuses,
 * and the page can say so before the save rather than after.
 */
export type PrescribedSets = Record<string, SetRange | undefined>;

export interface WorkoutTargets {
  planId: string;
  /** The stored target set's version; 0 when none has been published yet. */
  version: number;
  weeklySetTargets: WeeklySetTarget[];
  changeNote: string;
  createdAt: string | null;
  menu: {
    version: number;
    name: string;
    sessionsPerWeek: number;
    prescribed: PrescribedSets;
    prescribedWithBonus: PrescribedSets;
  };
  /** The muscle vocabulary, so the page never hard-codes it. */
  muscles: string[];
}

/** The body PUT back when saving. */
export interface WorkoutTargetsUpdate {
  baseVersion: number;
  changeNote: string;
  weeklySetTargets: WeeklySetTarget[];
}

export interface WorkoutTargetsSaved {
  planId: string;
  version: number;
  basedOn: number;
  createdAt: string;
  /** Non-fatal notes, e.g. a bonus-week overshoot the save was allowed to keep. */
  warnings?: string[];
}
