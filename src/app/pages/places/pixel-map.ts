/**
 * The pixel-map engine behind the Places page: a 48×32 tile world per town
 * (built from noise-softened shapes in cities.ts), painted onto a canvas at
 * 8 px per tile in one of four seasonal palettes, with fixed landmark sprites
 * drawn on top. Pure functions and canvas work only — no Angular here.
 */
import {
  MemoryKind,
  MEMORY_KINDS,
  PlaceCityId,
  Season,
} from "../../models/places-data";

export const MAP_W = 48;
export const MAP_H = 32;
/** Pixels per tile on the backing canvas. */
export const TILE_PX = 8;

/** Terrain tiles. */
export const T = {
  grass: 0,
  field: 1,
  forest: 2,
  mountain: 3,
  snowPeak: 4,
  water: 5,
  river: 6,
  beach: 7,
  urban: 8,
  downtown: 9,
  park: 10,
  campus: 11,
  orchard: 12,
} as const;
export type Tile = (typeof T)[keyof typeof T];

const isWater = (c: number): boolean => c === T.water || c === T.river;

/* ---------- deterministic noise ---------- */

export function hash(x: number, y: number, s: number): number {
  let h =
    (Math.imul(x, 374761393) +
      Math.imul(y, 668265263) +
      Math.imul(s, 982451653)) |
    0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function vnoise(x: number, y: number, s: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const a = hash(xi, yi, s);
  const b = hash(xi + 1, yi, s);
  const c = hash(xi, yi + 1, s);
  const d = hash(xi + 1, yi + 1, s);
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

const fbm = (x: number, y: number, s: number): number =>
  vnoise(x / 6, y / 6, s) * 0.65 + vnoise(x / 3, y / 3, s + 7) * 0.35;

/* ---------- map builder ---------- */

export type Point = [number, number];

export interface ShapeOptions {
  /** Edge roughness in tiles; 0 for a crisp edge. */
  r?: number;
  /** Only paint over these tiles. */
  on?: readonly Tile[];
}

/** A town's tile grid plus the brush methods cities.ts draws with. */
export interface MapBuilder {
  /** Terrain per tile, row-major. */
  t: Uint8Array;
  /** Overlay bits per tile: 1 = road, 2 = rail. */
  o: Uint8Array;
  seed: number;
  /** Signed noise (−0.5..0.5) at a tile, for hand-written shape edges. */
  n(x: number, y: number, k?: number): number;
  fill(v: Tile): void;
  when(pred: (x: number, y: number, c: number) => boolean, v: Tile): void;
  rect(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    v: Tile,
    opt?: ShapeOptions,
  ): void;
  ellipse(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    v: Tile,
    opt?: ShapeOptions,
  ): void;
  poly(pts: Point[], v: Tile, opt?: ShapeOptions): void;
  band(pts: Point[], w: number, v: Tile, opt?: ShapeOptions): void;
  scatter(v: Tile, p: number, on: readonly Tile[], k?: number): void;
  road(pts: Point[]): void;
  rail(pts: Point[]): void;
  /** Sand on every land tile touching open water. */
  beach(): void;
}

export function builder(seed: number): MapBuilder {
  const t = new Uint8Array(MAP_W * MAP_H);
  const o = new Uint8Array(MAP_W * MAP_H);
  const n = (x: number, y: number, k = 0): number => fbm(x, y, seed + k) - 0.5;
  const each = (fn: (x: number, y: number) => void): void => {
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        fn(x, y);
      }
    }
  };
  const put = (x: number, y: number, v: Tile, opt: ShapeOptions): void => {
    const i = y * MAP_W + x;
    if (!opt.on || opt.on.includes(t[i] as Tile)) {
      t[i] = v;
    }
  };
  const inPoly = (px: number, py: number, pts: Point[]): boolean => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i];
      const [xj, yj] = pts[j];
      if (
        yi > py !== yj > py &&
        px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
      ) {
        inside = !inside;
      }
    }
    return inside;
  };
  const segDist = (px: number, py: number, a: Point, b: Point): number => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = dx * dx + dy * dy;
    let k = l ? ((px - a[0]) * dx + (py - a[1]) * dy) / l : 0;
    k = Math.max(0, Math.min(1, k));
    return Math.hypot(px - a[0] - k * dx, py - a[1] - k * dy);
  };
  const line4 = (a: Point, b: Point, bit: number): void => {
    let x = Math.round(a[0]);
    let y = Math.round(a[1]);
    const x1 = Math.round(b[0]);
    const y1 = Math.round(b[1]);
    const dx = Math.abs(x1 - x);
    const dy = -Math.abs(y1 - y);
    const sx = x < x1 ? 1 : -1;
    const sy = y < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      if (x >= 0 && y >= 0 && x < MAP_W && y < MAP_H) {
        o[y * MAP_W + x] |= bit;
      }
      if (x === x1 && y === y1) {
        break;
      }
      const e2 = 2 * err;
      if (e2 - dy > dx - e2) {
        err += dy;
        x += sx;
      } else {
        err += dx;
        y += sy;
      }
    }
  };

  return {
    t,
    o,
    seed,
    n,
    fill(v) {
      t.fill(v);
    },
    when(pred, v) {
      each((x, y) => {
        if (pred(x, y, t[y * MAP_W + x])) {
          t[y * MAP_W + x] = v;
        }
      });
    },
    rect(x0, y0, x1, y1, v, opt = {}) {
      const r = opt.r ?? 0;
      each((x, y) => {
        const a = x + n(x, y) * r;
        const b = y + n(x, y, 3) * r;
        if (a >= x0 && a < x1 && b >= y0 && b < y1) {
          put(x, y, v, opt);
        }
      });
    },
    ellipse(cx, cy, rx, ry, v, opt = {}) {
      const r = opt.r ?? 0;
      each((x, y) => {
        const d = ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2;
        if (d <= 1 + n(x, y, 5) * r) {
          put(x, y, v, opt);
        }
      });
    },
    poly(pts, v, opt = {}) {
      const r = opt.r ?? 0;
      each((x, y) => {
        if (inPoly(x + 0.5 + n(x, y) * r, y + 0.5 + n(x, y, 3) * r, pts)) {
          put(x, y, v, opt);
        }
      });
    },
    band(pts, w, v, opt = {}) {
      const r = opt.r ?? 0;
      each((x, y) => {
        let d = Infinity;
        for (let i = 1; i < pts.length; i++) {
          d = Math.min(d, segDist(x + 0.5, y + 0.5, pts[i - 1], pts[i]));
        }
        if (d <= w / 2 + n(x, y, 9) * r) {
          put(x, y, v, opt);
        }
      });
    },
    scatter(v, p, on, k = 1) {
      each((x, y) => {
        const i = y * MAP_W + x;
        if (on.includes(t[i] as Tile) && hash(x, y, seed + 100 * k) < p) {
          t[i] = v;
        }
      });
    },
    road(pts) {
      for (let i = 1; i < pts.length; i++) {
        line4(pts[i - 1], pts[i], 1);
      }
    },
    rail(pts) {
      for (let i = 1; i < pts.length; i++) {
        line4(pts[i - 1], pts[i], 2);
      }
    },
    beach() {
      const sandy: number[] = [];
      const land: readonly Tile[] = [T.grass, T.urban, T.park];
      each((x, y) => {
        const c = t[y * MAP_W + x] as Tile;
        if (!land.includes(c)) {
          return;
        }
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const X = x + dx;
          const Y = y + dy;
          if (
            X >= 0 &&
            Y >= 0 &&
            X < MAP_W &&
            Y < MAP_H &&
            t[Y * MAP_W + X] === T.water
          ) {
            sandy.push(y * MAP_W + x);
            break;
          }
        }
      });
      for (const i of sandy) {
        if (!o[i]) {
          t[i] = T.beach;
        }
      }
    },
  };
}

