import { NgModule, provideZonelessChangeDetection } from "@angular/core";
import { getTestBed } from "@angular/core/testing";
import {
  BrowserTestingModule,
  platformBrowserTesting,
} from "@angular/platform-browser/testing";

// Global test bootstrap. Every spec's TestBed runs under zoneless change
// detection, matching the app (see provideZonelessChangeDetection in
// app.config). No zone.js is loaded for tests, so specs drive change detection
// with detectChanges() / whenStable() and signals — never fakeAsync/tick.
@NgModule({
  providers: [provideZonelessChangeDetection()],
})
class ZonelessTestModule {}

getTestBed().initTestEnvironment(
  [BrowserTestingModule, ZonelessTestModule],
  platformBrowserTesting(),
);
