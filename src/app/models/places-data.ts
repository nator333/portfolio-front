/**
 * Content of the Places page (five pixel-art hometown maps with memories
 * pinned on them), stored behind the portfolio-api /places endpoint. Mirrors
 * lambda/places-schema.ts in portfolio-api.
 */

/** The five towns the page draws; each has a hand-built map in cities.ts. */
export const PLACE_CITY_IDS = [
  "minamiuonuma",
  "hachioji",
  "ichikawa",
  "vancouver",
  "montreal",
] as const;
export type PlaceCityId = (typeof PLACE_CITY_IDS)[number];

export const SEASONS = ["spring", "summer", "autumn", "winter"] as const;
export type Season = (typeof SEASONS)[number];

/** One pixel sprite per kind on the map. Keep in sync with the API enum. */
export const MEMORY_KINDS = [
  "home",
  "school",
  "work",
  "food",
  "play",
  "other",
] as const;
export type MemoryKind = (typeof MEMORY_KINDS)[number];

/** A memory pinned on one town's map. Mirrors memorySchema in the API. */
export interface Memory {
  /** Client-minted id, stable across edits. */
  id: string;
  city: PlaceCityId;
  /** Pin position as a fraction of the map's width / height (0..1). */
  x: number;
  y: number;
  name: string;
  kind: MemoryKind;
  /** Free text such as "2015–2017" or "High school years"; may be empty. */
  period: string;
  text: string;
  /** Empty means every season; otherwise the pin shows only in these. */
  seasons: Season[];
  /** Media-library CDN urls, in carousel order (up to MAX_MEMORY_PHOTOS). */
  photos: string[];
  /** The pasted Google Maps link, or empty when the pin was placed by hand. */
  mapsUrl: string;
  /** Real coordinates the pin is derived from; null when placed by hand. */
  lat: number | null;
  lng: number | null;
  /** Epoch milliseconds; orders the list. */
  createdAt: number;
}

/** Per-town prose and facts. Mirrors cityInfoSchema in the API. */
export interface CityInfo {
  /** The owner's years there, e.g. "1998–2010". */
  period?: string;
  /** The owner's one-line note on the town. */
  note?: string;
  /** Two or three sentences shown under the town tabs. */
  summary?: string;
  population?: string;
  metro?: string;
  area?: string;
  knownFor?: string[];
  food?: string[];
  /** Where the facts came from (a Wikipedia article). */
  source?: string;
  /** ISO date (YYYY-MM-DD) the facts were retrieved. */
  fetchedAt?: string;
}

export interface PlacesData {
  /**
   * null means the item was never saved; the page draws the maps with no
   * pins either way.
   */
  memories: Memory[] | null;
  cities?: Partial<Record<PlaceCityId, CityInfo>>;
}

export const EMPTY_PLACES_DATA: PlacesData = { memories: [], cities: {} };

// Keep in sync with the API-side zod schema.
export const MAX_MEMORIES = 500;
export const MAX_MEMORY_NAME_LENGTH = 60;
export const MAX_MEMORY_PERIOD_LENGTH = 40;
export const MAX_MEMORY_TEXT_LENGTH = 1200;
export const MAX_MEMORY_PHOTOS = 3;
export const MAX_CITY_SUMMARY_LENGTH = 1000;
export const MAX_CITY_FACT_LENGTH = 80;
export const MAX_CITY_CHIPS = 6;

export const SEASON_LABELS: Record<Season, { label: string; icon: string }> = {
  spring: { label: "Spring", icon: "🌸" },
  summer: { label: "Summer", icon: "☀" },
  autumn: { label: "Autumn", icon: "🍁" },
  winter: { label: "Winter", icon: "❄" },
};

export const KIND_LABELS: Record<MemoryKind, string> = {
  home: "Home",
  school: "School",
  work: "Work",
  food: "Food",
  play: "Hangout",
  other: "Memory",
};

/**
 * The season a date falls in. All five towns are in the northern hemisphere,
 * so meteorological seasons (Mar–May spring, …) in the viewer's local time.
 */
export function seasonOf(date: Date = new Date()): Season {
  const byMonth: Season[] = [
    "winter",
    "winter",
    "spring",
    "spring",
    "spring",
    "summer",
    "summer",
    "summer",
    "autumn",
    "autumn",
    "autumn",
    "winter",
  ];
  return byMonth[date.getMonth()];
}

/** Whether a memory shows in the given season (no seasons = always). */
export function inSeason(memory: Memory, season: Season): boolean {
  return memory.seasons.length === 0 || memory.seasons.includes(season);
}

/**
 * The link behind "Open in Google Maps": the pasted link when there is one,
 * otherwise a search for the stored coordinates, otherwise nothing.
 */
export function mapsUrlFor(
  memory: Pick<Memory, "mapsUrl" | "lat" | "lng">,
): string {
  if (memory.mapsUrl) {
    return memory.mapsUrl;
  }
  if (memory.lat != null && memory.lng != null) {
    return `https://www.google.com/maps/search/?api=1&query=${memory.lat},${memory.lng}`;
  }
  return "";
}

export interface ParsedMapsLink {
  lat: number;
  lng: number;
  /** The place name from a /maps/place/<name>/ link, or empty. */
  name: string;
}

/**
 * Reads coordinates out of a Google Maps link. Place links carry the place's
 * own `!3d<lat>!4d<lng>`; search and share links use `q=`, `query=`, `ll=`;
 * the viewport is `@lat,lng`. A bare "lat, lng" works too. Returns
 * `"short"` for a maps.app.goo.gl link, which holds no coordinates and would
 * need a server-side redirect to resolve, and null when nothing parses.
 */
export function parseMapsLink(input: string): ParsedMapsLink | "short" | null {
  const s = (input ?? "").trim();
  if (!s) {
    return null;
  }
  if (/(maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs)/i.test(s)) {
    return "short";
  }
  const lat = "(-?\\d{1,2}(?:\\.\\d+)?)";
  const lng = "(-?\\d{1,3}(?:\\.\\d+)?)";
  const tryRe = (re: string): [number, number] | null => {
    const m = s.match(new RegExp(re));
    return m ? [+m[1], +m[2]] : null;
  };
  const hit =
    tryRe(`!3d${lat}!4d${lng}`) ??
    tryRe(`[?&](?:q|query|ll|center|destination)=${lat}(?:%2C|,)\\s*${lng}`) ??
    tryRe(`@${lat},${lng}`) ??
    tryRe(`^geo:${lat},${lng}`) ??
    tryRe(`^${lat}\\s*,\\s*${lng}$`);
  if (!hit || Math.abs(hit[0]) > 90 || Math.abs(hit[1]) > 180) {
    return null;
  }
  let name = "";
  const place = s.match(/\/maps\/place\/([^/@?]+)/);
  if (place) {
    try {
      name = decodeURIComponent(place[1].replace(/\+/g, " "));
    } catch {
      name = place[1];
    }
    // "/maps/place/35.6,139.3/" is a coordinate, not a name.
    if (/^-?\d/.test(name)) {
      name = "";
    }
  }
  return { lat: hit[0], lng: hit[1], name };
}