/* ---------- palettes ---------- */

/** Colour overrides and painter flags for one season (all optional). */
export interface SeasonPaint {
  grass?: string;
  grassD?: string;
  grassL?: string;
  field?: string;
  fieldD?: string;
  fieldL?: string;
  forest?: string;
  crown?: string;
  crownL?: string;
  trunk?: string;
  mtn?: string;
  mtnL?: string;
  mtnD?: string;
  snow?: boolean;
  snowD?: string;
  water?: string;
  waterL?: string;
  foam?: string;
  sand?: string;
  sandD?: string;
  pave?: string;
  dtGround?: string;
  park?: string;
  flowerY?: string;
  flowerP?: string;
  road?: string;
  roadE?: string;
  /** Flooded rice paddies (spring). */
  paddy?: boolean;
  /** Share of trees turned cherry-blossom pink (0..1). */
  blossom?: number;
  /** Red/orange/yellow crowns. */
  fall?: boolean;
  /** Snow on the mountains only (a town with snowless winters). */
  snowPeaks?: boolean;
  /** Rivers and lakes frozen over. */
  frozen?: boolean;
}

/** The town-independent look of each season; a town may override any of it. */
export const SEASON_PAINT: Record<Season, SeasonPaint> = {
  summer: {},
  spring: {
    grass: "#78c04a",
    grassD: "#5aa83c",
    grassL: "#a6dc6e",
    park: "#86cc5c",
    forest: "#4f9440",
    crown: "#3f8a34",
    crownL: "#6fb84e",
    field: "#8fb9c9",
    fieldD: "#6f9fb6",
    fieldL: "#b6d6df",
    paddy: true,
    blossom: 0.28,
    mtnL: "#b89a6e",
  },
  autumn: {
    grass: "#a8a84a",
    grassD: "#8c8a3a",
    grassL: "#c7c264",
    park: "#b1a84c",
    forest: "#8a6a2a",
    crown: "#c0562e",
    crownL: "#e58a3a",
    field: "#d9b84a",
    fieldD: "#b8963a",
    fieldL: "#efd76a",
    fall: true,
    mtn: "#8c5e3a",
    mtnL: "#b68458",
    mtnD: "#6a4630",
    flowerY: "#e0b24a",
    flowerP: "#d98a5a",
  },
  winter: {
    grass: "#eef2f7",
    grassD: "#d4dde9",
    grassL: "#ffffff",
    park: "#eef2f7",
    forest: "#dfe6ef",
    crown: "#2f5a2a",
    crownL: "#4b7a3e",
    field: "#f1f4f8",
    fieldD: "#d4dde9",
    fieldL: "#ffffff",
    snow: true,
    mtn: "#c9d6e3",
    mtnL: "#f4f7fa",
    mtnD: "#c9d6e3",
    snowD: "#a3b5c9",
    water: "#2c5fa8",
    waterL: "#5c8fd2",
    foam: "#dfe9f5",
    sand: "#e9e4d8",
    sandD: "#cfc8b8",
    pave: "#cfd3d8",
    dtGround: "#aeb3bd",
    road: "#d9d2c0",
    roadE: "#9f957e",
    flowerY: "#eef2f7",
    flowerP: "#eef2f7",
  },
};

