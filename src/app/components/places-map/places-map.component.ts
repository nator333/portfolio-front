import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from "@angular/core";

import {
  KIND_LABELS,
  MEMORY_KINDS,
  Memory,
  MemoryKind,
  SEASONS,
  SEASON_LABELS,
  Season,
  seasonOf,
} from "../../models/places-data";
import {
  CityDef,
  LANDMARK_SPRITES,
  MAP_H,
  MAP_W,
  TILE_PX,
  allPinSprites,
  mapFrames,
  pinPosition,
} from "../../pages/places/pixel-map";

/** A pin being placed or moved in the editor; drawn blinking. */
export interface DraftPin {
  id: string | null;
  x: number;
  y: number;
  lat: number | null;
  lng: number | null;
  kind: MemoryKind;
  name: string;
}

interface PinView {
  id: string;
  left: string;
  top: string;
  sprite: string;
  label: string;
  selected: boolean;
  draft: boolean;
}

interface LabelView {
  text: string;
  left: string;
  top: string;
  cls: string;
}

/** Seasons advance every 4 s while the map auto-cycles. */
const AUTO_CYCLE_MS = 4000;
/** Water ripples alternate between the two painted frames at this rate. */
const RIPPLE_MS = 750;

/**
 * One town's pixel map: the painted canvas, place-name labels, memory pins,
 * the season toggle and the kind legend. Shared by the public Places page
 * and the editor; the editor sets `editing` to get crosshair taps and a
 * blinking draft pin.
 *
 * Until the viewer taps the map or a season, the seasons can auto-advance
 * (`autoCycle`) as bait, only while the map is on screen; one tap stops it
 * for the rest of the visit.
 */
