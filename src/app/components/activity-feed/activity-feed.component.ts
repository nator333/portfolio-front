import {
  Component,
  input,
  computed,
  signal,
  effect,
  inject,
  ElementRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  ActivityEntry,
  ActivityType,
  ACTIVITY_TYPE_LABELS,
  GitHubDaySummary,
} from "../../models/activity-data";

/** Route for the training page; gym entries link here when self-linkless. */
const TRAINING_ROUTE = "/workout";

/**
 * Chronological list of activity entries, the detail surface beside the
 * contribution calendar. Newest first; when a day is selected on the calendar,
 * its entries highlight and the first scrolls into view.
 *
 * A day's GitHub work summary hangs off that day's first GitHub entry, clamped
 * to a couple of lines until expanded — selecting the day expands it too.
 */
@Component({
  selector: "app-activity-feed",
  standalone: true,
  imports: [RouterLink],
  templateUrl: "./activity-feed.component.html",
  styleUrl: "./activity-feed.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityFeedComponent {
  readonly entries = input<ActivityEntry[]>([]);
  /** Currently selected calendar day, or null. Matching entries highlight. */
  readonly selectedDate = input<string | null>(null);
  /** Daily GitHub work summaries; each shows under its day's first GitHub entry. */
  readonly summaries = input<GitHubDaySummary[]>([]);

  /** Days whose summary the visitor expanded. */
  private readonly expanded = signal<ReadonlySet<string>>(new Set());

  private readonly host = inject(ElementRef<HTMLElement>);

  /** Entries newest first; ISO dates sort correctly as strings. */
  readonly sortedEntries = computed(() =>
    [...this.entries()].sort((a, b) => b.date.localeCompare(a.date)),
  );

  /**
   * Summary text keyed by the entry it hangs off: the first GitHub entry of
   * its day in feed order. A day with no GitHub entry shown — filtered out, or
   * outside the loaded range — shows no summary.
   */
  private readonly summaryByEntry = computed(() => {
    const byDate = new Map(this.summaries().map((s) => [s.date, s.summary]));
    const anchored = new Map<ActivityEntry, string>();
    for (const entry of this.sortedEntries()) {
      const summary = entry.type === "github" ? byDate.get(entry.date) : undefined;
      if (summary) {
        anchored.set(entry, summary);
        byDate.delete(entry.date);
      }
    }
    return anchored;
  });

  constructor() {
    // Bring the selected day's first entry into view when the selection
    // changes. Best-effort: runs after the class binding lands, guards for a
    // missing element or non-DOM environment.
    effect(() => {
      const date = this.selectedDate();
      if (!date) {
        return;
      }
      queueMicrotask(() => {
        const el = this.host.nativeElement.querySelector(
          ".feed-item.is-selected",
        ) as HTMLElement | null;
        if (typeof el?.scrollIntoView === "function") {
          el.scrollIntoView({ block: "nearest" });
        }
      });
    });
  }

  summaryFor(entry: ActivityEntry): string | undefined {
    return this.summaryByEntry().get(entry);
  }

  isSummaryExpanded(date: string): boolean {
    return this.expanded().has(date) || this.selectedDate() === date;
  }

  toggleSummary(date: string): void {
    const open = this.isSummaryExpanded(date);
    this.expanded.update((current) => {
      const next = new Set(current);
      if (open) {
        next.delete(date);
      } else {
        next.add(date);
      }
      return next;
    });
  }

  typeLabel(type: ActivityType): string {
    return ACTIVITY_TYPE_LABELS[type];
  }

  /**
   * Where an entry's title links. Gym sessions have no page of their own, so
   * they route to the training page; an explicit url on the entry still wins.
   */
  entryUrl(entry: ActivityEntry): string | undefined {
    return entry.url ?? (entry.type === "gym" ? TRAINING_ROUTE : undefined);
  }

  /** True for absolute http(s) URLs; those open in a new tab via href. */
  isExternal(url: string): boolean {
    return /^https?:\/\//.test(url);
  }

  /** "Jul 20, 2026" from a YYYY-MM-DD string, without a timezone shift. */
  formatDate(iso: string): string {
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }
}
