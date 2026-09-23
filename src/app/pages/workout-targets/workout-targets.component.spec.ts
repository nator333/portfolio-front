import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of, throwError } from "rxjs";

import { WorkoutTargetsComponent } from "./workout-targets.component";
import { WorkoutTargetsService } from "../../services/workout-targets.service";
import { WorkoutTargets } from "../../models/workout-targets";

/**
 * The page's job beyond collecting numbers is to make the one-way rule visible:
 * a target may sit above what the sessions prescribe, never below.
 */

const LOADED: WorkoutTargets = {
  planId: "upper-lower",
  version: 2,
  changeNote: "",
  createdAt: "2026-09-11T23:00:00.000Z",
  weeklySetTargets: [
    { muscles: ["Chest"], sets: { min: 8, max: 9 }, bonusWeekSets: null },
    {
      muscles: ["Glutes", "Hamstrings"],
      sets: { min: 9, max: 11 },
      bonusWeekSets: null,
    },
  ],
  menu: {
    version: 4,
    name: "Upper/Lower summer block",
    sessionsPerWeek: 3,
    prescribed: {
      Chest: { min: 8, max: 9 },
      Glutes: { min: 3, max: 3 },
      Hamstrings: { min: 3, max: 3 },
    },
    prescribedWithBonus: {
      Chest: { min: 8, max: 9 },
      Glutes: { min: 3, max: 3 },
      Hamstrings: { min: 6, max: 6 },
    },
  },
  muscles: ["Chest", "Lats", "Glutes", "Hamstrings", "Abs", "Cardio", "Other"],
};

class StubService {
  loadError = false;
  saved: unknown = null;
  saveError: unknown = null;
  getTargets() {
    return this.loadError ? throwError(() => new Error("nope")) : of(structuredClone(LOADED));
  }
  saveTargets(update: unknown) {
    this.saved = update;
    if (this.saveError) return throwError(() => this.saveError);
    return of({ planId: "upper-lower", version: 3, basedOn: 2, createdAt: "x" });
  }
}

describe("WorkoutTargetsComponent", () => {
  let fixture: ComponentFixture<WorkoutTargetsComponent>;
  let service: StubService;

  const render = async (over: Partial<StubService> = {}) => {
    service = Object.assign(new StubService(), over);
    await TestBed.configureTestingModule({
      imports: [WorkoutTargetsComponent],
      providers: [
        provideRouter([]),
        { provide: WorkoutTargetsService, useValue: service },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(WorkoutTargetsComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  afterEach(() => TestBed.resetTestingModule());

  const text = () => (fixture.nativeElement as HTMLElement).textContent ?? "";
  const component = () => fixture.componentInstance;

  it("loads a row per target", async () => {
    await render();
    expect(component().rowGroups.length).toBe(2);
    expect(text()).toContain("Chest");
    // A shared target reads as one row covering both.
    expect(text()).toContain("Glutes + Hamstrings");
  });

  it("shows what the sessions prescribe, summed across a shared target", async () => {
    await render();
    const shared = component().rowGroups[1];
    expect(component().prescribed(shared)).toEqual({ min: 6, max: 6 });
  });

  it("flags a ceiling below the prescription before the save is attempted", async () => {
    await render();
    const chest = component().rowGroups[0];
    chest.patchValue({ max: 5 });
    component().touch();

    expect(component().breachFor(chest)).toContain("prescribe 9");
    expect(component().hasBreach()).toBe(true);
  });

  it("does not flag a target above the prescription, which is the point of one", async () => {
    await render();
    // Glutes+Hamstrings is targeted 9-11 against 6 prescribed — deliberate.
    expect(component().breachFor(component().rowGroups[1])).toBe("");
    expect(component().hasBreach()).toBe(false);
  });

  it("refuses to save while a row would be refused", async () => {
    await render();
    component().rowGroups[0].patchValue({ max: 5 });
    component().form.patchValue({ changeNote: "cut chest" });
    component().touch();
    component().save();

    expect(service.saved).toBeNull();
  });

  it("requires a change note, since the history is the point", async () => {
    await render();
    component().save();
    expect(service.saved).toBeNull();
  });

  it("sends the whole set with the version it loaded against", async () => {
    await render();
    component().form.patchValue({ changeNote: "chest to 8-10" });
    component().rowGroups[0].patchValue({ max: 10 });
    component().save();

    expect(service.saved).toEqual({
      baseVersion: 2,
      changeNote: "chest to 8-10",
      weeklySetTargets: [
        {
          muscles: ["Chest"],
          sets: { min: 8, max: 10 },
          maintenanceSets: null,
          bonusWeekSets: null,
        },
        {
          muscles: ["Glutes", "Hamstrings"],
          sets: { min: 9, max: 11 },
          maintenanceSets: null,
          bonusWeekSets: null,
        },
      ],
    });
  });

  it("sends a maintenance floor when one is entered", async () => {
    await render();
    component().form.patchValue({ changeNote: "chest maintenance at 4" });
    component().rowGroups[0].patchValue({ maintenance: 4 });
    component().save();

    const saved = service.saved as { weeklySetTargets: { maintenanceSets: number | null }[] };
    expect(saved.weeklySetTargets[0].maintenanceSets).toBe(4);
    expect(saved.weeklySetTargets[1].maintenanceSets).toBeNull();
  });

  it("refuses a maintenance floor that is not below the hypertrophy min", async () => {
    await render();
    const chest = component().rowGroups[0];
    chest.patchValue({ maintenance: 8 });
    component().form.patchValue({ changeNote: "too high" });
    component().touch();

    expect(component().maintenanceErrorFor(chest)).toContain("below the hypertrophy min of 8");
    expect(component().hasMaintenanceError()).toBe(true);
    component().save();
    expect(service.saved).toBeNull();
  });

  it("advances the held version after saving, so a second save is not stale", async () => {
    await render();
    component().form.patchValue({ changeNote: "one" });
    component().save();

    component().form.patchValue({ changeNote: "two" });
    component().save();

    expect((service.saved as { baseVersion: number }).baseVersion).toBe(3);
  });

  it("adds a bonus range seeded from the ordinary one", async () => {
    await render();
    const chest = component().rowGroups[0];
    component().toggleBonus(chest);

    expect(chest.value.bonusEnabled).toBe(true);
    expect(chest.value.bonusMin).toBe(8);
    expect(chest.value.bonusMax).toBe(9);
  });

  it("offers only muscles without a target, excluding non-lifting groups", async () => {
    await render();
    const options = component().untargeted();
    expect(options).toContain("Lats");
    expect(options).toContain("Abs");
    expect(options).not.toContain("Chest");
    // Cardio is dropped at ingest and Other is a catch-all; neither is a target.
    expect(options).not.toContain("Cardio");
    expect(options).not.toContain("Other");
  });

  it("surfaces the API's refusal reasons rather than a generic failure", async () => {
    await render({
      saveError: {
        error: { message: "refused", breaches: ["Chest is prescribed 9 sets a week"] },
      },
    });
    component().form.patchValue({ changeNote: "x" });
    component().save();
    fixture.detectChanges();

    expect(text()).toContain("refused");
    expect(text()).toContain("Chest is prescribed 9 sets a week");
  });

  it("says so when the targets cannot be loaded", async () => {
    await render({ loadError: true });
    expect(text()).toContain("Could not load the targets");
  });
});
