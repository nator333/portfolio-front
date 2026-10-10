import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from "@angular/core";
import { Router } from "@angular/router";
import {
  FormBuilder,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";

import { HeroComponent } from "../../components/hero/hero.component";
import { ImageUploadComponent } from "../../components/image-upload/image-upload.component";
import {
  DraftPin,
  PlacesMapComponent,
} from "../../components/places-map/places-map.component";
import { AuthService } from "../../services/auth.service";
import { PlacesService } from "../../services/places.service";
import { MediaAsset, MediaService } from "../../services/media.service";
import {
  CityInfo,
  KIND_LABELS,
  MAX_CITY_CHIPS,
  MAX_CITY_FACT_LENGTH,
  MAX_CITY_SUMMARY_LENGTH,
  MAX_MEMORY_NAME_LENGTH,
  MAX_MEMORY_PERIOD_LENGTH,
  MAX_MEMORY_PHOTOS,
  MAX_MEMORY_TEXT_LENGTH,
  MEMORY_KINDS,
  Memory,
  MemoryKind,
  PlaceCityId,
  PlacesData,
  SEASONS,
  SEASON_LABELS,
  Season,
  inSeason,
  parseMapsLink,
  seasonOf,
} from "../../models/places-data";
import { CITIES, cityById } from "../places/cities";
import { MAP_H, MAP_W, cityForGeo, pinSprite } from "../places/pixel-map";

/**
 * Admin editor for the Places page. Tap the map to place a memory, or paste a
 * Google Maps link to put it at the right spot; each save writes the whole
 * places document back through the API, like the other content editors.
 */
@Component({
  selector: "app-places-edit",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HeroComponent,
    ImageUploadComponent,
    PlacesMapComponent,
  ],
  templateUrl: "./places-edit.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: "./places-edit.component.scss",
})
export class PlacesEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly placesService = inject(PlacesService);
  private readonly mediaService = inject(MediaService);
  private readonly router = inject(Router);

  readonly cities = CITIES;
  readonly kinds = MEMORY_KINDS;
  readonly kindLabels = KIND_LABELS;
  readonly seasons = SEASONS;
  readonly seasonLabels = SEASON_LABELS;
  readonly maxNameLength = MAX_MEMORY_NAME_LENGTH;
  readonly maxPeriodLength = MAX_MEMORY_PERIOD_LENGTH;
  readonly maxTextLength = MAX_MEMORY_TEXT_LENGTH;
  readonly maxPhotos = MAX_MEMORY_PHOTOS;
  readonly maxSummaryLength = MAX_CITY_SUMMARY_LENGTH;
  readonly maxFactLength = MAX_CITY_FACT_LENGTH;
  readonly maxChips = MAX_CITY_CHIPS;

  readonly mediaAssets = signal<MediaAsset[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal("");
  readonly successMessage = signal("");

  /** The whole document, edited in place and PUT back on every save. */
  readonly memories = signal<Memory[]>([]);
  readonly cityInfos = signal<Partial<Record<PlaceCityId, CityInfo>>>({});

  readonly cityId = signal<PlaceCityId>(CITIES[0].id);
  readonly city = computed(() => cityById(this.cityId()) ?? CITIES[0]);
  readonly season = signal<Season>(seasonOf());

  readonly townMemories = computed(() =>
    this.memories()
      .filter((m) => m.city === this.cityId())
      .sort((a, b) => a.createdAt - b.createdAt),
  );
  /** Pins on the map: the season's memories, plus the one being edited. */
  readonly mapMemories = computed(() => {
    const draft = this.draft();
    return this.townMemories().filter(
      (m) => inSeason(m, this.season()) || m.id === draft?.id,
    );
  });

  /** The pin being placed or edited; null when no form is open. */
  readonly draft = signal<DraftPin | null>(null);
  readonly editingId = computed(() => this.draft()?.id ?? null);
  readonly mapsNote = signal<{ text: string; error: boolean } | null>(null);
  readonly confirmingDelete = signal(false);

  readonly memoryForm = this.fb.nonNullable.group({
    name: [
      "",
      [Validators.required, Validators.maxLength(MAX_MEMORY_NAME_LENGTH)],
    ],
    kind: ["play" as MemoryKind],
    mapsUrl: [""],
    period: ["", Validators.maxLength(MAX_MEMORY_PERIOD_LENGTH)],
    text: ["", Validators.maxLength(MAX_MEMORY_TEXT_LENGTH)],
    seasons: this.fb.nonNullable.group(
      Object.fromEntries(SEASONS.map((s) => [s, false])) as Record<
        Season,
        boolean
      >,
    ),
    photos: this.fb.array(
      Array.from({ length: MAX_MEMORY_PHOTOS }, () =>
        this.fb.nonNullable.control(""),
      ),
    ),
  });

  readonly cityForm = this.fb.nonNullable.group({
    period: ["", Validators.maxLength(MAX_CITY_FACT_LENGTH)],
    note: ["", Validators.maxLength(MAX_CITY_FACT_LENGTH * 3)],
    summary: ["", Validators.maxLength(MAX_CITY_SUMMARY_LENGTH)],
    population: ["", Validators.maxLength(MAX_CITY_FACT_LENGTH)],
    metro: ["", Validators.maxLength(MAX_CITY_FACT_LENGTH)],
    area: ["", Validators.maxLength(MAX_CITY_FACT_LENGTH)],
    // Comma-separated in the form, arrays in the document.
    knownFor: [""],
    food: [""],
    source: [""],
    fetchedAt: ["", Validators.pattern(/^(\d{4}-\d{2}-\d{2})?$/)],
  });

  get photoControls(): FormControl<string>[] {
    return this.memoryForm.controls.photos.controls;
  }

  sprite = pinSprite;

  ngOnInit(): void {
    this.placesService.getPlaces().subscribe({
      next: (data) => {
        this.memories.set(data.memories ?? []);
        this.cityInfos.set(data.cities ?? {});
        this.fillCityForm();
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set("Could not load the places document.");
        this.loading.set(false);
      },
    });
    this.mediaService.list().subscribe({
      next: (assets) => this.mediaAssets.set(assets),
      error: () => {
        // The dropdown is a convenience; uploading and pasting a URL still work.
      },
    });
    this.memoryForm.controls.kind.valueChanges.subscribe((kind) => {
      const draft = this.draft();
      if (draft) {
        this.draft.set({ ...draft, kind });
      }
    });
    this.memoryForm.controls.name.valueChanges.subscribe((name) => {
      const draft = this.draft();
      if (draft) {
        this.draft.set({ ...draft, name });
      }
    });
    this.memoryForm.controls.mapsUrl.valueChanges.subscribe((url) =>
      this.applyMapsLink(url),
    );
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl("/home");
  }

  selectCity(id: PlaceCityId): void {
    if (id === this.cityId()) {
      return;
    }
    this.cityId.set(id);
    this.cancelMemory();
    this.fillCityForm();
  }

  /** A tap on the map: start a new memory there, or move the open one. */
  onMapTap(pos: { x: number; y: number }): void {
    const draft = this.draft();
    if (draft) {
      this.draft.set({ ...draft, x: pos.x, y: pos.y, lat: null, lng: null });
      this.mapsNote.set({
        text: "Pin placed by hand; the link is kept but its coordinates are no longer used.",
        error: false,
      });
      return;
    }
    this.openNew(pos.x, pos.y);
  }

  onPinTap(id: string): void {
    const memory = this.memories().find((m) => m.id === id);
    if (memory) {
      this.openExisting(memory);
    }
  }

  openExisting(memory: Memory): void {
    this.draft.set({
      id: memory.id,
      x: memory.x,
      y: memory.y,
      lat: memory.lat,
      lng: memory.lng,
      kind: memory.kind,
      name: memory.name,
    });
    this.memoryForm.reset({
      name: memory.name,
      kind: memory.kind,
      mapsUrl: memory.mapsUrl,
      period: memory.period,
      text: memory.text,
      seasons: Object.fromEntries(
        SEASONS.map((s) => [s, memory.seasons.includes(s)]),
      ) as Record<Season, boolean>,
      photos: Array.from(
        { length: MAX_MEMORY_PHOTOS },
        (_, i) => memory.photos[i] ?? "",
      ),
    });
    this.mapsNote.set(
      memory.lat != null && memory.lng != null
        ? {
            text: `Pinned at ${memory.lat.toFixed(5)}, ${memory.lng.toFixed(5)}. Tapping the map moves the pin and drops the coordinates.`,
            error: false,
          }
        : null,
    );
    this.confirmingDelete.set(false);
    this.clearMessages();
  }

  private openNew(x: number, y: number): void {
    this.draft.set({
      id: null,
      x,
      y,
      lat: null,
      lng: null,
      kind: "play",
      name: "",
    });
    this.memoryForm.reset({
      name: "",
      kind: "play",
      mapsUrl: "",
      period: "",
      text: "",
      seasons: Object.fromEntries(SEASONS.map((s) => [s, false])) as Record<
        Season,
        boolean
      >,
      photos: Array.from({ length: MAX_MEMORY_PHOTOS }, () => ""),
    });
    this.mapsNote.set(null);
    this.confirmingDelete.set(false);
    this.clearMessages();
  }

  cancelMemory(): void {
    this.draft.set(null);
    this.mapsNote.set(null);
    this.confirmingDelete.set(false);
  }

  /** Read coordinates out of a pasted Google Maps link and move the pin. */
  private applyMapsLink(url: string): void {
    const draft = this.draft();
    if (!draft) {
      return;
    }
    const parsed = parseMapsLink(url);
    if (!parsed) {
      this.mapsNote.set(
        url.trim()
          ? { text: "No coordinates found in this link.", error: true }
          : null,
      );
      return;
    }
    if (parsed === "short") {
      this.mapsNote.set({
        text: "Short links (maps.app.goo.gl) carry no coordinates. Open it in a browser, then paste the full URL from the address bar.",
        error: true,
      });
      return;
    }
    const match = cityForGeo(CITIES, parsed.lat, parsed.lng);
    if (!match || !match.inside) {
      this.mapsNote.set({
        text: `Those coordinates fall outside all five maps${match ? ` (nearest: ${match.city.name})` : ""}.`,
        error: true,
      });
      return;
    }
    if (match.city.id !== this.cityId()) {
      this.cityId.set(match.city.id);
      this.fillCityForm();
    }
    this.draft.set({
      ...draft,
      lat: parsed.lat,
      lng: parsed.lng,
      x: clamp(match.tile.x / MAP_W, 0.02, 0.98),
      y: clamp(match.tile.y / MAP_H, 0.04, 0.98),
    });
    if (parsed.name && !this.memoryForm.controls.name.value.trim()) {
      this.memoryForm.controls.name.setValue(parsed.name);
    }
    this.mapsNote.set({
      text: `Pinned at ${parsed.lat.toFixed(5)}, ${parsed.lng.toFixed(5)} on the ${match.city.name} map. Tapping the map moves the pin and drops the coordinates.`,
      error: false,
    });
  }

  saveMemory(): void {
    const draft = this.draft();
    if (!draft || this.memoryForm.invalid) {
      this.memoryForm.markAllAsTouched();
      return;
    }
    const value = this.memoryForm.getRawValue();
    const existing = draft.id
      ? this.memories().find((m) => m.id === draft.id)
      : undefined;
    const memory: Memory = {
      id: draft.id ?? newMemoryId(),
      city: this.cityId(),
      x: round4(draft.x),
      y: round4(draft.y),
      name: value.name.trim(),
      kind: value.kind,
      period: value.period.trim(),
      text: value.text.trim(),
      seasons: SEASONS.filter((s) => value.seasons[s]),
      photos: value.photos.map((p) => p.trim()).filter(Boolean),
      mapsUrl: value.mapsUrl.trim(),
      lat: draft.lat,
      lng: draft.lng,
      createdAt: existing?.createdAt ?? Date.now(),
    };
    const next = existing
      ? this.memories().map((m) => (m.id === memory.id ? memory : m))
      : [...this.memories(), memory];
    this.persist({ memories: next, cities: this.cityInfos() }, () => {
      this.memories.set(next);
      this.cancelMemory();
      this.successMessage.set(`Saved “${memory.name}”.`);
    });
  }

  deleteMemory(): void {
    const draft = this.draft();
    if (!draft?.id) {
      return;
    }
    if (!this.confirmingDelete()) {
      this.confirmingDelete.set(true);
      return;
    }
    const next = this.memories().filter((m) => m.id !== draft.id);
    this.persist({ memories: next, cities: this.cityInfos() }, () => {
      this.memories.set(next);
      this.cancelMemory();
      this.successMessage.set("Memory deleted.");
    });
  }

  saveCity(): void {
    if (this.cityForm.invalid) {
      this.cityForm.markAllAsTouched();
      return;
    }
    const v = this.cityForm.getRawValue();
    const info: CityInfo = {};
    const put = (key: keyof CityInfo, text: string): void => {
      const trimmed = text.trim();
      if (trimmed) {
        (info as Record<string, unknown>)[key] = trimmed;
      }
    };
    put("period", v.period);
    put("note", v.note);
    put("summary", v.summary);
    put("population", v.population);
    put("metro", v.metro);
    put("area", v.area);
    put("source", v.source);
    put("fetchedAt", v.fetchedAt);
    const knownFor = splitChips(v.knownFor);
    const food = splitChips(v.food);
    if (knownFor.length) {
      info.knownFor = knownFor;
    }
    if (food.length) {
      info.food = food;
    }
    const cities = { ...this.cityInfos(), [this.cityId()]: info };
    this.persist({ memories: this.memories(), cities }, () => {
      this.cityInfos.set(cities);
      this.successMessage.set(`Saved ${this.city().name}.`);
    });
  }

  private persist(data: PlacesData, onSaved: () => void): void {
    this.saving.set(true);
    this.clearMessages();
    this.placesService.updatePlaces(data).subscribe({
      next: () => {
        this.saving.set(false);
        onSaved();
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set("Could not save. Please try again.");
      },
    });
  }

  private fillCityForm(): void {
    const info = this.cityInfos()[this.cityId()] ?? {};
    this.cityForm.reset({
      period: info.period ?? "",
      note: info.note ?? "",
      summary: info.summary ?? "",
      population: info.population ?? "",
      metro: info.metro ?? "",
      area: info.area ?? "",
      knownFor: (info.knownFor ?? []).join(", "),
      food: (info.food ?? []).join(", "),
      source: info.source ?? "",
      fetchedAt: info.fetchedAt ?? "",
    });
  }

  private clearMessages(): void {
    this.errorMessage.set("");
    this.successMessage.set("");
  }
}

function newMemoryId(): string {
  return `m_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function splitChips(text: string): string[] {
  return text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_CITY_CHIPS);
}
