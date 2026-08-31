import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from "@angular/core";
import {
  provideRouter,
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
import { recoverFromChunkLoadError } from "./utils/chunk-reload";

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
    provideZoneChangeDetection({ eventCoalescing: true }),
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
      withInterceptors([apiKeyInterceptor, authTokenInterceptor]),
      withXhr(),
    ),
    provideAppInitializer(() => inject(AnalyticsService).init()),
  ],
};
