import { ContributionDay } from "../utils/contribution-calendar.util";

/**
 * A single dated activity shown in the feed and counted on the contribution
 * calendar. Blog posts are the first source; gym sessions and GitHub activity
 * slot in later by producing more entries of their own type.
 */
export type ActivityType = "blog" | "gym" | "github";

export interface ActivityEntry {
  /** Local calendar date, YYYY-MM-DD (matches ContributionDay.date). */
  date: string;
  type: ActivityType;
  title: string;
  /** In-app route ("/blog/x") or external URL; omitted when not linkable. */
  url?: string;
}

/**
 * Collapse entries into per-day counts for the calendar grid — one count per
 * entry on its date. Concatenate several sources' entries and pass the result
 * straight through; buildCalendarModel also sums any dates that overlap.
 */
export function activityToContributions(
  entries: ActivityEntry[],
): ContributionDay[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (!entry?.date) {
      continue;
    }
    counts.set(entry.date, (counts.get(entry.date) ?? 0) + 1);
  }
  return Array.from(counts, ([date, count]) => ({ date, count }));
}