const BASE = {
  grass: "#5aa83c",
  grassD: "#468a2e",
  grassL: "#78c255",
  field: "#86bf52",
  fieldD: "#6ea443",
  fieldL: "#a4d36a",
  forest: "#3d7d2e",
  crown: "#2a6125",
  crownL: "#4b9a3b",
  trunk: "#6b4a2a",
  mtn: "#8d6c48",
  mtnL: "#b08c62",
  mtnD: "#6a5036",
  snowC: "#f4f7fa",
  snowD: "#c9d6e3",
  water: "#2f6fc2",
  waterL: "#6aa2e6",
  foam: "#a9d0f5",
  sand: "#e4d096",
  sandD: "#c9b277",
  pave: "#b9aa8c",
  wall: "#efe6cf",
  win: "#4a6fa5",
  door: "#6b4a2a",
  dtGround: "#8e8f9c",
  tower: "#6b7d9c",
  towerL: "#9db3d1",
  glass: "#cfe0f2",
  park: "#74c056",
  flowerY: "#f7e26b",
  flowerP: "#f39bbb",
  road: "#dcc792",
  roadE: "#a88f5c",
  plank: "#a8743f",
  plankE: "#5a3a20",
  bed: "#7c7c86",
  tie: "#4a3a2a",
  railc: "#dfe3e8",
};

/* ---------- towns ---------- */

export type LabelClass =
  "" | "water" | "mtn" | "minor" | "water minor" | "mtn minor";

/** A place-name label: text, tile x/y of its centre, style. */
export type MapLabel = [string, number, number, LabelClass?];

export type LandmarkKind =
  | "station"
  | "airport"
  | "ski"
  | "mall"
  | "university"
  | "themepark"
  | "stadium"
  | "port"
  | "dome";

export interface Landmark {
  kind: LandmarkKind;
  /** Tile x/y of the sprite's top-left corner. */
  x: number;
  y: number;
  label: string;
  /** Put the label above the sprite (for one at the bottom edge). */
  labelAbove?: boolean;
}

/** [lat, lng, tileX, tileY]: a real place and where it sits on the map. */
export type GeoControlPoint = [number, number, number, number];

export interface CityDef {
  id: PlaceCityId;
  name: string;
  region: string;
  seed: number;
  /** House roof colours, picked per tile. */
  roofs: string[];
  /** Season looks this town differs in (Vancouver's wet winter, …). */
  paint?: Partial<Record<Season, SeasonPaint>>;
  build(m: MapBuilder): void;
  labels: MapLabel[];
  landmarks: Landmark[];
  /** At least three control points tie the stylised map to real coordinates. */
  geo: GeoControlPoint[];
}

/* ---------- landmark sprites ---------- */

type Painter = (
  c: string,
  x: number,
  y: number,
  w?: number,
  h?: number,
) => void;

interface LandmarkSprite {
  w: number;
  h: number;
  draw(p: Painter, X: number, Y: number, se: SeasonPaint): void;
}

