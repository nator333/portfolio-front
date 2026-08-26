import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { AnalyticsService } from "./analytics.service";
import { environment } from "../../environments/environment";

describe("AnalyticsService", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
  });

  it("does not load gtag or send hits outside production", () => {
    // The test environment (environment.ts) has production: false.
    expect(environment.production).toBe(false);

    const appendSpy = spyOn(document.head, "appendChild").and.callThrough();
    delete (window as unknown as { gtag?: unknown }).gtag;

    TestBed.inject(AnalyticsService).init();

    const injectedGtag = appendSpy.calls
      .allArgs()
      .some(
        ([node]) =>
          node instanceof HTMLScriptElement &&
          node.src.includes("googletagmanager.com/gtag/js"),
      );
    expect(injectedGtag).toBe(false);
    expect((window as unknown as { gtag?: unknown }).gtag).toBeUndefined();
  });
});
