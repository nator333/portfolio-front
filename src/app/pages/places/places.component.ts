import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from "@angular/core";
import { rxResource, toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";

import { HeroComponent } from "../../components/hero/hero.component";
import { PlacesMapComponent } from "../../components/places-map/places-map.component";
import { AuthService } from "../../services/auth.service";
import { PlacesService } from "../../services/places.service";
import {
  CityInfo,
  KIND_LABELS,
  Memory,
  PLACE_CITY_IDS,
  PlaceCityId,
  SEASON_LABELS,
  Season,
  inSeason,
  mapsUrlFor,
  seasonOf,
} from "../../models/places-data";
import { CITIES, cityById } from "./cities";
import { pinSprite } from "./pixel-map";

const CITY_STORAGE_KEY = "places.city";

/** One row of the "at a glance" card: a figure, or a list of chips. */
interface FactRow {
  label: string;
  value?: string;
  chips?: string[];
}

/**
 * The Places page: five pixel-art maps of the towns the owner has lived in,
 * with memories pinned on them. Tap a pin to read the memory beside the map;
 * the seasons change the map's look and which memories show.
 */
@Component({
  selector: "app-places",
  standalone: true,
  imports: [HeroComponent, PlacesMapComponent, RouterLink],
  templateUrl: "./places.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./places.component.scss",
})
export class PlacesComponent {
  private readonly placesService = inject(PlacesService);
  private readonly authService = inject(AuthService);

  readonly cities = CITIES;
  readonly kindLabels = KIND_LABELS;
  readonly seasonLabels = SEASON_LABELS;

  readonly isAuthenticated = toSignal(this.authService.isAuthenticated$, {
    initialValue: false,
  });

  private readonly placesResource = rxResource({
    stream: () => this.placesService.getPlaces(),
  });

  readonly loading = computed(() => this.placesResource.isLoading());
  readonly failed = computed(() => !!this.placesResource.error());

  private readonly memories = computed<Memory[]>(() =>
    this.placesResource.hasValue()
      ? (this.placesResource.value().memories ?? [])
      : [],
  );
  private readonly cityInfos = computed(() =>
    this.placesResource.hasValue()
      ? (this.placesResource.value().cities ?? {})
      : {},
  );

  readonly cityId = signal<PlaceCityId>(readStoredCity());
  readonly city = computed(() => cityById(this.cityId()) ?? CITIES[0]);
  readonly season = signal<Season>(seasonOf());
  readonly selectedId = signal<string | null>(null);

  readonly info = computed<CityInfo>(
    () => this.cityInfos()[this.cityId()] ?? {},
  );

  /** Memories in this town, oldest first. */
  private readonly townMemories = computed(() =>
    this.memories()
      .filter((m) => m.city === this.cityId())
      .sort((a, b) => a.createdAt - b.createdAt),
  );
  /** The ones that show in the chosen season. */
  readonly visibleMemories = computed(() =>
    this.townMemories().filter((m) => inSeason(m, this.season())),
  );
  readonly hiddenCount = computed(
    () => this.townMemories().length - this.visibleMemories().length,
  );

  readonly selected = computed<Memory | null>(() => {
    const id = this.selectedId();
    return id
      ? (this.visibleMemories().find((m) => m.id === id) ?? null)
      : null;
  });
  readonly selectedMapsUrl = computed(() => {
    const m = this.selected();
    return m ? mapsUrlFor(m) : "";
  });
  readonly selectedSeasons = computed(() =>
    (this.selected()?.seasons ?? [])
      .map((s) => SEASON_LABELS[s].label)
      .join(", "),
  );

  readonly facts = computed<FactRow[]>(() => {
    const info = this.info();
    const rows: FactRow[] = [];
    if (info.population) {
      rows.push({ label: "Population", value: info.population });
    }
    if (info.metro) {
      rows.push({ label: "Metro area", value: info.metro });
    }
    if (info.area) {
      rows.push({ label: "Area", value: info.area });
    }
    if (info.knownFor?.length) {
      rows.push({ label: "Known for", chips: info.knownFor });
    }
    if (info.food?.length) {
      rows.push({ label: "Local food", chips: info.food });
    }
    return rows;
  });

  /** Photo carousel state. */
  readonly photoIndex = signal(0);
  private readonly galleryTrack =
    viewChild<ElementRef<HTMLDivElement>>("galleryTrack");
  private readonly gallery = viewChild<ElementRef<HTMLElement>>("gallery");
  private readonly panel = viewChild<ElementRef<HTMLElement>>("panel");

  constructor() {
    // A memory that leaves the season leaves the panel too.
    effect(() => {
      const id = this.selectedId();
      if (id && !this.visibleMemories().some((m) => m.id === id)) {
        this.selectedId.set(null);
      }
    });
    effect(() => {
      this.selected();
      this.photoIndex.set(0);
    });
  }

  sprite = pinSprite;

  selectCity(id: PlaceCityId): void {
    if (!PLACE_CITY_IDS.includes(id)) {
      return;
    }
    this.cityId.set(id);
    this.selectedId.set(null);
    try {
      localStorage.setItem(CITY_STORAGE_KEY, id);
    } catch {
      // Remembering the tab is a convenience only.
    }
  }

  onPinTap(id: string): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
    if (matchMedia("(max-width: 880px)").matches) {
      this.panel()?.nativeElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }

  open(id: string): void {
    this.selectedId.set(id);
  }

  back(): void {
    this.selectedId.set(null);
  }

  scrollToGallery(): void {
    this.gallery()?.nativeElement.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  stepPhoto(direction: -1 | 1): void {
    const track = this.galleryTrack()?.nativeElement;
    if (track) {
      track.scrollBy({
        left: direction * track.clientWidth,
        behavior: "smooth",
      });
    }
  }

  goToPhoto(index: number): void {
    const track = this.galleryTrack()?.nativeElement;
    if (track) {
      track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    }
  }

  onGalleryScroll(): void {
    const track = this.galleryTrack()?.nativeElement;
    if (track && track.clientWidth) {
      this.photoIndex.set(Math.round(track.scrollLeft / track.clientWidth));
    }
  }
}

function readStoredCity(): PlaceCityId {
  try {
    const stored = localStorage.getItem(CITY_STORAGE_KEY);
    if (stored && (PLACE_CITY_IDS as readonly string[]).includes(stored)) {
      return stored as PlaceCityId;
    }
  } catch {
    // Fall through to the first town.
  }
  return PLACE_CITY_IDS[0];
}