/** Fixed landmarks: small pixel buildings (sizes in px; a tile is 8 px). */
export const LANDMARK_SPRITES: Record<LandmarkKind, LandmarkSprite> = {
  station: {
    w: 16,
    h: 16,
    draw(p, X, Y) {
      p("#b9aa8c", X, Y, 16, 16);
      p("#5e6670", X + 4, Y + 1, 8, 1);
      p("#5e6670", X + 2, Y + 2, 12, 1);
      p("#4a515a", X + 1, Y + 3, 14, 2);
      p("#efe6cf", X + 1, Y + 5, 14, 7);
      p("#2f6fc2", X + 3, Y + 6, 10, 1);
      p("#ffffff", X + 5, Y + 6, 2, 1);
      p("#4a6fa5", X + 3, Y + 8, 2, 2);
      p("#4a6fa5", X + 11, Y + 8, 2, 2);
      p("#6b4a2a", X + 7, Y + 8, 2, 4);
      p("#9a9a9a", X + 1, Y + 12, 14, 3);
      p("#ffffff", X + 1, Y + 12, 14, 1);
    },
  },
  airport: {
    w: 24,
    h: 16,
    draw(p, X, Y) {
      p("#8e8f9c", X, Y, 24, 16);
      p("#5a5c66", X, Y + 10, 24, 5);
      for (const x of [1, 5, 9, 13, 17, 21]) {
        p("#ffffff", X + x, Y + 12, 2, 1);
      }
      p("#cfd3d8", X + 1, Y + 2, 10, 7);
      p("#6b7d9c", X + 1, Y + 2, 10, 1);
      for (const x of [2, 4, 6, 8]) {
        p("#4a6fa5", X + x, Y + 5, 1, 2);
      }
      p("#9db3d1", X + 12, Y + 2, 2, 7);
      p("#2f6fc2", X + 11, Y + 1, 4, 2);
      p("#ffffff", X + 15, Y + 4, 8, 2);
      p("#ffffff", X + 17, Y + 2, 3, 6);
      p("#d9473a", X + 15, Y + 3, 1, 1);
    },
  },
  ski: {
    w: 16,
    h: 16,
    draw(p, X, Y, se) {
      const snowy = se.snow || se.snowPeaks;
      p(snowy ? "#f4f7fa" : "#8fc46a", X, Y, 16, 16);
      for (let i = 0; i < 4; i++) {
        p(snowy ? "#dfe6ef" : "#78b25a", X + 1 + i * 4, Y + 7 + i, 3, 1);
      }
      p("#6b4a2a", X + 3, Y + 3, 1, 7);
      p("#6b4a2a", X + 12, Y + 2, 1, 8);
      p("#4a3a2a", X + 3, Y + 3, 10, 1);
      p("#d9473a", X + 6, Y + 4, 2, 2);
      p("#d9473a", X + 9, Y + 4, 2, 2);
      p("#8c4434", X + 5, Y + 11, 6, 1);
      p("#a8743f", X + 5, Y + 12, 6, 3);
      p("#ffd34d", X + 7, Y + 13, 2, 2);
      p("#2a6125", X + 13, Y + 11, 2, 3);
      p("#2a6125", X + 1, Y + 12, 2, 3);
    },
  },
  mall: {
    w: 16,
    h: 16,
    draw(p, X, Y) {
      p("#9a9a9a", X, Y, 16, 16);
      p("#e8e2d4", X + 1, Y + 4, 14, 9);
      p("#9aa0a8", X + 1, Y + 4, 14, 1);
      p("#d3328f", X + 3, Y + 1, 10, 3);
      p("#ffffff", X + 5, Y + 2, 6, 1);
      p("#4a6fa5", X + 2, Y + 7, 3, 2);
      p("#4a6fa5", X + 11, Y + 7, 3, 2);
      p("#4a6fa5", X + 6, Y + 10, 4, 3);
      p("#7c7c86", X, Y + 13, 16, 3);
      for (const x of [2, 5, 8, 11, 14]) {
        p("#ffffff", X + x, Y + 14, 1, 2);
      }
    },
  },
  university: {
    w: 16,
    h: 16,
    draw(p, X, Y) {
      p("#5aa83c", X, Y, 16, 16);
      p("#d8c9a8", X + 1, Y + 7, 14, 7);
      p("#8c4434", X + 1, Y + 6, 14, 1);
      p("#c9b98f", X + 6, Y + 2, 4, 12);
      p("#5a4f6e", X + 5, Y + 1, 6, 1);
      p("#ffffff", X + 7, Y + 3, 2, 2);
      for (const x of [2, 4, 11, 13]) {
        p("#4a6fa5", X + x, Y + 9, 1, 2);
      }
      p("#6b4a2a", X + 7, Y + 11, 2, 3);
    },
  },
  themepark: {
    w: 24,
    h: 16,
    draw(p, X, Y) {
      p("#5aa83c", X, Y, 24, 16);
      p("#e9e4ef", X + 4, Y + 7, 16, 8);
      p("#dfe3ea", X + 10, Y + 3, 4, 12);
      p("#dfe3ea", X + 4, Y + 4, 3, 11);
      p("#dfe3ea", X + 17, Y + 4, 3, 11);
      p("#d95f8a", X + 11, Y, 2, 1);
      p("#d95f8a", X + 10, Y + 1, 4, 2);
      p("#d95f8a", X + 4, Y + 2, 3, 2);
      p("#d95f8a", X + 17, Y + 2, 3, 2);
      p("#4a6fa5", X + 11, Y + 5, 2, 2);
      p("#4a6fa5", X + 5, Y + 7, 1, 2);
      p("#4a6fa5", X + 18, Y + 7, 1, 2);
      p("#4a6fa5", X + 7, Y + 9, 1, 2);
      p("#4a6fa5", X + 15, Y + 9, 1, 2);
      p("#6b4a2a", X + 11, Y + 11, 2, 4);
    },
  },
  stadium: {
    w: 16,
    h: 16,
    draw(p, X, Y) {
      p("#b9aa8c", X, Y, 16, 16);
      p("#cfd3d8", X + 4, Y + 2, 8, 1);
      p("#9aa0a8", X + 2, Y + 3, 12, 1);
      p("#9aa0a8", X + 1, Y + 4, 14, 8);
      p("#9aa0a8", X + 2, Y + 12, 12, 1);
      p("#9aa0a8", X + 4, Y + 13, 8, 1);
      p("#5aa83c", X + 4, Y + 6, 8, 5);
      p("#ffffff", X + 4, Y + 8, 8, 1);
    },
  },
  port: {
    w: 16,
    h: 16,
    draw(p, X, Y) {
      p("#a8743f", X + 1, Y + 11, 14, 3);
      p("#5a3a20", X + 1, Y + 13, 14, 1);
      for (const b of [2, 6, 10]) {
        p("#ffffff", X + b + 1, Y + 4, 1, 1);
        p("#ffffff", X + b + 1, Y + 5, 2, 2);
        p("#ffffff", X + b, Y + 7, 3, 2);
        p("#ffffff", X + b, Y + 9, 4, 2);
      }
    },
  },
  dome: {
    w: 16,
    h: 16,
    draw(p, X, Y) {
      p("#6b7d9c", X + 2, Y + 12, 12, 3);
      [2, 4, 5, 6, 7, 7, 7, 7, 7].forEach((hw, i) =>
        p("#cfd3d8", X + 8 - hw, Y + 3 + i, hw * 2, 1),
      );
      p("#9aa0a8", X + 8, Y + 3, 1, 9);
      p("#9aa0a8", X + 1, Y + 8, 14, 1);
    },
  },
};

