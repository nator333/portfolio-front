import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  afterNextRender,
  inject,
  Injector,
  signal,
  computed,
} from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { Chart, ChartConfiguration } from "chart.js/auto";
import { forkJoin } from "rxjs";

import { HeroComponent } from "../../components/hero/hero.component";
import { WorkoutService } from "../../services/workout.service";
import {
  WorkoutSummary,
  StrengthSeries,
  WorkoutWeek,
  WorkoutDay,
  MuscleSummary,
  MuscleVolumeStatus,
  VolumeStatus,
} from "../../models/workout-data";

/** Muscle-group colours, shared by the weekly-volume and balance charts so a
 *  group reads the same in both. */
const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#2a78d6",
  Lats: "#eb6834",
  // Three distinct hues (cyan / violet / rose) so the leg groups read apart from
  // each other and from Traps' green — not three shades of one green.
  Quads: "#06b6d4",
  Hamstrings: "#8b5cf6",
  Glutes: "#f43f5e",
  Shoulders: "#eda100",
  Biceps: "#e87ba4",
  Triceps: "#4a3aa7",
  Traps: "#199e70",
  Calves: "#e34948",
  Abs: "#9085e9",
  Forearms: "#888780",
  Cardio: "#37a0d6",
  Other: "#5f5e5a",
};
const MUSCLE_ORDER = Object.keys(MUSCLE_COLORS);

/** Distinct line colours for the strength chart, in fixed order. */
const LINE_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4"];

const LIFTS_CHARTED = 5;
const WEEKS_CHARTED = 26;
const AXIS = "#8a8a84";
const GRID = "rgba(255,255,255,0.08)";

/**
 * Window used only when the status endpoint gave us nothing to go on. Normally
 * the width comes from the response, since the server is what decides it.
 */
const WINDOW_DAYS = 7;

/** "2026-09-11" → "Sep 11", read as a UTC date to match the API's date-only fields. */
const shortDate = (iso: string): string =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** Bar colour by where a muscle's volume falls against its own target range. */
const ZONE_UNDER = "#d9614f";
const ZONE_MAINTENANCE = "#4a90c9";
const ZONE_OPTIMAL = "#1baf7a";
const ZONE_OVER = "#eda100";
/** Used where there is no verdict to colour by — the degraded render below. */
const ZONE_NEUTRAL = "#5f7d8c";

/**
 * The page no longer decides what "under" means.
 *
 * It used to carry its own table of per-muscle weekly ranges, which drifted from
 * the training plan they were meant to describe: chest was judged against 10-22
 * and lats against 10-25 while the program asked for 8-9 and 6, so a
 * fully-completed week was drawn in the red "under" colour. Abs, traps and
 * forearms had ranges here and none in the plan at all. The ranges now come from
 * GET /muscle-volume-status, which reads them from the plan's current version;
 * all that is left here is which colour each verdict is drawn in.
 */
const ZONE_BY_STATUS: Record<VolumeStatus, string> = {
  under: ZONE_UNDER,
  maintenance: ZONE_MAINTENANCE,
  in_range: ZONE_OPTIMAL,
  over: ZONE_OVER,
};

