import { Component } from "@angular/core";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { SwipeNavigationDirective } from "./swipe-navigation.directive";

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

@Component({
  standalone: true,
  imports: [SwipeNavigationDirective],
  template: `
    <main appSwipeNavigation>
      <p class="body">page body</p>
      <div class="scroller"><span class="wide">wide</span></div>
      <input class="field" />
      <div data-no-swipe><span class="opted-out">chart</span></div>
    </main>
  `,
  styles: [
    `
      .scroller {
        width: 50px;
        overflow-x: auto;
      }
      .wide {
        display: inline-block;
        width: 500px;
      }
    `,
  ],
})
class HostComponent {}

describe("SwipeNavigationDirective", () => {
  let fixture: ComponentFixture<HostComponent>;
  let router: Router;
  let navigate: jasmine.Spy;

  /** Build the fixture after `matchMedia` is stubbed for this test. */
  function createFixture(currentUrl = "/blog"): void {
    fixture = TestBed.createComponent(HostComponent);
    router = TestBed.inject(Router);
    spyOnProperty(router, "url", "get").and.returnValue(currentUrl);
    navigate = spyOn(router, "navigateByUrl");
    fixture.detectChanges();
  }

  function touch(target: Element, clientX: number, clientY: number): Touch {
    return new Touch({ identifier: 0, target, clientX, clientY });
  }

  /**
   * Drag `dx` px across and `dy` down, starting from `fromX` (mid-screen by
   * default, so gestures stay clear of the reserved screen edges).
   */
  function swipe(options: {
    selector?: string;
    dx?: number;
    dy?: number;
    fromX?: number;
    extraTouches?: boolean;
  }): void {
    const {
      selector = ".body",
      dx = -160,
      dy = 0,
      fromX = Math.round(window.innerWidth / 2),
      extraTouches = false,
    } = options;
    const fromY = 200;
    const target: Element = fixture.nativeElement.querySelector(selector);
    const startTouches = [touch(target, fromX, fromY)];
    if (extraTouches) {
      startTouches.push(touch(target, fromX + 40, fromY));
    }
    target.dispatchEvent(
      new TouchEvent("touchstart", {
        bubbles: true,
        touches: startTouches,
        changedTouches: startTouches,
      }),
    );
    const endTouches = [touch(target, fromX + dx, fromY + dy)];
    target.dispatchEvent(
      new TouchEvent("touchend", {
        bubbles: true,
        touches: [],
        changedTouches: endTouches,
      }),
    );
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  describe("on a mobile viewport", () => {
    beforeEach(() => stubMatchMedia(true));

    it("should advance to the next page on a left swipe", () => {
      createFixture("/blog");
      swipe({ dx: -160 });
      expect(navigate).toHaveBeenCalledWith("/workout");
    });

    it("should go back to the previous page on a right swipe", () => {
      createFixture("/blog");
      swipe({ dx: 160 });
      expect(navigate).toHaveBeenCalledWith("/projects");
    });

    it("should ignore query strings and fragments when locating the page", () => {
      createFixture("/projects?tag=angular#top");
      swipe({ dx: -160 });
      expect(navigate).toHaveBeenCalledWith("/blog");
    });

    it("should stay put at the start of the sequence", () => {
      createFixture("/home");
      swipe({ dx: 160 });
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should stay put at the end of the sequence", () => {
      createFixture("/profile");
      swipe({ dx: -160 });
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should do nothing on a route outside the sequence", () => {
      createFixture("/blog/some-post");
      swipe({ dx: -160 });
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should ignore a drag that travels mostly vertically", () => {
      createFixture();
      swipe({ dx: -100, dy: 200 });
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should ignore a drag shorter than the distance threshold", () => {
      createFixture();
      swipe({ dx: -40 });
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should ignore a swipe starting at the screen edge", () => {
      createFixture();
      swipe({ fromX: 5, dx: 195 });
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should ignore a multi-touch gesture", () => {
      createFixture();
      swipe({ extraTouches: true });
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should leave horizontally scrollable content alone", () => {
      createFixture();
      swipe({ selector: ".wide" });
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should leave text fields alone", () => {
      createFixture();
      swipe({ selector: ".field" });
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should honour a data-no-swipe opt-out", () => {
      createFixture();
      swipe({ selector: ".opted-out" });
      expect(navigate).not.toHaveBeenCalled();
    });

    it("should drop the gesture when the touch is cancelled", () => {
      createFixture();
      const target: Element = fixture.nativeElement.querySelector(".body");
      const midX = Math.round(window.innerWidth / 2);
      const start = [touch(target, midX, 200)];
      target.dispatchEvent(
        new TouchEvent("touchstart", {
          bubbles: true,
          touches: start,
          changedTouches: start,
        }),
      );
      target.dispatchEvent(new TouchEvent("touchcancel", { bubbles: true }));
      const end = [touch(target, midX - 160, 200)];
      target.dispatchEvent(
        new TouchEvent("touchend", {
          bubbles: true,
          touches: [],
          changedTouches: end,
        }),
      );
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe("above the mobile breakpoint", () => {
    beforeEach(() => stubMatchMedia(false));

    it("should not navigate", () => {
      createFixture("/blog");
      swipe({ dx: -160 });
      expect(navigate).not.toHaveBeenCalled();
    });
  });
});
