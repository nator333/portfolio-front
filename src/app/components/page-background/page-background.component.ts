import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  effect,
  inject,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";

import { PageBackgroundService } from "../../services/page-background.service";

// Set on <body> while a photo is shown; styles.scss uses it to make the
// page-level black backgrounds transparent so the photo shows through.
const PAGE_PHOTO_CLASS = "has-page-photo";

/**
 * The background photo behind every page. It lives in the app shell, so it is
 * not re-created on navigation and the same photo stays put across tabs, and
 * it is fixed to the viewport, so it stays still while pages scroll over it.
 */
@Component({
  selector: "app-page-background",
  standalone: true,
  template: `
    @if (background.photo(); as photo) {
      <!--
        Starts transparent over the black page and fades in once decoded, so a
        slow photo never delays or reflows the page — it only appears.
      -->
      <img
        class="page-photo"
        [class.is-loaded]="background.loaded()"
        [src]="photo.url"
        [alt]="photo.alt ?? ''"
        fetchpriority="high"
        decoding="async"
        (load)="background.loaded.set(true)"
      />
      <div class="page-overlay" aria-hidden="true"></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./page-background.component.scss",
})
export class PageBackgroundComponent implements OnInit {
  readonly background = inject(PageBackgroundService);
  private document = inject(DOCUMENT);

  constructor() {
    effect(() => {
      this.document.body.classList.toggle(
        PAGE_PHOTO_CLASS,
        !!this.background.photo(),
      );
    });
  }

  ngOnInit(): void {
    this.background.load();
  }
}
