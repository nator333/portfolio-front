import {
  Component,
  input,
  computed,
  signal,
  inject,
  DestroyRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import {
  buildCalendarModel,
  CalendarCell,
} from "../../utils/contribution-calendar.util";
import type { ContributionDay } from "../../utils/contribution-calendar.util";

/** Pixel geometry of the SVG grid. */
const CELL_SIZE = 11;
const CELL_GAP = 3;
const STEP = CELL_SIZE + CELL_GAP;
const LEFT_PAD = 28; // room for weekday labels
const TOP_PAD = 18; // room for month labels

/** Matches the 768px breakpoint used across the site's stylesheets. */
const MOBILE_BREAKPOINT_PX = 768;
/** Weeks per month, for phrasing the scope label. */
const WEEKS_PER_MONTH = 4.345;

/** Weekday rows (Mon, Wed, Fri) that carry a label, GitHub-style. */
const WEEKDAY_LABELS: readonly { row: number; text: string }[] = [
  { row: 1, text: "Mon" },
  { row: 3, text: "Wed" },
  { row: 5, text: "Fri" },
];

/**
 * GitHub-style contribution calendar: a 53-week × 7-day grid of intensity
 * squares rendered as inline SVG. Purely presentational and data-source
 * agnostic — feed it a `{ date, count }[]`; the caller decides what a
 * "contribution" is.
 */
@Component({
  selector: "app-contribution-calendar",
  standalone: true,
  imports: [],
  templateUrl: "./contribution-calendar.component.html",
  styleUrl: "./contribution-calendar.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContributionCalendarComponent {
  /** Activity to plot; days not present are rendered as empty (level 0). */
  readonly contributions = input<ContributionDay[]>([]);
  /** Number of week columns on wide viewports. */
  readonly weeks = input<number>(53);
  /**
   * Number of week columns below the mobile breakpoint. Fewer weeks keep the
   * squares full-size instead of scaling the whole year down to specks; the
   * trade-off is a shorter recent window (~4 months by default).
   */
  readonly mobileWeeks = input<number>(17);
  /** Last day shown; its week is the rightmost column. */
  readonly end = input<Date>(new Date());
  /** Noun used in tooltips, e.g. "3 posts on 2026-01-05". */
  readonly noun = input<string>("contribution");

  readonly cellSize = CELL_SIZE;
  readonly step = STEP;
  readonly leftPad = LEFT_PAD;
  readonly topPad = TOP_PAD;
  readonly weekdayLabels = WEEKDAY_LABELS;
  /** Legend swatches, least to most active. */
  readonly legendLevels = [0, 1, 2, 3, 4] as const;

  /** True while the viewport is at or below the mobile breakpoint. */
  private readonly isMobile = signal(false);

  /** Columns actually rendered, narrowed on mobile. */
  readonly effectiveWeeks = computed(() =>
    this.isMobile() ? this.mobileWeeks() : this.weeks(),
  );

  readonly model = computed(() =>
    buildCalendarModel(this.contributions(), {
      weeks: this.effectiveWeeks(),
      end: this.end(),
    }),
  );

  readonly width = computed(
    () => this.leftPad + this.effectiveWeeks() * this.step,
  );
  readonly height = computed(() => this.topPad + 7 * this.step);

  /** Scope phrasing for the summary line, matching the visible range. */
  readonly scopeLabel = computed(() => {
    const weeks = this.effectiveWeeks();
    if (weeks >= 52) {
      return "in the last year";
    }
    const months = Math.round(weeks / WEEKS_PER_MONTH);
    return months >= 2
      ? `in the last ${months} months`
      : `in the last ${weeks} weeks`;
  });

  constructor() {
    // Track the breakpoint with matchMedia (no CDK dependency). Guarded for
    // non-browser environments; listener torn down with the component.
    if (typeof window !== "undefined" && window.matchMedia) {
      const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
      this.isMobile.set(query.matches);
      const onChange = (event: MediaQueryListEvent) =>
        this.isMobile.set(event.matches);
      query.addEventListener("change", onChange);
      inject(DestroyRef).onDestroy(() =>
        query.removeEventListener("change", onChange),
      );
    }
  }

  /** X of a week column's left edge. */
  columnX(weekIndex: number): number {
    return this.leftPad + weekIndex * this.step;
  }

  /** Y of a day row's top edge. */
  rowY(dayIndex: number): number {
    return this.topPad + dayIndex * this.step;
  }

  /** Human-readable tooltip for a cell. */
  tooltip(cell: CalendarCell): string {
    const noun = this.noun();
    if (cell.count === 0) {
      return `No ${noun}s on ${cell.date}`;
    }
    return `${cell.count} ${noun}${cell.count === 1 ? "" : "s"} on ${cell.date}`;
  }
}