/* ---------- painting ---------- */

/** A town's built terrain, memoised per town. */
const builtMaps = new Map<PlaceCityId, MapBuilder>();

export function builtMap(city: CityDef): MapBuilder {
  let m = builtMaps.get(city.id);
  if (!m) {
    m = builder(city.seed);
    city.build(m);
    builtMaps.set(city.id, m);
  }
  return m;
}

/** The season's paint for a town: the shared look plus the town's overrides. */
export function seasonPaint(city: CityDef, season: Season): SeasonPaint {
  return { ...SEASON_PAINT[season], ...city.paint?.[season] };
}

/**
 * Paints one animation frame (0 or 1; the frames differ in the water
 * ripples) of a town in a season onto a new canvas.
 */
export function renderMap(
  city: CityDef,
  frame: 0 | 1,
  season: Season,
): HTMLCanvasElement {
  const se = seasonPaint(city, season);
  const C = { ...BASE, ...se };
  const cv = document.createElement("canvas");
  cv.width = MAP_W * TILE_PX;
  cv.height = MAP_H * TILE_PX;
  const g = cv.getContext("2d");
  if (!g) {
    return cv;
  }
  const { t, o, seed } = builtMap(city);
  const at = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? -1 : t[y * MAP_W + x];
  const ov = (x: number, y: number): number =>
    x < 0 || y < 0 || x >= MAP_W || y >= MAP_H ? 0 : o[y * MAP_W + x];
  const p: Painter = (c, x, y, w = 1, h = 1) => {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  };
  const landBeside = (
    x: number,
    y: number,
    dx: number,
    dy: number,
  ): boolean => {
    const nb = at(x + dx, y + dy);
    return nb !== -1 && !isWater(nb);
  };

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const c = at(x, y);
      const X = x * TILE_PX;
      const Y = y * TILE_PX;
      const r = hash(x, y, seed);
      const r2 = hash(x, y, seed + 9);
      const grass = (base = C.grass): void => {
        p(base, X, Y, 8, 8);
        const a = (r * 64) | 0;
        const b = (r2 * 64) | 0;
        p(C.grassD, X + (a & 7), Y + (a >> 3));
        p(C.grassL, X + (b & 7), Y + (b >> 3));
      };
      const tree = (
        ox: number,
        oy: number,
        crown = C.crown,
        hi = C.crownL,
      ): void => {
        const r3 = hash(x, y, seed + 21);
        if (se.blossom && r3 < se.blossom) {
          crown = "#f2a7c3";
          hi = "#fbd3e1";
        } else if (se.fall) {
          [crown, hi] = [
            ["#c0562e", "#e58a3a"],
            ["#d9922a", "#f0c24a"],
            ["#a8342a", "#d2603a"],
            ["#3f7d2e", "#5aa83c"],
          ][(r3 * 4) | 0];
        }
        p(crown, X + ox + 1, Y + oy, 4, 1);
        p(crown, X + ox, Y + oy + 1, 6, 3);
        p(crown, X + ox + 1, Y + oy + 4, 4, 1);
        p(hi, X + ox + 1, Y + oy + 1, 2, 1);
        p(hi, X + ox + 1, Y + oy + 2, 1, 1);
        if (se.snow) {
          p("#ffffff", X + ox + 1, Y + oy, 4, 1);
          p("#ffffff", X + ox, Y + oy + 1, 2, 1);
        }
        p(C.trunk, X + ox + 2, Y + oy + 5, 2, 2);
      };

      switch (c) {
        case T.grass:
          grass();
          break;
        case T.field:
          p(C.field, X, Y, 8, 8);
          p(C.fieldD, X, Y + 2, 8, 1);
          p(C.fieldD, X, Y + 6, 8, 1);
          if (se.paddy) {
            p("#6fae4a", X + ((r * 6) | 0), Y + 2, 2, 1);
            p("#6fae4a", X + ((r2 * 6) | 0), Y + 6, 2, 1);
          } else {
            p(C.fieldL, X + ((r * 6) | 0), Y + 4, 2, 1);
          }
          break;
        case T.orchard:
          grass(C.grassL);
          tree(
            0,
            0,
            se.fall ? "#c98a2a" : "#5c9c3a",
            se.fall ? "#f0c24a" : "#9ccc5a",
          );
          if (r > 0.4 && !se.snow) {
            p(se.blossom ? "#ffffff" : C.flowerY, X + 6, Y + 5);
          }
          break;
        case T.forest:
          p(C.forest, X, Y, 8, 8);
          tree(1 + ((r * 2) | 0), 0);
          break;
        case T.mountain:
        case T.snowPeak: {
          p(c === T.snowPeak ? C.forest : C.grass, X, Y, 8, 8);
          for (let row = 0; row < 7; row++) {
            const half = Math.floor((row + 1) / 2) + (row > 4 ? 1 : 0);
            const x0 = 4 - half;
            p(C.mtnL, X + x0, Y + 1 + row, half, 1);
            p(C.mtnD, X + 4, Y + 1 + row, half, 1);
            const capped =
              se.snow || se.snowPeaks || (c === T.snowPeak && row < 3);
            if (capped) {
              p(C.snowC, X + x0, Y + 1 + row, half, 1);
              p(C.snowD, X + 4, Y + 1 + row, half, 1);
            }
            if (!half) {
              p(
                capped || c === T.snowPeak ? C.snowC : C.mtnL,
                X + 3,
                Y + 1,
                2,
                1,
              );
            }
          }
          if (!se.snow && !se.snowPeaks) {
            p(C.mtn, X + 4, Y + 4, 1, 2);
          }
          break;
        }
        case T.water:
        case T.river: {
          if (se.frozen) {
            // Ice: a pale sheet, faint streaks, the odd crack, a snow rim on the banks.
            p("#c9dcec", X, Y, 8, 8);
            p("#e6eff7", X + ((r * 5) | 0), Y + ((r2 * 6) | 0) + 1, 3, 1);
            if (r > 0.78) {
              const cx = (r2 * 6) | 0;
              p("#9fb6ca", X + cx, Y + 2, 1, 2);
              p("#9fb6ca", X + cx + 1, Y + 4, 1, 2);
            }
            if (landBeside(x, y, 0, -1)) {
              p("#f4f7fa", X, Y, 8, 1);
            }
            if (landBeside(x, y, 0, 1)) {
              p("#f4f7fa", X, Y + 7, 8, 1);
            }
            if (landBeside(x, y, -1, 0)) {
              p("#f4f7fa", X, Y, 1, 8);
            }
            if (landBeside(x, y, 1, 0)) {
              p("#f4f7fa", X + 7, Y, 1, 8);
            }
            break;
          }
          p(C.water, X, Y, 8, 8);
          const wx = ((r * 5) | 0) + (frame ? 1 : 0);
          const wy = ((r2 * 6) | 0) + 1;
          p(C.waterL, X + wx, Y + wy, 3, 1);
          if (r > 0.55) {
            p(C.waterL, X + ((wx + 4) & 7), Y + ((wy + 4) & 7), 2, 1);
          }
          if (landBeside(x, y, 0, -1)) {
            p(C.foam, X, Y, 8, 1);
          }
          if (landBeside(x, y, 0, 1)) {
            p(C.foam, X, Y + 7, 8, 1);
          }
          if (landBeside(x, y, -1, 0)) {
            p(C.foam, X, Y, 1, 8);
          }
          if (landBeside(x, y, 1, 0)) {
            p(C.foam, X + 7, Y, 1, 8);
          }
          break;
        }
        case T.beach:
          p(C.sand, X, Y, 8, 8);
          p(C.sandD, X + ((r * 7) | 0), Y + ((r2 * 7) | 0));
          p(C.sandD, X + ((r2 * 7) | 0), Y + 5);
          break;
        case T.urban: {
          p(C.pave, X, Y, 8, 8);
          if (r < 0.14) {
            grass(C.park);
            tree(1, 1);
            break;
          }
          const roof = city.roofs[(r2 * city.roofs.length) | 0];
          p(roof, X + 2, Y + 1, 4, 1);
          p(roof, X + 1, Y + 2, 6, 2);
          p(se.snow ? "#ffffff" : "rgba(255,255,255,.18)", X + 1, Y + 2, 6, 1);
          if (se.snow) {
            p("#ffffff", X + 2, Y + 1, 4, 1);
          }
          p(C.wall, X + 1, Y + 4, 6, 3);
          p(C.win, X + 2, Y + 5);
          p(C.door, X + 5, Y + 5, 1, 2);
          break;
        }
        case T.downtown: {
          p(C.dtGround, X, Y, 8, 8);
          const top = (r * 3) | 0;
          p(C.tower, X + 1, Y + top, 6, 8 - top);
          p(se.snow ? "#ffffff" : C.towerL, X + 1, Y + top, 6, 1);
          for (let yy = top + 2; yy < 8; yy += 2) {
            for (let xx = 2; xx < 7; xx += 2) {
              p(C.glass, X + xx, Y + yy);
            }
          }
          break;
        }
        case T.park:
          grass(C.park);
          if (r > 0.5) {
            tree(1, 1, "#3f8a34", "#6bb24e");
          } else if (!se.snow) {
            p(C.flowerY, X + 2, Y + 3);
            p(C.flowerP, X + 5, Y + 5);
            p(C.flowerP, X + 1, Y + 6);
          }
          break;
        case T.campus:
          grass(C.park);
          p(se.snow ? "#ffffff" : "#4f78b0", X + 1, Y + 1, 6, 2);
          p(C.wall, X + 1, Y + 3, 6, 4);
          p(C.win, X + 2, Y + 4);
          p(C.win, X + 5, Y + 4);
          p(C.door, X + 3, Y + 5, 2, 2);
          break;
        default:
          grass();
      }

      // Roads and rails, joined to their neighbours.
      const ob = ov(x, y);
      if (ob & 1) {
        const N = ov(x, y - 1) & 1;
        const S = ov(x, y + 1) & 1;
        const Wd = ov(x - 1, y) & 1;
        const E = ov(x + 1, y) & 1;
        const onWater = isWater(c);
        const edge = onWater ? C.plankE : C.roadE;
        const fill = onWater ? C.plank : C.road;
        const arms = (col: string, a: number, b: number): void => {
          p(col, X + a, Y + a, b - a, b - a);
          if (N) {
            p(col, X + a, Y, b - a, a);
          }
          if (S) {
            p(col, X + a, Y + b, b - a, 8 - b);
          }
          if (Wd) {
            p(col, X, Y + a, a, b - a);
          }
          if (E) {
            p(col, X + b, Y + a, 8 - b, b - a);
          }
        };
        arms(edge, 1, 7);
        arms(fill, 2, 6);
        if (onWater) {
          if (Wd || E) {
            for (let i = 1; i < 8; i += 2) {
              p(edge, X + i, Y + 2, 1, 4);
            }
          } else {
            for (let i = 1; i < 8; i += 2) {
              p(edge, X + 2, Y + i, 4, 1);
            }
          }
        }
      }
      if (ob & 2) {
        const N = ov(x, y - 1) & 2;
        const S = ov(x, y + 1) & 2;
        const Wd = ov(x - 1, y) & 2;
        const E = ov(x + 1, y) & 2;
        const horiz = Wd || E || !(N || S);
        const vert = N || S;
        if (horiz) {
          const a = Wd || !(E || N || S) ? 0 : 2;
          const b = E || !(Wd || N || S) ? 8 : 6;
          p(C.bed, X + a, Y + 2, b - a, 4);
          for (let i = a; i < b; i += 2) {
            p(C.tie, X + i, Y + 1, 1, 6);
          }
          p(C.railc, X + a, Y + 2, b - a, 1);
          p(C.railc, X + a, Y + 5, b - a, 1);
        }
        if (vert) {
          const a = N ? 0 : 2;
          const b = S ? 8 : 6;
          p(C.bed, X + 2, Y + a, 4, b - a);
          for (let i = a; i < b; i += 2) {
            p(C.tie, X + 1, Y + i, 6, 1);
          }
          p(C.railc, X + 2, Y + a, 1, b - a);
          p(C.railc, X + 5, Y + a, 1, b - a);
        }
      }
    }
  }

  for (const L of city.landmarks) {
    const D = LANDMARK_SPRITES[L.kind];
    const X = L.x * TILE_PX;
    const Y = L.y * TILE_PX;
    p("rgba(0,0,0,.4)", X - 1, Y - 1, D.w + 2, D.h + 2);
    D.draw(p, X, Y, se);
  }
  return cv;
}

