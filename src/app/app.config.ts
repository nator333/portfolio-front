import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from "@angular/core";
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
  withNavigationErrorHandler,
  withViewTransitions,
} from "@angular/router";
import {
  provideHttpClient,
  withInterceptors,
  withXhr,
} from "@angular/common/http";

import { AnalyticsService } from "./services/analytics.service";
import {
  apiKeyInterceptor,
  authTokenInterceptor,
} from "./interceptors/api.interceptors";
import { loadingInterceptor } from "./interceptors/loading.interceptor";
import { recoverFromChunkLoadError } from "./utils/chunk-reload";
import { BrandTitleStrategy } from "./title-strategy";

import "prismjs";
import "prismjs/components/prism-typescript.min.js";
import "prismjs/components/prism-css.min.js";
import "prismjs/components/prism-javascript.min.js";
import "prismjs/components/prism-java.min.js";
import "prismjs/components/prism-bash.min.js";
import "prismjs/components/prism-yaml.min.js";
// Import Prism plugins
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-highlight/prism-line-highlight.js";
import "prismjs/plugins/command-line/prism-command-line.js";

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Zoneless: the app ships no zone.js and change detection is driven by
    // signals, template events, router navigation, and afterRender hooks. Every
    // view that mutated state from an async callback or DOM timer was migrated
    // to signals / render callbacks first (see the phase-2 refactors).
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      // Bind route params (e.g. :url, :slug) straight to component inputs, so
      // pages read them as signal inputs instead of reaching into ActivatedRoute.
      withComponentInputBinding(),
      // Animate route changes with the native View Transitions API (a graceful
      // cross-fade where supported, an instant swap where not).
      withViewTransitions(),
      // Scroll to the top on forward navigation, restore the prior position on
      // back/forward, and honour #fragment anchors in long pages (blog posts).
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
      withNavigationErrorHandler(recoverFromChunkLoadError),
    ),
    provideHttpClient(
      withInterceptors([
        loadingInterceptor,
        apiKeyInterceptor,
        authTokenInterceptor,
      ]),
      withXhr(),
    ),
    provideAppInitializer(() => inject(AnalyticsService).init()),
    // Brand each route's title (browser tab, history, bookmarks) as
    // "Page · Hiro Nakamata" from the routes' `title` fields.
    { provide: TitleStrategy, useClass: BrandTitleStrategy },
  ],
};
