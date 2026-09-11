import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router, RouterLink } from "@angular/router";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

import { HeroComponent } from "../../components/hero/hero.component";
import { WorkoutTargetsService } from "../../services/workout-targets.service";
import {
  PrescribedSets,
  WeeklySetTarget,
  WorkoutTargets,
} from "../../models/workout-targets";

/**
 * Editor for the weekly set targets — the training intent every volume verdict
 * on the site is judged against.
 *
 * The page's job beyond collecting numbers is to make the one rule visible. A
 * target is independent of the sessions and may sit above what they prescribe:
 * that is the point of stating one, since it folds in indirect work the slot
 * list cannot express. What it may not do is sit *below* them, because then the
 * program asks for more than the intent allows — which is exactly how shoulders,
 * biceps and triceps came to report "over" on weeks that had simply run the
 * program. The API refuses that; this page shows the prescription beside each
 * row and flags it before the save, so the rule is learned rather than merely
 * enforced.
 */
@Component({
  selector: "app-workout-targets",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, HeroComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./workout-targets.component.html",
  styleUrl: "./workout-targets.component.scss",
})
export class WorkoutTargetsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(WorkoutTargetsService);
  private router = inject(Router);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal("");
  readonly breaches = signal<string[]>([]);
  readonly successMessage = signal("");
  readonly warnings = signal<string[]>([]);

  readonly loaded = signal<WorkoutTargets | null>(null);

  /** Bumped on every edit so the template's per-row lookups recompute. */
  readonly revision = signal(0);

  /** Muscles with no target yet — the options for adding one. */
  readonly untargeted = computed(() => {
    this.revision();
    const data = this.loaded();
    if (!data) return [];
    const claimed = new Set(
      (this.rows.value as TargetRow[]).flatMap((r) => r.muscles),
    );
    return data.muscles.filter(
      (m) => !claimed.has(m) && m !== "Cardio" && m !== "Other",
    );
  });

  form: FormGroup = this.fb.group({
    changeNote: this.fb.nonNullable.control("", [Validators.required]),
    targets: this.fb.array([]),
  });

  ngOnInit(): void {
    this.service.getTargets().subscribe({
      next: (data) => {
        this.loaded.set(data);
        this.buildForm(data.weeklySetTargets);
        this.loading.set(false);
        this.touch();
      },
      error: () => {
        this.errorMessage.set(
          "Could not load the targets. Check you are still signed in, then reload.",
        );
        this.loading.set(false);
      },
    });
  }

  get rows(): FormArray {
    return this.form.get("targets") as FormArray;
  }

  get rowGroups(): FormGroup[] {
    return this.rows.controls as FormGroup[];
  }

  /** The muscles one row covers, for display: "Glutes + Hamstrings". */
  label(row: FormGroup): string {
    return (row.value.muscles as string[]).join(" + ");
  }

  /**
   * What the sessions prescribe for a row, summed where it spans muscles — the
   * same combined total the API judges it on.
   */
  prescribed(row: FormGroup, withBonus = false): { min: number; max: number } | null {
    const data = this.loaded();
    if (!data) return null;
    const source: PrescribedSets = withBonus
      ? data.menu.prescribedWithBonus
      : data.menu.prescribed;
    const totals = (row.value.muscles as string[]).reduce(
      (acc, m) => {
        const p = source[m];
        return p ? { min: acc.min + p.min, max: acc.max + p.max } : acc;
      },
      { min: 0, max: 0 },
    );
    return totals.max === 0 ? null : totals;
  }

  /**
   * The message for a row whose ceiling sits below what the sessions prescribe.
   *
   * Mirrors what the API refuses, so the page and the server never disagree
   * about whether a value can be saved.
   */
  breachFor(row: FormGroup): string {
    this.revision();
    const p = this.prescribed(row);
    const max = Number(row.value.max);
    if (!p || !Number.isFinite(max) || max >= p.max) return "";
    return `The sessions prescribe ${p.max} sets a week — a ceiling of ${max} would be refused.`;
  }

  /** The same for a bonus week, which the API warns about rather than refusing. */
  bonusNoteFor(row: FormGroup): string {
    this.revision();
    const p = this.prescribed(row, true);
    if (!p) return "";
    const ceiling = row.value.bonusEnabled
      ? Number(row.value.bonusMax)
      : Number(row.value.max);
    if (!Number.isFinite(ceiling) || ceiling >= p.max) return "";
    return `On a bonus week the sessions prescribe ${p.max}; this saves with a warning.`;
  }

  /** True when any row would be refused, so the button can say why it is disabled. */
  readonly hasBreach = computed(() => {
    this.revision();
    return this.rowGroups.some((row) => this.breachFor(row) !== "");
  });

  addTarget(muscle: string): void {
    if (!muscle) return;
    this.rows.push(
      this.rowFor({ muscles: [muscle], sets: { min: 0, max: 0 }, bonusWeekSets: null }),
    );
    this.touch();
  }

  removeTarget(index: number): void {
    this.rows.removeAt(index);
    this.touch();
  }

  toggleBonus(row: FormGroup): void {
    const enabled = !row.value.bonusEnabled;
    row.patchValue({
      bonusEnabled: enabled,
      // Seeded from the ordinary range so enabling it never starts at zero.
      bonusMin: enabled ? row.value.min : 0,
      bonusMax: enabled ? row.value.max : 0,
    });
    this.touch();
  }

  touch(): void {
    this.revision.update((n) => n + 1);
    this.successMessage.set("");
    this.breaches.set([]);
  }

  save(): void {
    this.form.markAllAsTouched();
    // hasBreach() is checked here and not only on the button: a form submits on
    // Enter too, and the API would refuse this anyway — better to say so without
    // the round trip than to let the keyboard route around the guard.
    if (this.form.invalid || this.saving() || this.hasBreach()) return;

    const data = this.loaded();
    if (!data) return;

    this.saving.set(true);
    this.errorMessage.set("");
    this.breaches.set([]);
    this.successMessage.set("");
    this.warnings.set([]);

    this.service
      .saveTargets({
        baseVersion: data.version,
        changeNote: this.form.value.changeNote as string,
        weeklySetTargets: (this.rows.value as TargetRow[]).map(toTarget),
      })
      .subscribe({
        next: (saved) => {
          this.saving.set(false);
          this.warnings.set(saved.warnings ?? []);
          this.successMessage.set(
            `Published version ${saved.version}. Every volume reading now uses these targets.`,
          );
          // The version we held is now stale; keep it in step so a second save
          // in the same sitting is not refused as written against the old one.
          this.loaded.set({ ...data, version: saved.version });
          this.form.patchValue({ changeNote: "" });
        },
        error: (err: {
          error?: { message?: string; breaches?: string[] };
        }) => {
          this.saving.set(false);
          this.breaches.set(err.error?.breaches ?? []);
          this.errorMessage.set(
            err.error?.message ??
              "Could not save the targets. Check you are still signed in, then try again.",
          );
        },
      });
  }

  back(): void {
    void this.router.navigateByUrl("/workout");
  }

  private buildForm(targets: WeeklySetTarget[]): void {
    this.rows.clear();
    for (const target of targets) this.rows.push(this.rowFor(target));
  }

  private rowFor(target: WeeklySetTarget): FormGroup {
    const bonus = target.bonusWeekSets;
    return this.fb.group({
      // Not editable: which muscles a target covers is a decision about the
      // program's shape, and re-grouping them in place would silently change
      // what an existing entry means. Add or remove a row instead.
      muscles: this.fb.nonNullable.control(target.muscles),
      min: this.fb.nonNullable.control(target.sets.min, [Validators.required, Validators.min(0)]),
      max: this.fb.nonNullable.control(target.sets.max, [Validators.required, Validators.min(0)]),
      bonusEnabled: this.fb.nonNullable.control(bonus !== null),
      bonusMin: this.fb.nonNullable.control(bonus?.min ?? 0, [Validators.min(0)]),
      bonusMax: this.fb.nonNullable.control(bonus?.max ?? 0, [Validators.min(0)]),
    });
  }
}

interface TargetRow {
  muscles: string[];
  min: number;
  max: number;
  bonusEnabled: boolean;
  bonusMin: number;
  bonusMax: number;
}

/** Form row back to the wire shape the API stores. */
const toTarget = (row: TargetRow): WeeklySetTarget => ({
  muscles: row.muscles,
  sets: { min: Number(row.min), max: Number(row.max) },
  bonusWeekSets: row.bonusEnabled
    ? { min: Number(row.bonusMin), max: Number(row.bonusMax) }
    : null,
});
