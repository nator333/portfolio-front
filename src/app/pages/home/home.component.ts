import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { HomeService } from "../../services/home.service";
import { BlogService } from "../../services/blog.service";
import { ContributionCalendarComponent } from "../../components/contribution-calendar/contribution-calendar.component";
import {
  ContributionDay,
  toDailyContributions,
} from "../../utils/contribution-calendar.util";

/**
 * Home component that displays the main landing page with personal motto and profile information.
 * The component shows a series of motto lines with different heading levels and a profile section.
 */
@Component({
  selector: "app-home",
  standalone: true,
  imports: [ContributionCalendarComponent],
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

  // Activity plotted on the contribution calendar. Blog posts are the first
  // source; gym sessions and GitHub activity will merge in here by simply
  // concatenating their own ContributionDay[] (buildCalendarModel sums any
  // overlapping dates). Empty until sources load, and left empty on failure —
  // the calendar still renders its blank grid.
  readonly activity = signal<ContributionDay[]>([]);

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
        this.activity.set(
          toDailyContributions(posts.map((post) => post.date)),
        );
      },
      error: () => {
        // Leave the calendar with a blank grid.
      },
    });
  }
}
