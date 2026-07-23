import { Component, OnInit, inject, signal } from "@angular/core";

import { HomeService } from "../../services/home.service";

/**
 * Home component that displays the main landing page with personal motto and profile information.
 * The component shows a series of motto lines with different heading levels and a profile section.
 */
@Component({
  selector: "app-home",
  standalone: true,
  imports: [],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent implements OnInit {
  private homeService = inject(HomeService);

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

  ngOnInit(): void {
    this.homeService.getHome().subscribe({
      next: (data) => {
        this.mottoes.set(data.mottoes ?? []);
      },
      error: () => {
        // Leave the hero without motto lines.
      },
    });
  }
}
