import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HomeService } from "../../services/home.service";
import { DEFAULT_MOTTOES } from "../../models/home-data";

/**
 * Home component that displays the main landing page with personal motto and profile information.
 * The component shows a series of motto lines with different heading levels and a profile section.
 */
@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent implements OnInit {
  private homeService = inject(HomeService);

  // Bundled defaults render immediately; the API response (edited via
  // /home-edit) replaces them when it arrives. On error the defaults stay.
  readonly mottoes = signal<string[]>(DEFAULT_MOTTOES);

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
        if (data.mottoes?.length) {
          this.mottoes.set(data.mottoes);
        }
      },
      error: () => {
        // Defaults already shown; a failed read never blanks the hero.
      },
    });
  }
}
