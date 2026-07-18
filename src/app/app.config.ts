import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideEnvironmentInitializer,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { initializeApp, provideFirebaseApp } from "@angular/fire/app";
import {
  getAnalytics,
  provideAnalytics,
  ScreenTrackingService,
} from "@angular/fire/analytics";

import { environment } from "../environments/environment";
import 'prismjs';
import 'prismjs/components/prism-typescript.min.js';
import 'prismjs/components/prism-css.min.js';
import 'prismjs/components/prism-javascript.min.js';
import 'prismjs/components/prism-java.min.js';
import 'prismjs/components/prism-bash.min.js';
import 'prismjs/components/prism-yaml.min.js';
// Import Prism plugins
import 'prismjs/plugins/line-numbers/prism-line-numbers.js';
import 'prismjs/plugins/line-highlight/prism-line-highlight.js';
import 'prismjs/plugins/command-line/prism-command-line.js';

import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    // ScreenTrackingService logs a page view on every router navigation,
    // which a plain gtag snippet would miss in an SPA.
    ...(environment.analyticsEnabled
      ? [
          provideFirebaseApp(() => initializeApp(environment.firebase)),
          provideAnalytics(() => getAnalytics()),
          ScreenTrackingService,
          // provideAnalytics only registers providers; without this eager
          // injection ScreenTrackingService is never constructed and no
          // events are sent.
          provideEnvironmentInitializer(() => inject(ScreenTrackingService)),
        ]
      : []),
  ],
};
