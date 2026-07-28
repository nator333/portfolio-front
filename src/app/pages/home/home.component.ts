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
import {
  ActivityEntry,
  activityToContributions,
} from "../../models/activity-data";

/**
 * Home component that displays the main landing page with personal motto and profile information.
 * The component shows a series of motto lines with different heading levels and a profile section.
 */
@Component({
  selector: "app-home",
  standalone: true,
  imports: [ContributionCalendarComponent, ActivityFeedComponent],
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

  // Per-day counts derived from the entries, for the calendar grid.
  readonly contributions = computed(() =>
    activityToContributions(this.entries()),
  );

  // Day currently selected on the calendar; drives the feed highlight.
  readonly selectedDate = signal<string | null>(null);

  onDaySelected(date: string): void {
    // Toggle: clicking the highlighted day again clears the selection.
    this.selectedDate.update((current) => (current === date ? null : date));
  }

  ngOnInit(): void {
    this.homeService.getHome().subscribe({
      next: (data) => {
        this.mottoes.set(data.mottoes ?? []);
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
