import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

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
export class HomeComponent {
  readonly mottoes: string[] = [
    "Scream Dependencies",
    "Hide Complexities",
    "Embrace Criticism",
    "Yet, Seek Connections",
  ];
  readonly profile: string[] = ["Hi, I'm Hiro Nakamata", "Software Engineer"];
  readonly kappiInfo: string[] = [
    "https://www.instagram.com/f_spiritt?utm_source=ig_web_button_share_sheet&igsh=MTZyZXIxaG12cW0xZQ==",
    "Toshifumi Kakiuchi",
  ];
  readonly sighInfo: string[] = [
    "assets/home/my_name_gold.png",
    "Hiro Nakamata Signature",
  ];
}
