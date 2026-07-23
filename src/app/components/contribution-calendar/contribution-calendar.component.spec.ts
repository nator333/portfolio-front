import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ContributionCalendarComponent } from "./contribution-calendar.component";

/** Minimal MediaQueryList stub whose `matches` we control. */
function stubMatchMedia(matches: boolean): void {
  spyOn(window, "matchMedia").and.returnValue({
    matches,
    media: "",
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  } as MediaQueryList);
}

describe("ContributionCalendarComponent", () => {
  let fixture: ComponentFixture<ContributionCalendarComponent>;

  // Fixed end date keeps the rendered grid deterministic.
  const end = new Date(2026, 6, 23);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContributionCalendarComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ContributionCalendarComponent);
    fixture.componentRef.setInput("end", end);
    // Pin both counts equal so tests below are independent of the runner's
    // viewport (which decides desktop vs mobile). Responsive selection has its
    // own tests further down.
    fixture.componentRef.setInput("weeks", 4);
    fixture.componentRef.setInput("mobileWeeks", 4);
  });

  it("should render one rect per in-range day", () => {
    fixture.componentRef.setInput("contributions", []);
    fixture.detectChanges();
    const rects = fixture.nativeElement.querySelectorAll("rect.day-cell");
    // 4 weeks * 7 days, minus Fri/Sat of the current week (future padding).
    expect(rects.length).toBe(4 * 7 - 2);
  });

  it("should apply the level class matching the day's intensity", () => {
    fixture.componentRef.setInput("contributions", [
      { date: "2026-07-20", count: 3 },
    ]);
    fixture.detectChanges();
    const cell: SVGRectElement | null =
      fixture.nativeElement.querySelector("rect.level-3");
    expect(cell).not.toBeNull();
    // Default noun is "contribution".
    expect(cell?.querySelector("title")?.textContent).toContain(
      "3 contributions on 2026-07-20",
    );
  });

  it("should use the configured noun in the summary and tooltips", () => {
    fixture.componentRef.setInput("weeks", 53);
    fixture.componentRef.setInput("mobileWeeks", 53);
    fixture.componentRef.setInput("noun", "post");
    fixture.componentRef.setInput("contributions", [
      { date: "2026-07-20", count: 1 },
    ]);
    fixture.detectChanges();
    const summary: HTMLElement =
      fixture.nativeElement.querySelector(".calendar-summary");
    expect(summary.textContent).toContain("1 post in the last year");
    const title = fixture.nativeElement.querySelector("rect.level-1 title");
    expect(title?.textContent).toContain("1 post on 2026-07-20");
  });

  it("should pluralize the summary for zero and many", () => {
    fixture.componentRef.setInput("weeks", 53);
    fixture.componentRef.setInput("mobileWeeks", 53);
    fixture.componentRef.setInput("noun", "post");
    fixture.componentRef.setInput("contributions", []);
    fixture.detectChanges();
    const summary: HTMLElement =
      fixture.nativeElement.querySelector(".calendar-summary");
    expect(summary.textContent).toContain("0 posts in the last year");
  });

  it("should render a legend with five swatches", () => {
    fixture.componentRef.setInput("contributions", []);
    fixture.detectChanges();
    const swatches =
      fixture.nativeElement.querySelectorAll(".legend-swatch");
    expect(swatches.length).toBe(5);
  });

  it("should label months along the top axis", () => {
    fixture.componentRef.setInput("weeks", 53);
    fixture.componentRef.setInput("mobileWeeks", 53);
    fixture.componentRef.setInput("contributions", []);
    fixture.detectChanges();
    const labels = fixture.nativeElement.querySelectorAll("text.axis-label");
    // Month labels plus the three weekday labels (Mon/Wed/Fri).
    expect(labels.length).toBeGreaterThan(3);
  });

  describe("responsive week count", () => {
    // These build their own fixture after stubbing matchMedia, so the
    // constructor reads the forced breakpoint state.
    function mobileFixture(matches: boolean, weeks: number, mobileWeeks: number) {
      stubMatchMedia(matches);
      const f = TestBed.createComponent(ContributionCalendarComponent);
      f.componentRef.setInput("end", end);
      f.componentRef.setInput("weeks", weeks);
      f.componentRef.setInput("mobileWeeks", mobileWeeks);
      f.componentRef.setInput("contributions", []);
      f.detectChanges();
      return f;
    }

    it("should render mobileWeeks columns below the breakpoint", () => {
      const f = mobileFixture(true, 53, 10);
      expect(f.componentInstance.model().weeks.length).toBe(10);
      expect(
        f.nativeElement.querySelector(".calendar-summary").textContent,
      ).toContain("in the last 2 months");
    });

    it("should render the full weeks count above the breakpoint", () => {
      const f = mobileFixture(false, 53, 10);
      expect(f.componentInstance.model().weeks.length).toBe(53);
      expect(
        f.nativeElement.querySelector(".calendar-summary").textContent,
      ).toContain("in the last year");
    });
  });
});
