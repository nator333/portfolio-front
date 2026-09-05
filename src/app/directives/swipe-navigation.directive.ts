import {
  Directive,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";

/** Matches the 768px breakpoint used across the site's stylesheets. */
const MOBILE_BREAKPOINT_PX = 768;

/**
 * The public pages, in the order the navbar lists them. A swipe steps one
 * entry left or right; routes outside this list (blog posts, the editors,
 * login) are left alone.
 */
export const SWIPE_ROUTES: readonly string[] = [
  "/home",
  "/projects",
  "/blog",
  "/workout",
  "/profile",
];

/** Minimum horizontal travel, in px, before a drag counts as a swipe. */
const MIN_DISTANCE_PX = 60;
/** How much longer the horizontal travel must be than the vertical one. */
const DIRECTION_RATIO = 1.5;
/** Slower drags than this read as scrolling or fidgeting, not a swipe. */
const MAX_DURATION_MS = 800;
/**
 * Screen-edge strip left to the OS. iOS uses it for its own back/forward
 * gesture, so a swipe starting there would otherwise fire twice.
 */
const EDGE_GUARD_PX = 24;

/**
 * Controls that consume horizontal drags themselves (caret placement, native
 * pickers), plus an opt-out hook any template can set.
 */
const INTERACTIVE_SELECTOR =
  "input, textarea, select, [contenteditable]:not([contenteditable='false']), [data-no-swipe]";

/**
 * Switches between the main pages on a horizontal swipe, phones only.
 *
 * Desktop pointers never emit touch events, and the breakpoint check keeps a
 * narrow desktop window out of it too, so this is additive: the navbar stays
 * the only way in on wide viewports. Swiping left pulls the next page in from
 * the right; the sequence does not wrap, so the ends stay put.
 */
@Directive({
  selector: "[appSwipeNavigation]",
  standalone: true,
})
export class SwipeNavigationDirective {
  private readonly router = inject(Router);
  private readonly host: HTMLElement = inject(ElementRef<HTMLElement>)
    .nativeElement;

  private readonly isMobile = signal(false);

  /** Where the current gesture began, or null when there is nothing to track. */
  private start: { x: number; y: number; time: number } | null = null;

  constructor() {
    // Track the breakpoint with matchMedia (no CDK dependency). Guarded for
    // non-browser environments; listener torn down with the directive.
    if (typeof window !== "undefined" && window.matchMedia) {
      const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
      this.isMobile.set(query.matches);
      const onChange = (event: MediaQueryListEvent) =>
        this.isMobile.set(event.matches);
      query.addEventListener("change", onChange);
      inject(DestroyRef).onDestroy(() =>
        query.removeEventListener("change", onChange),
      );
    }
  }

  @HostListener("touchstart", ["$event"])
  onTouchStart(event: TouchEvent): void {
    this.start = null;
    if (!this.isMobile() || event.touches.length !== 1) {
      return;
    }
    const touch = event.touches[0];
    if (this.isEdgeStart(touch.clientX) || this.ownsGesture(event.target)) {
      return;
    }
    this.start = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }

  @HostListener("touchend", ["$event"])
  onTouchEnd(event: TouchEvent): void {
    const start = this.start;
    this.start = null;
    if (!start || event.changedTouches.length !== 1) {
      return;
    }
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - start.x;
    const deltaY = touch.clientY - start.y;
    if (Date.now() - start.time > MAX_DURATION_MS) {
      return;
    }
    if (Math.abs(deltaX) < MIN_DISTANCE_PX) {
      return;
    }
    // A drag that travels nearly as far down as across is a scroll.
    if (Math.abs(deltaX) < Math.abs(deltaY) * DIRECTION_RATIO) {
      return;
    }
    this.step(deltaX < 0 ? 1 : -1);
  }

  @HostListener("touchcancel")
  onTouchCancel(): void {
    this.start = null;
  }

  /** Move `direction` places along {@link SWIPE_ROUTES}, clamped at both ends. */
  private step(direction: 1 | -1): void {
    // Drop any query string or fragment before matching.
    const path = this.router.url.split(/[?#]/)[0];
    const index = SWIPE_ROUTES.indexOf(path);
    if (index === -1) {
      return;
    }
    const target = index + direction;
    if (target < 0 || target >= SWIPE_ROUTES.length) {
      return;
    }
    void this.router.navigateByUrl(SWIPE_ROUTES[target]);
  }

  /** True for touches that begin in the strip the OS reserves for itself. */
  private isEdgeStart(clientX: number): boolean {
    return (
      clientX <= EDGE_GUARD_PX || clientX >= window.innerWidth - EDGE_GUARD_PX
    );
  }

  /**
   * True when something between the touched node and the host already means
   * something by a horizontal drag — a text field, an opted-out subtree, or a
   * sideways scroller such as a wide code block or the contribution calendar.
   */
  private ownsGesture(target: EventTarget | null): boolean {
    let node = target instanceof Element ? target : null;
    if (node?.closest(INTERACTIVE_SELECTOR)) {
      return true;
    }
    while (node && node !== this.host) {
      if (this.scrollsHorizontally(node)) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  private scrollsHorizontally(element: Element): boolean {
    // A 1px slack absorbs sub-pixel layout rounding.
    if (element.scrollWidth <= element.clientWidth + 1) {
      return false;
    }
    const overflowX = getComputedStyle(element).overflowX;
    return overflowX === "auto" || overflowX === "scroll";
  }
}