/** Both ripple frames of a town in a season, painted once and kept. */
const frameCache = new Map<string, [HTMLCanvasElement, HTMLCanvasElement]>();

export function mapFrames(
  city: CityDef,
  season: Season,
): [HTMLCanvasElement, HTMLCanvasElement] {
  const key = `${city.id}:${season}`;
  let frames = frameCache.get(key);
  if (!frames) {
    frames = [renderMap(city, 0, season), renderMap(city, 1, season)];
    frameCache.set(key, frames);
  }
  return frames;
}

/* ---------- pin sprites ---------- */

interface PinArt {
  pal: Record<string, string>;
  px: string[];
}

const PIN_ART: Record<MemoryKind, PinArt> = {
  home: {
    pal: { r: "#d9473a", w: "#f4ead2", b: "#5b8fd6", d: "#7a4f2a" },
    px: [
      "....r....",
      "...rrr...",
      "..rrrrr..",
      ".rrrrrrr.",
      "..wwwww..",
      "..wbwdw..",
      "..wwwdw..",
      "..wwwdw..",
    ],
  },
  school: {
    pal: {
      f: "#e8473a",
      p: "#cfcfcf",
      g: "#3f7c6a",
      w: "#f4ead2",
      b: "#5b8fd6",
      d: "#7a4f2a",
    },
    px: [
      "....ff...",
      "....fff..",
      "....p....",
      ".ggggggg.",
      "ggggggggg",
      ".wbwbwbw.",
      ".wwwdwww.",
      ".wwwdwww.",
    ],
  },
  work: {
    pal: { k: "#4a3426", b: "#a8693a", y: "#f2c94c", l: "#c98a52" },
    px: [
      ".........",
      "...kkk...",
      "...k.k...",
      ".bbbbbbb.",
      ".llllll l",
      ".bbbybbb.",
      ".bbbbbbb.",
      ".bbbbbbb.",
    ],
  },
  food: {
    pal: {
      s: "#dfe6f0",
      w: "#ffffff",
      r: "#d6403a",
      d: "#8a2a24",
      k: "#7a4f2a",
    },
    px: [
      "..s..s.kk",
      ".s..s.kk.",
      "..s..kk..",
      ".wwwwwww.",
      ".rrrrrrr.",
      "..rrrrr..",
      "...ddd...",
      ".........",
    ],
  },
  play: {
    pal: { y: "#ffd34d", o: "#e8a21f" },
    px: [
      "....y....",
      "...yyy...",
      "yyyyyyyyy",
      ".yyyyyyy.",
      "..yyoyy..",
      "..yy.yy..",
      ".yo...oy.",
      ".........",
    ],
  },
  other: {
    pal: { p: "#ff7aa8", l: "#ffc0d6" },
    px: [
      ".pp...pp.",
      "plpp.pppp",
      "pllpppppp",
      "ppppppppp",
      ".ppppppp.",
      "..ppppp..",
      "...ppp...",
      "....p....",
    ],
  },
};

