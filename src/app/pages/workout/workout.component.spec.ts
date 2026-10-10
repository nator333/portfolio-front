import { ComponentFixture, TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { Chart } from "chart.js/auto";

import { WorkoutComponent, filterLegendClick, tabFromHash } from "./workout.component";
import { WorkoutService } from "../../services/workout.service";
import {
  BodyweightSnapshot,
  MuscleVolumeStatus,
  WorkoutPlan,
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
      weeklyMaintenance: null,
      maintenance: null,
      sets: 8,
      countedSets: 8,
      sharedWith: [],
      status: "in_range",
    },
    {
      muscle: "Lats",
      weeklyTarget: { min: 6, max: 6 },
      target: { min: 6, max: 6 },
      weeklyMaintenance: null,
      maintenance: null,
      sets: 4,
      countedSets: 4,
      sharedWith: [],
      status: "under",
    },
  ],
  untargeted: [],
};

/** Fourteen months, the last still in progress. */
const BODYWEIGHT: BodyweightSnapshot = {
  months: [
    ...Array.from({ length: 13 }, (_, i) => {
      const d = new Date(Date.UTC(2025, 7 + i, 1));
      const kg = 81.2 - i * 0.1;
      return { month: d.toISOString().slice(0, 7), kg, lb: kg * 2.20462, complete: true };
    }),
    { month: "2026-09", kg: 80.0, lb: 176.4, complete: false },
  ],
  updatedAt: "2026-09-28T16:00:00.000Z",
};

const PLAN: WorkoutPlan = {
  planId: "upper-lower",
  version: 3,
  name: "Upper/Lower summer block",
  sessionsPerWeek: 3,
  rotation: ["upper-a", "lower-a", "upper-b"],
  bonusSessions: ["lower-b"],
  sessions: [
    {
      id: "upper-a",
      name: "Upper A",
      notes: "",
      exercises: [
        {
          order: 1,
          options: ["Bench Press", "Incline Dumbbell Press"],
          muscle: "Chest",
          sets: { min: 3, max: 3 },
          reps: { min: 6, max: 8 },
          rpe: { min: 8, max: 9 },
          notes: "",
        },
      ],
    },
    { id: "lower-a", name: "Lower A", notes: "", exercises: [] },
    { id: "upper-b", name: "Upper B", notes: "", exercises: [] },
    { id: "lower-b", name: "Lower B", notes: "", exercises: [] },
  ],
  weeklySetTargets: [
    { muscles: ["Chest"], sets: { min: 8, max: 9 }, bonusWeekSets: null, maintenanceSets: null },
  ],
  effectiveFrom: "2026-06-01",
  effectiveTo: null,
  notes: "",
  changeNote: "Swapped the row variation.",
};

class StubWorkoutService {
  summary: WorkoutSummary | null = SUMMARY;
  status: MuscleVolumeStatus | null = STATUS;
  bodyweight: BodyweightSnapshot | null = BODYWEIGHT;
  plan: WorkoutPlan | null = PLAN;
  planCalls = 0;
  getPlan() {
    this.planCalls++;
    return of(this.plan);
  }
  getBodyweight() {
    return of(this.bodyweight);
  }
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
    // selectTab writes the tab into the URL; don't let it leak into the next case.
    history.replaceState(history.state, "", location.pathname + location.search);
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

