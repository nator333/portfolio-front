import { Injectable, inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";

import { environment } from "../../environments/environment";

/** GA4 Measurement ID for the portfolio (Firebase project portfolio-dcf40). */
const MEASUREMENT_ID = "G-QSJ2ZK2RRJ";

type GtagFn = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: GtagFn;
  }
}

/**
 * Google Analytics 4 integration.
 *
 * gtag.js only fires a page_view on the initial document load, so an SPA with
 * client-side routing has to report route changes itself. This service loads
 * gtag.js with automatic page_views disabled and sends one page_view per
 * NavigationEnd (the first navigation included).
 *
 * Guarded to production: on `ng serve` nothing is loaded and no hits are sent.
 */
@Injectable({ providedIn: "root" })
export class AnalyticsService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  /** Bootstrap analytics. No-op outside production. */
  init(): void {
    if (!environment.production) {
      return;
    }

    this.loadGtag();
    this.trackNavigations();
  }

  private loadGtag(): void {
    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      // gtag relies on `arguments`, so this cannot be an arrow function.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };

    window.gtag("js", new Date());
    // Route changes are reported manually in trackNavigations().
    window.gtag("config", MEASUREMENT_ID, { send_page_view: false });

    const script = this.document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    this.document.head.appendChild(script);
  }

  private trackNavigations(): void {
    const window = this.document.defaultView;
    if (!window) {
      return;
    }

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        window.gtag("event", "page_view", {
          page_path: event.urlAfterRedirects,
          page_location: window.location.href,
          page_title: this.document.title,
        });
      });
  }
}