const pinSpriteCache = new Map<MemoryKind, string>();

/** The pin sprite for a memory kind, as a data URL (11×10 px, outlined). */
export function pinSprite(kind: MemoryKind): string {
  const cached = pinSpriteCache.get(kind);
  if (cached) {
    return cached;
  }
  const art = PIN_ART[kind] ?? PIN_ART.other;
  const cv = document.createElement("canvas");
  cv.width = 11;
  cv.height = 10;
  const g = cv.getContext("2d");
  if (!g) {
    return "";
  }
  const on = (x: number, y: number): boolean => {
    const row = art.px[y - 1];
    const ch = row?.[x - 1];
    return !!ch && ch !== "." && ch !== " ";
  };
  g.fillStyle = "#16122a";
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 11; x++) {
      if (
        !on(x, y) &&
        (on(x + 1, y) || on(x - 1, y) || on(x, y + 1) || on(x, y - 1))
      ) {
        g.fillRect(x, y, 1, 1);
      }
    }
  }
  art.px.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      const colour = art.pal[ch];
      if (colour) {
        g.fillStyle = colour;
        g.fillRect(x + 1, y + 1, 1, 1);
      }
    }),
  );
  const url = cv.toDataURL();
  pinSpriteCache.set(kind, url);
  return url;
}