  it("shows the maintenance zone only when a target declares a floor", async () => {
    await render();
    expect(fixture.componentInstance.hasMaintenance()).toBe(false);
    expect(text()).not.toContain("maintenance");
    TestBed.resetTestingModule();

    const [chest, lats] = STATUS.muscles;
    await render({
      status: {
        ...STATUS,
        muscles: [
          chest,
          { ...lats, weeklyMaintenance: 3, maintenance: 3, status: "maintenance" },
        ],
      },
    });
    expect(fixture.componentInstance.hasMaintenance()).toBe(true);
    expect(text()).toContain("maintenance");
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

  describe("tabs", () => {
    const panel = (id: string) =>
      (fixture.nativeElement as HTMLElement).querySelector(`#panel-${id}`) as HTMLElement;

    it("opens on this week's view with the other panels hidden", async () => {
      await render();
      expect(panel("week").hidden).toBe(false);
      expect(panel("plan").hidden).toBe(true);
      expect(panel("progress").hidden).toBe(true);
    });

    it("builds every chart up front, so switching tabs needs no rebuild", async () => {
      await render();
      expect(fixture.nativeElement.querySelector("#panel-progress #chart-strength")).not.toBeNull();
    });

    it("fetches the plan only when its tab is first opened", async () => {
      await render();
      expect(service.planCalls).toBe(0);

      fixture.componentInstance.selectTab("plan");
      fixture.componentInstance.selectTab("week");
      fixture.componentInstance.selectTab("plan");
      fixture.detectChanges();

      expect(service.planCalls).toBe(1);
      expect(panel("plan").hidden).toBe(false);
      expect(panel("plan").textContent).toContain("Upper A → Lower A → Upper B");
      expect(panel("plan").textContent).toContain("plus Lower B");
      expect(panel("plan").textContent).toContain("Bench Press");
      expect(panel("plan").textContent).toContain("3 × 6–8");
      expect(panel("plan").textContent).toContain("or Incline Dumbbell Press");
      expect(panel("plan").textContent).toContain("Swapped the row variation.");
    });

    it("keeps per-exercise notes out of the way until asked for", async () => {
      const [upperA, ...rest] = PLAN.sessions;
      const exercises = [{ ...upperA.exercises[0], notes: "Pause on the chest." }];
      await render({ plan: { ...PLAN, sessions: [{ ...upperA, exercises }, ...rest] } });
      fixture.componentInstance.selectTab("plan");
      fixture.detectChanges();
      expect(panel("plan").textContent).not.toContain("Pause on the chest.");

      fixture.componentInstance.showExerciseNotes.set(true);
      fixture.detectChanges();
      expect(panel("plan").textContent).toContain("Pause on the chest.");
    });

    it("says so when the plan can't be read, without touching the other tabs", async () => {
      await render({ plan: null });
      fixture.componentInstance.selectTab("plan");
      fixture.detectChanges();
      expect(panel("plan").textContent).toContain("unavailable");
      expect(panel("week").textContent).toContain("Volume vs target");
    });

    it("moves between tabs with the arrow keys, wrapping at the ends", async () => {
      await render();
      const key = (k: string) =>
        fixture.componentInstance.onTabKey(new KeyboardEvent("keydown", { key: k }));
      key("ArrowLeft");
      expect(fixture.componentInstance.tab()).toBe("progress");
      key("ArrowRight");
      expect(fixture.componentInstance.tab()).toBe("week");
      key("End");
      expect(fixture.componentInstance.tab()).toBe("progress");
    });

    it("reads the starting tab from the URL hash", () => {
      expect(tabFromHash("#plan")).toBe("plan");
      expect(tabFromHash("#progress")).toBe("progress");
      expect(tabFromHash("")).toBe("week");
      expect(tabFromHash("#nonsense")).toBe("week");
    });
  });

  describe("bodyweight", () => {
    it("charts the monthly averages with the latest month and the year's change in words", async () => {
      await render();
      expect(text()).toContain("Bodyweight");
      // Sep 2025 (81.1) → Sep 2026 so far (80.0): the same month a year earlier.
      expect(fixture.componentInstance.bodyweightSummary()).toBe(
        "Latest: Sep 2026 (so far) 80.0 kg · −1.1 kg since Sep 2025",
      );
      expect(fixture.nativeElement.querySelector("#chart-bodyweight")).not.toBeNull();
    });

    it("offers every value as a table, newest first, marking the month in progress", async () => {
      await render();
      const rows = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll(".chart-table tbody tr"),
      ).map((r) => r.textContent?.replace(/\s+/g, " ").trim());
      expect(rows.length).toBe(14);
      expect(rows[0]).toContain("Sep 2026 (so far)");
      expect(rows[1]).not.toContain("so far");
    });

    it("leaves the chart out when there is no bodyweight to show", async () => {
      for (const bodyweight of [null, { months: [], updatedAt: null }]) {
        await render({ bodyweight });
        expect(fixture.nativeElement.querySelector("#chart-bodyweight")).toBeNull();
        expect(text()).toContain("sessions / week");
        TestBed.resetTestingModule();
      }
    });

    it("needs two months to draw a line", async () => {
      await render({ bodyweight: { months: [BODYWEIGHT.months[0]], updatedAt: null } });
      expect(fixture.nativeElement.querySelector("#chart-bodyweight")).toBeNull();
    });
  });
});

describe("filterLegendClick", () => {
  // Just enough of a Chart to track which datasets are visible.
  function fakeChart(visible: boolean[]): { chart: Chart; visible: boolean[] } {
    const state = [...visible];
    const chart = {
      data: { datasets: state.map(() => ({})) },
      isDatasetVisible: (i: number) => state[i],
      setDatasetVisibility: (i: number, v: boolean) => (state[i] = v),
      update: () => undefined,
    } as unknown as Chart;
    return { chart, visible: state };
  }

  it("should isolate the tapped series from the all-on state", () => {
    const { chart, visible } = fakeChart([true, true, true]);
    filterLegendClick(chart, 1);
    expect(visible).toEqual([false, true, false]);
  });

  it("should toggle a single series once the state is already narrowed", () => {
    const { chart, visible } = fakeChart([false, true, false]);
    filterLegendClick(chart, 0);
    expect(visible).toEqual([true, true, false]);
    filterLegendClick(chart, 1);
    expect(visible).toEqual([true, false, false]);
  });

  it("should turn every series back on when the last visible one is tapped", () => {
    const { chart, visible } = fakeChart([false, true, false]);
    filterLegendClick(chart, 1);
    expect(visible).toEqual([true, true, true]);
  });
});
