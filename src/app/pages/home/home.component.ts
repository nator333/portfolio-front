import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";

import { HomeService } from "../../services/home.service";
import { BlogService } from "../../services/blog.service";
import { ContributionCalendarComponent } from "../../components/contribution-calendar/contribution-calendar.component";
import { ActivityFeedComponent } from "../../components/activity-feed/activity-feed.component";
import {
  ActivityEntry,
  activityToContributions,
} from "../../models/activity-data";
import { toIsoDate } from "../../utils/contribution-calendar.util";

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
  private blogService = inject(BlogService);

  // Populated from the API response (edited via /home-edit); a never-saved
  // item (mottoes: null) or a failed read renders no motto lines.
  readonly mottoes = signal<string[]>([]);

  readonly profile: string[] = ["Hi, I'm Hiro Nakamata", "Software Engineer"];
  readonly kappiInfo: string[] = [
    "https://www.instagram.com/f_spiritt?utm_source=ig_web_button_share_sheet&igsh=MTZyZXIxaG12cW0xZQ==",
    "Toshifumi Kakiuchi",
  ];
  readonly sighInfo: string[] = [
    "assets/home/my_name_gold.png",
    "Hiro Nakamata Signature",
  ];

  // Activity entries feeding both the calendar and the feed. Blog posts are
  // the first source; gym sessions and GitHub activity will merge in here by
  // concatenating their own entries. Empty until sources load, and left empty
  // on failure — the calendar still renders its blank grid.
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

    this.blogService.getAllPosts().subscribe({
      next: (posts) => {
        this.entries.set(
          posts.map((post) => ({
            date: toIsoDate(post.date),
            type: "blog" as const,
            title: post.title,
            url: post.url,
          })),
        );
      },
      error: () => {
        // Leave the calendar and feed empty.
      },
    });
  }
}
