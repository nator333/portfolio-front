import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";

import { HomeService } from "../../services/home.service";
import { ActivityService } from "../../services/activity.service";
import { ContributionCalendarComponent } from "../../components/contribution-calendar/contribution-calendar.component";
import { ActivityFeedComponent } from "../../components/activity-feed/activity-feed.component";
import { ActivityFiltersComponent } from "../../components/activity-filters/activity-filters.component";
import {
  ActivityEntry,
  ActivityType,
  ACTIVITY_TYPES,
  activityToContributions,
} from "../../models/activity-data";

/**
 * Home component that displays the main landing page with personal motto and profile information.
 * The component shows a series of motto lines with different heading levels and a profile section.
 */
@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    ContributionCalendarComponent,
    ActivityFeedComponent,
    ActivityFiltersComponent,
  ],
  templateUrl: "./home.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./home.component.scss",
})
export class HomeComponent implements OnInit {
  private homeService = inject(HomeService);
  private activityService = inject(ActivityService);

  // Populated from the API response (edited via /home-edit); a never-saved
  // item (mottoes: null) or a failed read renders no motto lines.
  readonly mottoes = signal<string[]>([]);

  // Admin toggle from /home-edit: when true the hero shows no motto lines even
  // though `mottoes` is kept, so they can be hidden without being retyped.
  readonly mottoesHidden = signal<boolean>(false);

  readonly profile: string[] = ["Hi, I'm Hiro Nakamata", "Software Engineer"];
  readonly kappiInfo: string[] = [
    "https://www.instagram.com/f_spiritt?utm_source=ig_web_button_share_sheet&igsh=MTZyZXIxaG12cW0xZQ==",
    "Toshifumi Kakiuchi",
  ];
  readonly sighInfo: string[] = [
    "assets/my_name_gold.png",
    "Hiro Nakamata Signature",
  ];

  // Activity entries feeding both the calendar and the feed. The API merges
  // GitHub, gym and blog server-side and returns one flat list, so a new source
  // appears here without this component changing. Empty until it loads, and
  // left empty on failure — the calendar still renders its blank grid.
  readonly entries = signal<ActivityEntry[]>([]);

  // Activity types switched on in the filter badges. Every type starts active,
  // so the calendar and feed show everything until the visitor narrows it down.
  readonly activeTypes = signal<Set<ActivityType>>(new Set(ACTIVITY_TYPES));

  // Types that actually occur in the loaded entries, in canonical order — the
  // badges only offer filters that would change what's shown.
  readonly availableTypes = computed(() => {
    const present = new Set(this.entries().map((entry) => entry.type));
    return ACTIVITY_TYPES.filter((type) => present.has(type));
  });

  // Active types as an ordered array, for the filter badges' `active` input.
  readonly activeTypeList = computed(() =>
    ACTIVITY_TYPES.filter((type) => this.activeTypes().has(type)),
  );

  // Entries kept by the current type filter; feeds both the calendar and list.
  readonly filteredEntries = computed(() => {
    const active = this.activeTypes();
    return this.entries().filter((entry) => active.has(entry.type));
  });

  // Per-day counts derived from the filtered entries, for the calendar grid.
  readonly contributions = computed(() =>
    activityToContributions(this.filteredEntries()),
  );

  // Day currently selected on the calendar; drives the feed highlight.
  readonly selectedDate = signal<string | null>(null);

  onDaySelected(date: string): void {
    // Toggle: clicking the highlighted day again clears the selection.
    this.selectedDate.update((current) => (current === date ? null : date));
  }

  // Flip a type on or off; a new Set keeps the signal change detectable.
  // From the all-on state, tapping a badge isolates it — the other types
  // switch off — so a single tap narrows to one source instead of merely
  // dropping the tapped one.
  onTypeToggled(type: ActivityType): void {
    const available = this.availableTypes();
    this.activeTypes.update((current) => {
      const allOn = available.every((t) => current.has(t));
      if (allOn && available.length > 1) {
        return new Set([type]);
      }
      const next = new Set(current);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  ngOnInit(): void {
    this.homeService.getHome().subscribe({
      next: (data) => {
        this.mottoes.set(data.mottoes ?? []);
        this.mottoesHidden.set(data.mottoesHidden ?? false);
      },
      error: () => {
        // Leave the hero without motto lines.
      },
    });

    this.activityService.getActivity().subscribe({
      next: (entries) => {
        this.entries.set(entries);
      },
      error: () => {
        // Leave the calendar and feed empty.
      },
    });
  }
}