@Component({
  selector: "app-workout",
  standalone: true,
  imports: [HeroComponent, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero title="Training" subtitle="A decade under the bar"></app-hero>

    <section class="section">
      <div class="container workout">
        @if (loaded() && summary(); as data) {
          <div class="metric-row">
            <div class="metric">
              <span class="metric-value">{{ data.totals.frequency.sessionsPerWeek | number: "1.0-1" }}</span>
              <span class="metric-label">sessions / week</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ sessionsPerYear() }}</span>
              <span class="metric-label">sessions / year</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ data.totals.frequency.currentStreakWeeks }}</span>
              <span class="metric-label">week streak</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ daysSinceLastGym() }}</span>
              <span class="metric-label">days since last workout</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ data.totals.workoutDays | number }}</span>
              <span class="metric-label">workout days</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ data.totals.exerciseCount }}</span>
              <span class="metric-label">exercises</span>
            </div>
            <div class="metric">
              <span class="metric-value">{{ data.totals.firstDate.slice(0, 4) }}</span>
              <span class="metric-label">since</span>
            </div>
          </div>

          <div class="chart-block">
            <h2 class="chart-title">Volume vs target — last {{ windowDays() }} days</h2>
            @if (status(); as s) {
              <p class="chart-sub">
                Hard sets per muscle over the trailing {{ s.window.days }} days ({{ windowLabel() }}), against the target ranges in
                <em>{{ s.plan.name }}</em> v{{ s.plan.version }}. Each shaded band is that muscle's own hypertrophy range@if (hasMaintenance()) {, with its maintenance zone shaded blue below it}.
                @if (s.bonusWindow) {
                  This window holds an extra session, so the bonus-week targets apply.
                }
                Rolled up {{ asOfLabel() }} — a trailing window moves, so these counts are as of then.
              </p>
              <div class="zone-legend">
                <span><i class="zone-swatch" style="background:{{ zoneUnder }}"></i>under</span>
                @if (hasMaintenance()) {
                  <span><i class="zone-swatch" style="background:{{ zoneMaintenance }}"></i>maintenance</span>
                }
                <span><i class="zone-swatch" style="background:{{ zoneOptimal }}"></i>in range</span>
                <span><i class="zone-swatch" style="background:{{ zoneOver }}"></i>over</span>
              </div>
            } @else {
              <p class="chart-sub">
                Hard sets per muscle over the trailing {{ windowDays() }} days ({{ windowLabel() }}). Target ranges are unavailable right now, so no
                muscle is marked under or over.
              </p>
            }
            <div class="chart-box chart-box--lanes">
              <canvas
                id="chart-7day"
                role="img"
                aria-label="Horizontal bars of hard sets per muscle group over the trailing window, each against that muscle's own target band."
              ></canvas>
            </div>
          </div>

          <div class="chart-block">
            <h2 class="chart-title">Recovery — days since last trained</h2>
            <p class="chart-sub">
              Days since each muscle was last worked, as of {{ data.totals.lastDate }}. Green is freshly trained, amber is due, red is overdue.
            </p>
            <div class="chart-box chart-box--lanes">
              <canvas
                id="chart-recovery"
                role="img"
                aria-label="Horizontal bars of days since each muscle group was last trained."
              ></canvas>
            </div>
          </div>

          <div class="chart-block">
            <h2 class="chart-title">Strength progression</h2>
            <p class="chart-sub">Estimated 1-rep max by month, kg. Machine lifts show stack load, not a true 1RM.</p>
            <div class="chart-box">
              <canvas
                id="chart-strength"
                role="img"
                aria-label="Estimated 1-rep max in kilograms per month for the top lifts, showing a long climb and a recent decline."
              ></canvas>
            </div>
          </div>

          <div class="chart-block">
            <h2 class="chart-title">Weekly volume by muscle</h2>
            <p class="chart-sub">Hard sets per muscle group per week, last {{ weeksShown() }} weeks. Guide: ~10–20 per group.</p>
            <div class="chart-box">
              <canvas
                id="chart-weekly"
                role="img"
                aria-label="Stacked bars of sets per muscle group for each of the last several weeks."
              ></canvas>
            </div>
          </div>

          <div class="chart-columns">
            <div class="chart-block">
              <h2 class="chart-title">Muscle balance</h2>
              <p class="chart-sub">All-time sets by muscle group.</p>
              <div class="chart-box chart-box--radar">
                <canvas
                  id="chart-radar"
                  role="img"
                  aria-label="Radar chart of all-time set counts across muscle groups."
                ></canvas>
              </div>
            </div>
            <div class="chart-block">
              <h2 class="chart-title">Consistency</h2>
              <p class="chart-sub">Sessions per week, last {{ weeksShown() }} weeks.</p>
              <div class="chart-box chart-box--radar">
                <canvas
                  id="chart-consistency"
                  role="img"
                  aria-label="Bar chart of training sessions per week over recent weeks."
                ></canvas>
              </div>
            </div>
          </div>
        } @else if (loaded()) {
          <p class="empty">No workout data yet.</p>
        }
      </div>
    </section>
  `,
  styleUrl: "./workout.component.scss",
})
export class WorkoutComponent implements OnInit, OnDestroy {
  readonly summary = signal<WorkoutSummary | null>(null);
  /** Null when the status endpoint could not be reached, or no plan is published. */
  readonly status = signal<MuscleVolumeStatus | null>(null);
  readonly loaded = signal(false);
  readonly weeksShown = signal(0);

  // Exposed for the volume chart's zone legend.
  readonly zoneUnder = ZONE_UNDER;
  readonly zoneMaintenance = ZONE_MAINTENANCE;
  readonly zoneOptimal = ZONE_OPTIMAL;
  readonly zoneOver = ZONE_OVER;

  /**
   * The window the volume chart covers, e.g. "Jul 17 – Jul 23".
   *
   * Taken from the status response, so the label describes the window the
   * verdicts were actually computed over rather than one the page picked for
   * itself. Without it the page falls back to the last logged day, which is the
   * best it can do when it has no server-computed window to name.
   */
  readonly windowLabel = computed(() => {
    const window = this.status()?.window;
    if (window) {
      return `${shortDate(window.from)} – ${shortDate(window.to)}`;
    }
    const last = this.summary()?.totals.lastDate;
    if (!last) {
      return "";
    }
    const end = new Date(`${last}T00:00:00Z`);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1));
    return `${shortDate(start.toISOString().slice(0, 10))} – ${shortDate(last)}`;
  });

  /** Width of the charted window, in days. */
  readonly windowDays = computed(() => this.status()?.window.days ?? WINDOW_DAYS);

  /** Whether any target declares a maintenance floor, so its legend entry is worth showing. */
  readonly hasMaintenance = computed(
    () => this.status()?.muscles.some((m) => m.maintenance != null) ?? false,
  );

  /**
   * When the rollup was computed, as a local time.
   *
   * Shown because a trailing window is time-of-request dependent: two people
   * reading this page an hour apart can legitimately see different counts, and
   * without a timestamp there is no way to tell that from a bug.
   */
  readonly asOfLabel = computed(() => {
    const asOf = this.status()?.asOf;
    return asOf
      ? new Date(asOf).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : "";
  });

  /** Whole days between the last logged workout and today, in UTC so it lines
   *  up with the date-only fields the API ships. Floored at 0 in case a future
   *  date ever sneaks in. */
  readonly daysSinceLastGym = computed(() => {
    const last = this.summary()?.totals.lastDate;
    if (!last) {
      return 0;
    }
    const dayMs = 24 * 60 * 60 * 1000;
    const lastMs = new Date(`${last}T00:00:00Z`).getTime();
    const now = new Date();
    const todayMs = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return Math.max(Math.round((todayMs - lastMs) / dayMs), 0);
  });

  /** All-time average sessions per year: workout days over the span logged,
   *  floored at a month so a brand-new history doesn't divide by ~zero. */
  readonly sessionsPerYear = computed(() => {
    const totals = this.summary()?.totals;
    if (!totals) {
      return 0;
    }
    const spanMs =
      new Date(totals.lastDate).getTime() - new Date(totals.firstDate).getTime();
    const years = Math.max(spanMs / (365.25 * 24 * 60 * 60 * 1000), 1 / 12);
    return Math.round(totals.workoutDays / years);
  });

  private charts: Chart[] = [];
  private injector = inject(Injector);

  constructor(private workoutService: WorkoutService) {}

  ngOnInit(): void {
    // Both in flight together: the summary draws every chart, the status draws
    // the target bands on one of them, and neither is worth a second round trip
    // of waiting. Each already fails soft to null, so forkJoin always completes.
    forkJoin({
      summary: this.workoutService.getWorkout(),
      status: this.workoutService.getMuscleVolumeStatus(),
    }).subscribe({
      next: ({ summary, status }) => {
        this.summary.set(summary);
        this.status.set(status);
        this.loaded.set(true);
        if (summary && summary.days.length) {
          // The chart canvases live behind an @if, so they enter the DOM on the
          // render that follows these signal writes. afterNextRender fires once
          // after that render — no requestAnimationFrame polling for the DOM.
          afterNextRender(() => this.buildCharts(summary, status), {
            injector: this.injector,
          });
        }
      },
      error: () => this.loaded.set(true),
    });
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.destroy());
  }

  private buildCharts(data: WorkoutSummary, status: MuscleVolumeStatus | null): void {
    Chart.defaults.color = AXIS;
    Chart.defaults.borderColor = GRID;
    Chart.defaults.font.family =
      "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

    this.buildVolume(data.days, data.totals.lastDate, status);
    this.buildRecovery(data.days, data.totals.lastDate, status);
    this.buildStrength(data.strengthSeries);
    this.buildWeekly(data.weeks);
    this.buildRadar(data.muscles);
    this.buildConsistency(data.weeks);
  }

  /**
   * Hard sets per muscle over the trailing window, each bar against that
   * muscle's own target band.
   *
   * Every number drawn here — the counts, the bands and the colour of each bar —
   * comes from the status endpoint. The page deliberately keeps no opinion of
   * its own: the last time it had one, it disagreed with the plan and drew
   * completed weeks in red. If the endpoint is unavailable the chart still
   * renders, from the same day summaries the rest of the page uses, but with no
   * bands and no verdict — an honest "I don't know" rather than a guess.
   */
  private buildVolume(
    days: WorkoutDay[],
    lastDate: string,
    status: MuscleVolumeStatus | null,
  ): void {
    const rows = status
      ? status.muscles
          .map((m) => ({
            muscle: m.muscle,
            sets: m.sets,
            countedSets: m.countedSets,
            sharedWith: m.sharedWith,
            target: m.target,
            // `??` so a response from before the field existed reads as "none".
            maintenance: m.maintenance ?? null,
            color: ZONE_BY_STATUS[m.status],
          }))
          .sort((a, b) => b.sets - a.sets)
      : this.untargetedRows(days, lastDate);

    if (!rows.length) {
      return;
    }

    // Headroom past the widest bar or band so the tip labels never clip.
    const widest = Math.max(
      ...rows.map((r) => Math.max(r.sets, r.target?.max ?? 0)),
    );
    const maxSets = widest + 4;

    // Each lane gets its own target band drawn behind its bar, since the
    // productive range differs by muscle.
    const band = {
      id: "targetBand",
      beforeDatasetsDraw: (chart: Chart) => {
        const { ctx, chartArea, scales } = chart;
        const x = scales["x"];
        const y = scales["y"];
        const rowH = (chartArea.bottom - chartArea.top) / rows.length;
        ctx.save();
        rows.forEach((r, i) => {
          const t = r.target;
          if (!t) return;
          const lo = x.getPixelForValue(t.min);
          const hi = x.getPixelForValue(t.max);
          const top = y.getPixelForValue(i) - rowH * 0.42;
          const h = rowH * 0.84;
          // Maintenance runs from its floor up to where the range begins.
          if (r.maintenance !== null && r.maintenance < t.min) {
            const floor = x.getPixelForValue(r.maintenance);
            ctx.fillStyle = "rgba(74,144,201,0.12)";
            ctx.fillRect(floor, top, lo - floor, h);
          }
          ctx.fillStyle = "rgba(27,175,122,0.12)";
          ctx.fillRect(lo, top, hi - lo, h);
          ctx.strokeStyle = "rgba(27,175,122,0.5)";
          ctx.setLineDash([3, 3]);
          for (const px of [lo, hi]) {
            ctx.beginPath();
            ctx.moveTo(px, top);
            ctx.lineTo(px, top + h);
            ctx.stroke();
          }
        });
        ctx.restore();
      },
    };

    // Set count at each bar tip.
    const labels = {
      id: "barCounts",
      afterDatasetsDraw: (chart: Chart) => {
        const { ctx } = chart;
        const meta = chart.getDatasetMeta(0);
        ctx.save();
        ctx.fillStyle = "#cccccc";
        ctx.font = "11px system-ui, sans-serif";
        ctx.textBaseline = "middle";
        meta.data.forEach((bar, i) => {
          ctx.fillText(String(rows[i].sets), (bar as { x: number }).x + 6, (bar as { y: number }).y);
        });
        ctx.restore();
      },
    };

    this.make("chart-7day", {
      type: "bar",
      data: {
        labels: rows.map((r) => r.muscle),
        datasets: [
          {
            label: "sets",
            data: rows.map((r) => r.sets),
            backgroundColor: rows.map((r) => r.color),
            borderWidth: 0,
            borderRadius: 3,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => {
                const r = rows[c.dataIndex];
                if (!r.target) {
                  return `${c.parsed.x} sets`;
                }
                // A target shared with another muscle is judged on the pair's
                // total, so say so rather than leaving the bar looking short of
                // a band it was never measured against alone.
                const shared = r.sharedWith?.length
                  ? ` · ${r.countedSets} with ${r.sharedWith.join(" + ")}`
                  : "";
                const maintenance =
                  r.maintenance !== null ? ` · maintenance ${r.maintenance}+` : "";
                return `${c.parsed.x} sets${shared} · target ${r.target.min}–${r.target.max}${maintenance}`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: maxSets,
            title: { display: true, text: `sets (last ${this.windowDays()} days)` },
            grid: { color: GRID },
          },
          y: { grid: { display: false } },
        },
      },
      plugins: [band, labels],
    });
  }

  /**
   * Bars for the degraded render, when the status endpoint gave us nothing.
   *
   * This sums the same stored day tallies the endpoint sums, but draws no
   * conclusion from them: no target, no verdict, one neutral colour. Summing is
   * not the part that drifted — deciding what the sum *means* is, and that
   * decision is not reproduced here. The window is anchored to the last logged
   * day rather than to now, since without a server-computed window there is no
   * `asOf` to honour and import lag would otherwise blank the chart.
   */
  private untargetedRows(
    days: WorkoutDay[],
    lastDate: string,
  ): {
    muscle: string;
    sets: number;
    countedSets: number;
    sharedWith: string[];
    target: { min: number; max: number } | null;
    maintenance: number | null;
    color: string;
  }[] {
    const end = new Date(`${lastDate}T00:00:00Z`);
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - (WINDOW_DAYS - 1));
    const from = start.toISOString().slice(0, 10);

    const sets = new Map<string, number>();
    for (const day of days) {
      if (day.date < from || day.date > lastDate) continue;
      for (const [muscle, count] of Object.entries(day.muscles ?? {})) {
        sets.set(muscle, (sets.get(muscle) ?? 0) + count);
      }
    }

    return MUSCLE_ORDER.filter((m) => (sets.get(m) ?? 0) > 0)
      .map((muscle) => ({
        muscle,
        sets: sets.get(muscle) as number,
        countedSets: sets.get(muscle) as number,
        sharedWith: [] as string[],
        target: null,
        maintenance: null,
        color: ZONE_NEUTRAL,
      }))
      .sort((a, b) => b.sets - a.sets);
  }

  /**
   * Days since each muscle was last trained.
   *
   * Which muscles are listed follows the plan: the ones it sets a target for are
   * the ones worth tracking recovery on. That list used to be "the muscles this
   * file has a range for", which is the same list only for as long as the two
   * agree — and they had already stopped agreeing. Falling back to every group
   * actually trained keeps the chart populated when the status read fails.
   */
  private buildRecovery(
    days: WorkoutDay[],
    lastDate: string,
    status: MuscleVolumeStatus | null,
  ): void {
    const end = new Date(`${lastDate}T00:00:00Z`).getTime();
    const dayMs = 24 * 60 * 60 * 1000;

    // Most recent day each muscle was worked; days-since measured from lastDate.
    const lastSeen = new Map<string, string>();
    for (const day of days) {
      for (const [muscle, count] of Object.entries(day.muscles ?? {})) {
        if (count > 0 && (!lastSeen.has(muscle) || day.date > lastSeen.get(muscle)!)) {
          lastSeen.set(muscle, day.date);
        }
      }
    }

    // Muscles not trained anywhere in the loaded window sink to the bottom,
    // capped so one dormant group doesn't blow out the axis.
    const CAP = 30;
    const tracked = status
      ? status.muscles.map((m) => m.muscle)
      : MUSCLE_ORDER.filter((m) => lastSeen.has(m));
    const rows = tracked.map((m) => {
      const seen = lastSeen.get(m);
      const since = seen
        ? Math.round((end - new Date(`${seen}T00:00:00Z`).getTime()) / dayMs)
        : CAP;
      return { muscle: m, since: Math.min(since, CAP), capped: !seen || since > CAP };
    }).sort((a, b) => b.since - a.since);

    // Longer since = more overdue for frequency (2x+/week is the aim).
    const recoveryColor = (since: number): string =>
      since <= 3 ? ZONE_OPTIMAL : since <= 6 ? ZONE_OVER : ZONE_UNDER;

    const labels = {
      id: "recoveryLabels",
      afterDatasetsDraw: (chart: Chart) => {
        const { ctx } = chart;
        ctx.save();
        ctx.fillStyle = "#cccccc";
        ctx.font = "11px system-ui, sans-serif";
        ctx.textBaseline = "middle";
        chart.getDatasetMeta(0).data.forEach((bar, i) => {
          const text = rows[i].capped ? `${CAP}+ d` : `${rows[i].since} d`;
          ctx.fillText(text, (bar as { x: number }).x + 6, (bar as { y: number }).y);
        });
        ctx.restore();
      },
    };

    this.make("chart-recovery", {
      type: "bar",
      data: {
        labels: rows.map((r) => r.muscle),
        datasets: [
          {
            label: "days",
            data: rows.map((r) => r.since),
            backgroundColor: rows.map((r) => recoveryColor(r.since)),
            borderWidth: 0,
            borderRadius: 3,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) =>
                rows[c.dataIndex].capped
                  ? "not in the last 30 days"
                  : `${c.parsed.x} days since last trained`,
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            suggestedMax: CAP + 5,
            title: { display: true, text: "days since last trained" },
            grid: { color: GRID },
          },
          y: { grid: { display: false } },
        },
      },
      plugins: [labels],
    });
  }

  private make(id: string, config: ChartConfiguration): void {
    const el = document.getElementById(id) as HTMLCanvasElement | null;
    if (el) {
      this.charts.push(new Chart(el, config));
    }
  }

  private buildStrength(series: StrengthSeries[]): void {
    const shown = series.filter((s) => s.points.length).slice(0, LIFTS_CHARTED);
    const months = [
      ...new Set(shown.flatMap((s) => s.points.map((p) => p.month))),
    ].sort();
    const datasets = shown.map((s, i) => {
      const byMonth = new Map(s.points.map((p) => [p.month, p.e1rmKg]));
      return {
        label: s.name,
        data: months.map((m) => byMonth.get(m) ?? null),
        borderColor: LINE_COLORS[i % LINE_COLORS.length],
        backgroundColor: LINE_COLORS[i % LINE_COLORS.length],
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.25,
        spanGaps: true,
      };
    });
    this.make("chart-strength", {
      type: "line",
      data: { labels: months, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, boxHeight: 12, usePointStyle: true } },
          tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${c.parsed.y} kg` } },
        },
        scales: {
          y: { title: { display: true, text: "est. 1RM (kg)" }, grid: { color: GRID } },
          x: { grid: { display: false }, ticks: { maxTicksLimit: 10, maxRotation: 45 } },
        },
      },
    });
  }

  private buildWeekly(weeks: WorkoutWeek[]): void {
    const shown = weeks.slice(-WEEKS_CHARTED);
    this.weeksShown.set(shown.length);
    const groups = MUSCLE_ORDER.filter((m) =>
      shown.some((w) => (w.muscles?.[m] ?? 0) > 0),
    );
    const datasets = groups.map((m) => ({
      label: m,
      data: shown.map((w) => w.muscles?.[m] ?? 0),
      backgroundColor: MUSCLE_COLORS[m],
      borderWidth: 0,
    }));
    this.make("chart-weekly", {
      type: "bar",
      data: { labels: shown.map((w) => w.week.replace(/^\d+-/, "")), datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "bottom", labels: { boxWidth: 12, boxHeight: 12 } },
          tooltip: { mode: "index", intersect: false },
        },
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { maxTicksLimit: 13 } },
          y: { stacked: true, title: { display: true, text: "sets" }, grid: { color: GRID } },
        },
      },
    });
  }

  private buildRadar(muscles: MuscleSummary[]): void {
    const shown = MUSCLE_ORDER.map((m) => ({
      muscle: m,
      sets: muscles.find((x) => x.muscle === m)?.sets ?? 0,
    })).filter((x) => x.sets > 0);
    this.make("chart-radar", {
      type: "radar",
      data: {
        labels: shown.map((x) => x.muscle),
        datasets: [
          {
            label: "sets",
            data: shown.map((x) => x.sets),
            borderColor: "#eda100",
            backgroundColor: "rgba(237,161,0,0.15)",
            borderWidth: 2,
            pointBackgroundColor: "#eda100",
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            angleLines: { color: GRID },
            grid: { color: GRID },
            pointLabels: { color: AXIS, font: { size: 11 } },
            ticks: { display: false },
          },
        },
      },
    });
  }

  private buildConsistency(weeks: WorkoutWeek[]): void {
    const shown = weeks.slice(-WEEKS_CHARTED);
    this.make("chart-consistency", {
      type: "bar",
      data: {
        labels: shown.map((w) => w.week.replace(/^\d+-/, "")),
        datasets: [
          {
            label: "sessions",
            data: shown.map((w) => w.sessions),
            backgroundColor: "#1baf7a",
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 13 } },
          y: { beginAtZero: true, grid: { color: GRID }, ticks: { precision: 0 } },
        },
      },
    });
  }
}
