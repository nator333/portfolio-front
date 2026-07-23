import {
  Component,
  input,
  computed,
  effect,
  inject,
  ElementRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { ActivityEntry, ActivityType } from "../../models/activity-data";

const TYPE_LABELS: Record<ActivityType, string> = {
  blog: "Blog",
  gym: "Gym",
  github: "GitHub",
};

/**
 * Chronological list of activity entries, the detail surface beside the
 * contribution calendar. Newest first; when a day is selected on the calendar,
 * its entries highlight and the first scrolls into view.
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

  private readonly host = inject(ElementRef<HTMLElement>);

  /** Entries newest first; ISO dates sort correctly as strings. */
  readonly sortedEntries = computed(() =>
    [...this.entries()].sort((a, b) => b.date.localeCompare(a.date)),
  );

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

  typeLabel(type: ActivityType): string {
    return TYPE_LABELS[type];
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
