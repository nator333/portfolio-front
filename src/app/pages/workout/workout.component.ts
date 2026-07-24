import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
} from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { Chart, ChartConfiguration } from "chart.js/auto";

import { HeroComponent } from "../../components/hero/hero.component";
import { WorkoutService } from "../../services/workout.service";
import {
  WorkoutSummary,
  StrengthSeries,
  WorkoutWeek,
  MuscleSummary,
} from "../../models/workout-data";

/** Muscle-group colours, shared by the weekly-volume and balance charts so a
 *  group reads the same in both. */
const MUSCLE_COLORS: Record<string, string> = {
  Chest: "#2a78d6",
  Back: "#eb6834",
  Legs: "#1baf7a",
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
  readonly loaded = signal(false);
  readonly weeksShown = signal(0);

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

  constructor(private workoutService: WorkoutService) {}

  ngOnInit(): void {
    this.workoutService.getWorkout().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loaded.set(true);
        if (data && data.days.length) {
          this.renderWhenReady(data);
        }
      },
      error: () => this.loaded.set(true),
    });
  }

  ngOnDestroy(): void {
    this.charts.forEach((c) => c.destroy());
  }

  /** The chart canvases live behind an @if, so they enter the DOM a change-
   *  detection cycle after the data arrives. Poll per frame until they exist
   *  rather than guessing a fixed delay. */
  private renderWhenReady(data: WorkoutSummary, attempts = 0): void {
    if (document.getElementById("chart-strength")) {
      this.buildCharts(data);
    } else if (attempts < 60) {
      requestAnimationFrame(() => this.renderWhenReady(data, attempts + 1));
    }
  }

  private buildCharts(data: WorkoutSummary): void {
    Chart.defaults.color = AXIS;
    Chart.defaults.borderColor = GRID;
    Chart.defaults.font.family =
      "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

    this.buildStrength(data.strengthSeries);
    this.buildWeekly(data.weeks);
    this.buildRadar(data.muscles);
    this.buildConsistency(data.weeks);
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
