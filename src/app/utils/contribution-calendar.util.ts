/**
 * Pure layout math for the GitHub-style contribution calendar. Kept free of
 * Angular so the grid geometry and level bucketing can be unit-tested in
 * isolation and reused regardless of the data source (blog dates today, a
 * GitHub proxy later).
 */

/** One day's activity, keyed by a local calendar date (YYYY-MM-DD). */
export interface ContributionDay {
  date: string;
  count: number;
}

/** Intensity bucket, 0 (empty) through 4 (most active). */
export type ContributionLevel = 0 | 1 | 2 | 3 | 4;

export interface CalendarCell {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  count: number;
  level: ContributionLevel;
  /** True for real days within [start, end]; false for trailing future padding. */
  inRange: boolean;
}

export interface CalendarWeek {
  /** Seven cells, Sunday (index 0) through Saturday (index 6). */
  days: CalendarCell[];
}

export interface MonthLabel {
  label: string;
  /** Column (week) index the label sits above. */
  weekIndex: number;
}

export interface CalendarModel {
  weeks: CalendarWeek[];
  months: MonthLabel[];
  /** Sum of counts within range. */
  total: number;
  maxCount: number;
}

export interface CalendarOptions {
  /** Last day shown; defaults to today. Its week is the rightmost column. */
  end?: Date;
  /** Number of week columns; defaults to a full year. */
  weeks?: number;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const DAYS_IN_WEEK = 7;
const DEFAULT_WEEKS = 53;
/** Minimum columns the leading month needs before its label is kept. */
const MIN_FIRST_MONTH_WEEKS = 2;

function pad2(value: number): string {
  return value < 10 ? `0${value}` : String(value);
}

/** Format a Date as a local YYYY-MM-DD string (no timezone shift). */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

/**
 * Collapse a list of event dates into per-day contribution counts (one per
 * occurrence). Turns any dated activity — blog posts, gym sessions, GitHub
 * events — into calendar input. To combine several sources, concatenate their
 * results and pass them straight to buildCalendarModel, which sums any dates
 * that overlap.
 */
export function toDailyContributions(dates: Date[]): ContributionDay[] {
  const counts = new Map<string, number>();
  for (const date of dates) {
    const iso = toIsoDate(date);
    counts.set(iso, (counts.get(iso) ?? 0) + 1);
  }
  return Array.from(counts, ([date, count]) => ({ date, count }));
}

/** Midnight of the given date, in local time. */
function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** A new date `days` after the given one, staying in local time. */
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Bucket a day's count into an intensity level. For small maxima (the common
 * case with blog dates, where most days are 0 or 1) counts map straight to
 * levels so a single post reads as level 1 rather than saturating; only once
 * activity is denser does bucketing switch to proportional thresholds.
 */
function toLevel(count: number, max: number): ContributionLevel {
  if (count <= 0) {
    return 0;
  }
  if (max <= 4) {
    return Math.min(count, 4) as ContributionLevel;
  }
  const ratio = count / max;
  if (ratio > 0.75) {
    return 4;
  }
  if (ratio > 0.5) {
    return 3;
  }
  if (ratio > 0.25) {
    return 2;
  }
  return 1;
}

/**
 * Build the calendar grid: `weeks` columns of seven day-cells, aligned so the
 * rightmost column is the week containing `end`. Days after `end` are emitted
 * as out-of-range padding to keep the current week aligned; days before the
 * first column are simply not shown.
 */
export function buildCalendarModel(
  contributions: ContributionDay[],
  options: CalendarOptions = {},
): CalendarModel {
  const weeksCount = options.weeks ?? DEFAULT_WEEKS;
  const end = startOfDay(options.end ?? new Date());

  // Aggregate counts per date, summing any duplicate entries defensively.
  const counts = new Map<string, number>();
  for (const item of contributions) {
    if (!item?.date) {
      continue;
    }
    counts.set(item.date, (counts.get(item.date) ?? 0) + (item.count ?? 0));
  }
  const maxCount = counts.size ? Math.max(...counts.values()) : 0;

  // The current week's Sunday anchors the last column; step back to reach the
  // first column's Sunday.
  const currentSunday = addDays(end, -end.getDay());
  const firstSunday = addDays(currentSunday, -(weeksCount - 1) * DAYS_IN_WEEK);

  const weeks: CalendarWeek[] = [];
  const months: MonthLabel[] = [];
  let total = 0;
  let lastMonth = -1;

  for (let w = 0; w < weeksCount; w++) {
    const sunday = addDays(firstSunday, w * DAYS_IN_WEEK);
    const days: CalendarCell[] = [];

    for (let d = 0; d < DAYS_IN_WEEK; d++) {
      const day = addDays(sunday, d);
      const iso = toIsoDate(day);
      const inRange = day.getTime() <= end.getTime();
      const count = inRange ? (counts.get(iso) ?? 0) : 0;
      if (inRange) {
        total += count;
      }
      days.push({ date: iso, count, level: toLevel(count, maxCount), inRange });
    }
    weeks.push({ days });

    // Label a column when its Sunday opens a month not yet labelled.
    const month = sunday.getMonth();
    if (month !== lastMonth) {
      months.push({ label: MONTH_NAMES[month], weekIndex: w });
      lastMonth = month;
    }
  }

  // The first column is almost always a mid-month stub; drop its label when
  // the next month starts within a column or two, so the two labels don't
  // collide. Real months are ~4 weeks apart, so later labels never crowd.
  if (
    months.length > 1 &&
    months[1].weekIndex - months[0].weekIndex < MIN_FIRST_MONTH_WEEKS
  ) {
    months.shift();
  }

  return { weeks, months, total, maxCount };
}