@Component({
  selector: "app-places-map",
  standalone: true,
  templateUrl: "./places-map.component.html",
  styleUrl: "./places-map.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlacesMapComponent {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  readonly city = input.required<CityDef>();
  /** Two-way: the component advances it on auto-cycle and season taps. */
  readonly season = model<Season>(seasonOf());
  /** Memories to pin: already filtered to this town and season by the parent. */
  readonly memories = input<Memory[]>([]);
  readonly selectedId = input<string | null>(null);
  readonly draft = input<DraftPin | null>(null);
  readonly editing = input(false);
  readonly autoCycle = input(false);
  readonly showLegend = input(true);

  readonly mapTap = output<{ x: number; y: number }>();
  readonly pinTap = output<string>();

  private readonly canvas =
    viewChild.required<ElementRef<HTMLCanvasElement>>("canvas");
  private readonly mapBox =
    viewChild.required<ElementRef<HTMLDivElement>>("mapBox");

  readonly mapWidth = MAP_W * TILE_PX;
  readonly mapHeight = MAP_H * TILE_PX;
  readonly seasons = SEASONS;
  readonly seasonLabels = SEASON_LABELS;
  readonly today = seasonOf();
  readonly kinds = MEMORY_KINDS;
  readonly kindLabels = KIND_LABELS;

  private readonly sprites = signal<Record<MemoryKind, string> | null>(null);
  private readonly reduceMotion =
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** True while the bait cycle is still allowed (no tap yet). */
  private readonly cycling = signal(false);
  readonly isCycling = computed(() => this.cycling() && this.autoCycle());
  private cycleTimer: ReturnType<typeof setInterval> | null = null;
  private rippleTimer: ReturnType<typeof setInterval> | null = null;
  private frame: 0 | 1 = 0;
  private mapVisible = false;
  private stopped = false;

  readonly labels = computed<LabelView[]>(() => {
    const city = this.city();
    const fromLandmarks: LabelView[] = city.landmarks.map((l) => {
      const sprite = LANDMARK_SPRITES[l.kind];
      const cx = l.x + sprite.w / TILE_PX / 2;
      const cy = l.labelAbove ? l.y - 0.7 : l.y + sprite.h / TILE_PX + 0.6;
      return {
        text: l.label,
        left: pct(cx / MAP_W),
        top: pct(cy / MAP_H),
        cls: "lm",
      };
    });
    const fromCity: LabelView[] = city.labels.map(([text, x, y, cls]) => ({
      text,
      left: pct(x / MAP_W),
      top: pct(y / MAP_H),
      cls: cls ?? "",
    }));
    return [...fromCity, ...fromLandmarks];
  });

  readonly pins = computed<PinView[]>(() => {
    const sprites = this.sprites();
    if (!sprites) {
      return [];
    }
    const city = this.city();
    const draft = this.draft();
    const selected = this.selectedId();
    const views: PinView[] = [];
    for (const m of this.memories()) {
      const isDraft = draft?.id === m.id;
      const src = isDraft && draft ? draft : m;
      const pos = pinPosition(city, src);
      views.push({
        id: m.id,
        left: pct(pos.x),
        top: pct(pos.y),
        sprite: sprites[src.kind] ?? sprites.other,
        label: `${src.name || "Unnamed place"} (${KIND_LABELS[src.kind]})`,
        selected: !isDraft && selected === m.id,
        draft: isDraft,
      });
    }
    if (draft && !draft.id) {
      const pos = pinPosition(city, draft);
      views.push({
        id: "",
        left: pct(pos.x),
        top: pct(pos.y),
        sprite: sprites[draft.kind] ?? sprites.other,
        label: `${draft.name || "New memory"} (${KIND_LABELS[draft.kind]})`,
        selected: false,
        draft: true,
      });
    }
    return views;
  });

  readonly legendCounts = computed<Record<MemoryKind, number>>(() => {
    const counts = Object.fromEntries(
      MEMORY_KINDS.map((k) => [k, 0]),
    ) as Record<MemoryKind, number>;
    for (const m of this.memories()) {
      counts[m.kind] = (counts[m.kind] ?? 0) + 1;
    }
    return counts;
  });

  constructor() {
    afterNextRender(() => {
      this.sprites.set(allPinSprites());
      this.startRipples();
      this.watchVisibility();
    });
    // Repaint whenever the town or season changes (frames are cached).
    effect(() => {
      const city = this.city();
      const season = this.season();
      const cv = this.canvas().nativeElement;
      const ctx = cv.getContext("2d");
      if (ctx) {
        ctx.drawImage(mapFrames(city, season)[this.frame], 0, 0);
      }
    });
    effect(() => {
      // (Re)arm the bait cycle when the parent turns it on.
      if (this.autoCycle() && !this.stopped && !this.reduceMotion) {
        this.cycling.set(true);
        this.startCycle();
      } else {
        this.cycling.set(false);
        this.pauseCycle();
      }
    });
    this.destroyRef.onDestroy(() => {
      this.pauseCycle();
      if (this.rippleTimer) {
        clearInterval(this.rippleTimer);
      }
      document.removeEventListener("visibilitychange", this.onVisibility);
    });
  }

  sprite(kind: MemoryKind): string {
    return this.sprites()?.[kind] ?? "";
  }

  onMapClick(event: MouseEvent): void {
    this.stopCycle();
    const target = event.target as HTMLElement;
    const pin = target.closest<HTMLElement>("[data-pin]");
    if (pin) {
      if (pin.dataset["pin"]) {
        this.pinTap.emit(pin.dataset["pin"]);
      }
      return;
    }
    if (!this.editing()) {
      return;
    }
    const rect = this.mapBox().nativeElement.getBoundingClientRect();
    const x = Math.min(
      0.98,
      Math.max(0.02, (event.clientX - rect.left) / rect.width),
    );
    const y = Math.min(
      0.98,
      Math.max(0.04, (event.clientY - rect.top) / rect.height),
    );
    this.mapTap.emit({ x, y });
  }

  pickSeason(season: Season): void {
    this.stopCycle();
    this.season.set(season);
  }

  /** The viewer interacted: the bait cycle is over for this visit. */
  private stopCycle(): void {
    this.stopped = true;
    this.cycling.set(false);
    this.pauseCycle();
  }

  private startCycle(): void {
    if (
      this.cycleTimer ||
      !this.cycling() ||
      !this.mapVisible ||
      document.visibilityState === "hidden"
    ) {
      return;
    }
    this.cycleTimer = setInterval(() => {
      const next =
        SEASONS[(SEASONS.indexOf(this.season()) + 1) % SEASONS.length];
      this.season.set(next);
    }, AUTO_CYCLE_MS);
  }

  private pauseCycle(): void {
    if (this.cycleTimer) {
      clearInterval(this.cycleTimer);
      this.cycleTimer = null;
    }
  }

  private startRipples(): void {
    if (this.reduceMotion || this.rippleTimer) {
      return;
    }
    this.rippleTimer = setInterval(() => {
      this.frame = this.frame ? 0 : 1;
      const ctx = this.canvas().nativeElement.getContext("2d");
      if (ctx) {
        ctx.drawImage(mapFrames(this.city(), this.season())[this.frame], 0, 0);
      }
    }, RIPPLE_MS);
  }

  private readonly onVisibility = (): void => {
    if (document.visibilityState === "hidden") {
      this.pauseCycle();
    } else {
      this.startCycle();
    }
  };

  /** Cycle only while at least half the map is on screen. */
  private watchVisibility(): void {
    if (typeof IntersectionObserver === "undefined") {
      this.mapVisible = true;
      this.startCycle();
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        this.mapVisible = entry.isIntersecting;
        if (entry.isIntersecting) {
          this.startCycle();
        } else {
          this.pauseCycle();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(this.host.nativeElement);
    this.destroyRef.onDestroy(() => observer.disconnect());
    document.addEventListener("visibilitychange", this.onVisibility);
  }
}

function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`;
}
