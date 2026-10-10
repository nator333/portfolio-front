import { Injectable, inject, signal } from "@angular/core";

import { HomeService } from "./home.service";
import { BackgroundPhoto } from "../models/home-data";

/**
 * The site-wide background photo. One of the home document's saved photos is
 * picked at random once per app load and kept for the rest of the visit, so
 * every page shows the same photo as the visitor moves between tabs.
 */
@Injectable({
  providedIn: "root",
})
export class PageBackgroundService {
  private homeService = inject(HomeService);
  private requested = false;

  // null keeps the plain black page (nothing saved, or the read failed).
  readonly photo = signal<BackgroundPhoto | null>(null);

  // Set when the photo has decoded, to fade it (and the home caption) in.
  readonly loaded = signal<boolean>(false);

  /** Fetches and picks the photo; later calls are no-ops. */
  load(): void {
    if (this.requested) {
      return;
    }
    this.requested = true;
    this.homeService.getHome().subscribe({
      next: (data) => this.photo.set(pickRandom(data.backgrounds ?? [])),
      error: () => {
        // Keep the plain black page.
      },
    });
  }
}

function pickRandom<T>(items: T[]): T | null {
  return items.length ? items[Math.floor(Math.random() * items.length)] : null;
}
