import { computed, Injectable, signal } from "@angular/core";

/**
 * Tracks how many HTTP requests are in flight so the app can show one global
 * loading indicator. The count is driven by the loading interceptor: `start()`
 * on each request, `stop()` when it settles. `loading` is true while any
 * request is outstanding.
 */
@Injectable({ providedIn: "root" })
export class LoadingService {
  private readonly inFlight = signal(0);

  /** True while at least one tracked request is outstanding. */
  readonly loading = computed(() => this.inFlight() > 0);

  start(): void {
    this.inFlight.update((n) => n + 1);
  }

  stop(): void {
    // Never drop below zero, even if stop() were somehow called too often.
    this.inFlight.update((n) => Math.max(0, n - 1));
  }
}