/** Every kind's sprite, for legends. */
export function allPinSprites(): Record<MemoryKind, string> {
  return Object.fromEntries(
    MEMORY_KINDS.map((k) => [k, pinSprite(k)]),
  ) as Record<MemoryKind, string>;
}

/* ---------- real coordinates → map tiles ---------- */

interface GeoFit {
  lat0: number;
  lng0: number;
  kx: number;
  ky: number;
  px: [number, number, number];
  py: [number, number, number];
}

function solve3(M: number[][], v: number[]): [number, number, number] {
  const det = (m: number[][]): number =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D = det(M);
  if (!D) {
    return [0, 0, 0];
  }
  return [0, 1, 2].map(
    (k) =>
      det(M.map((row, i) => row.map((val, j) => (j === k ? v[i] : val)))) / D,
  ) as [number, number, number];
}

const fitCache = new Map<PlaceCityId, GeoFit>();

/**
 * A least-squares affine fit from local km east/north to tile x/y through the
 * town's control points. It absorbs the stylised map's stretch and rotation,
 * so a pasted Google Maps coordinate lands near the landmark it belongs to.
 */
function geoFit(city: CityDef): GeoFit {
  const cached = fitCache.get(city.id);
  if (cached) {
    return cached;
  }
  const [lat0, lng0] = city.geo[0];
  const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180);
  const ky = 110.57;
  const M = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  const vx = [0, 0, 0];
  const vy = [0, 0, 0];
  for (const [la, ln, x, y] of city.geo) {
    const v = [(ln - lng0) * kx, (la - lat0) * ky, 1];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        M[i][j] += v[i] * v[j];
      }
      vx[i] += v[i] * x;
      vy[i] += v[i] * y;
    }
  }
  const fit: GeoFit = {
    lat0,
    lng0,
    kx,
    ky,
    px: solve3(M, vx),
    py: solve3(M, vy),
  };
  fitCache.set(city.id, fit);
  return fit;
}

/** Where a real coordinate falls on a town's map, in tiles (may be off-map). */
export function geoToTile(
  city: CityDef,
  lat: number,
  lng: number,
): { x: number; y: number } {
  const f = geoFit(city);
  const E = (lng - f.lng0) * f.kx;
  const N = (lat - f.lat0) * f.ky;
  return {
    x: f.px[0] * E + f.px[1] * N + f.px[2],
    y: f.py[0] * E + f.py[1] * N + f.py[2],
  };
}

export interface GeoMatch {
  city: CityDef;
  tile: { x: number; y: number };
  /** True when the point is on the map, else `outside` is the distance in tiles. */
  inside: boolean;
  outside: number;
}

/** The town whose map holds the point, or the nearest one. */
export function cityForGeo(
  cities: readonly CityDef[],
  lat: number,
  lng: number,
): GeoMatch | null {
  let best: GeoMatch | null = null;
  for (const city of cities) {
    const tile = geoToTile(city, lat, lng);
    const outside = Math.hypot(
      Math.max(0, -tile.x, tile.x - MAP_W),
      Math.max(0, -tile.y, tile.y - MAP_H),
    );
    if (!best || outside < best.outside) {
      best = { city, tile, inside: outside === 0, outside };
    }
  }
  return best;
}

const clamp = (v: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, v));

/**
 * A pin's position as fractions of the map: from its coordinates when it has
 * them (so the pin follows any later georeference fix), else as stored.
 */
export function pinPosition(
  city: CityDef,
  memory: { x: number; y: number; lat: number | null; lng: number | null },
): { x: number; y: number } {
  if (memory.lat == null || memory.lng == null) {
    return { x: memory.x, y: memory.y };
  }
  const t = geoToTile(city, memory.lat, memory.lng);
  return {
    x: clamp(t.x / MAP_W, 0.02, 0.98),
    y: clamp(t.y / MAP_H, 0.04, 0.98),
  };
}
