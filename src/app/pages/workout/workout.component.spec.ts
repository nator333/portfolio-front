import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";

import { WorkoutComponent } from "./workout.component";
import { WorkoutService } from "../../services/workout.service";
import {
  MuscleVolumeStatus,
  WorkoutSummary,
} from "../../models/workout-data";

/**
 * The page's job on this chart is to render the API's verdict, not to reach one.
 * These cases pin that: what is drawn follows the status response, and when
 * there is no response the page says it does not know rather than guessing —
 * which is what the hard-coded ranges it used to carry amounted to.
 */

const SUMMARY: WorkoutSummary = {
  range: { from: "2025-09-11", to: "2026-09-11" },
  unit: "lb",
  days: [
    { date: "2026-09-09", sets: 12, reps: 120, volume: 0, volumeKg: 0, exerciseCount: 4, muscles: { Chest: 8, Lats: 4 } },
    { date: "2026-09-10", sets: 6, reps: 60, volume: 0, volumeKg: 0, exerciseCount: 2, muscles: { Quads: 6 } },
  ],
  weeks: [],
  lifts: [],
  strengthSeries: [],
  muscles: [],
  topExercises: [],
  totals: {
    totalSets: 18,
    totalReps: 180,
    totalVolume: 0,
    totalVolumeKg: 0,
    unit: "lb",
    firstDate: "2016-01-01",
    lastDate: "2026-09-10",
    workoutDays: 900,
    exerciseCount: 60,
    frequency: {
      sessionsLast30: 12,
      sessionsLast90: 36,
      sessionsPerWeek: 2.8,
      currentStreakWeeks: 4,
      longestGapDays: 30,
    },
  },
};

const STATUS: MuscleVolumeStatus = {
  asOf: "2026-09-11T20:37:00.000Z",
  window: { days: 7, from: "2026-09-05", to: "2026-09-11" },
  plan: {
    planId: "upper-lower",
    version: 3,
    name: "Upper/Lower summer block",
    sessionsPerWeek: 3,
  },
  sessions: 2,
  bonusWindow: false,
  muscles: [
    {
      muscle: "Chest",
      weeklyTarget: { min: 8, max: 9 },
      target: { min: 8, max: 9 },
      sets: 8,
      countedSets: 8,
      sharedWith: [],
      status: "in_range",
    },
    {
      muscle: "Lats",
      weeklyTarget: { min: 6, max: 6 },
      target: { min: 6, max: 6 },
      sets: 4,
      countedSets: 4,
      sharedWith: [],
      status: "under",
    },
  ],
  untargeted: [],
};

class StubWorkoutService {
  summary: WorkoutSummary | null = SUMMARY;
  status: MuscleVolumeStatus | null = STATUS;
  getWorkout() {
    return of(this.summary);
  }
  getMuscleVolumeStatus() {
    return of(this.status);
  }
}

describe("WorkoutComponent", () => {
  let fixture: ComponentFixture<WorkoutComponent>;
  let service: StubWorkoutService;

  const render = async (over: Partial<StubWorkoutService> = {}) => {
    service = new StubWorkoutService();
    Object.assign(service, over);

    await TestBed.configureTestingModule({
      imports: [WorkoutComponent],
      providers: [{ provide: WorkoutService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(WorkoutComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? "";

  it("labels the window with the one the API actually rolled up", async () => {
    await render();
    expect(fixture.componentInstance.windowDays()).toBe(7);
    expect(fixture.componentInstance.windowLabel()).toBe("Sep 5 – Sep 11");
  });

  it("names the plan version the targets came from", async () => {
    await render();
    expect(text()).toContain("Upper/Lower summer block");
    expect(text()).toContain("v3");
  });

  it("shows when the rollup was taken, since a trailing window moves", async () => {
    await render();
    expect(fixture.componentInstance.asOfLabel()).not.toBe("");
    expect(text()).toContain("Rolled up");
  });

  it("follows the API's window width rather than assuming seven days", async () => {
    await render({
      status: { ...STATUS, window: { days: 14, from: "2026-08-29", to: "2026-09-11" } },
    });
    expect(fixture.componentInstance.windowDays()).toBe(14);
    expect(text()).toContain("last 14 days");
  });

  it("says the bonus-week targets apply when the window holds an extra session", async () => {
    await render({ status: { ...STATUS, bonusWindow: true, sessions: 4 } });
    expect(text()).toContain("bonus-week targets");
  });

  it("marks no muscle under or over when the status read failed", async () => {
    await render({ status: null });
    expect(text()).toContain("Target ranges are unavailable");
    // The zone legend is the page's claim to a verdict; without one, it is gone.
    expect(text()).not.toContain("in range");
    // ...but the chart still has a window to describe, anchored to the last log.
    expect(fixture.componentInstance.windowLabel()).toBe("Sep 4 – Sep 10");
  });

  it("still renders the rest of the page when the status read failed", async () => {
    await render({ status: null });
    expect(text()).toContain("sessions / week");
    expect(text()).toContain("workout days");
  });
});
