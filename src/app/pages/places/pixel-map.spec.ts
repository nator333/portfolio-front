import { CITIES, cityById } from "./cities";
import {
  MAP_H,
  MAP_W,
  TILE_PX,
  builtMap,
  cityForGeo,
  geoToTile,
  pinPosition,
  pinSprite,
  renderMap,
} from "./pixel-map";

describe("pixel-map", () => {
  it("builds a 48×32 tile world for every town", () => {
    for (const city of CITIES) {
      const m = builtMap(city);
      expect(m.t.length).toBe(MAP_W * MAP_H);
      // Every town has some water and some town.
      expect(Array.from(m.t).some((c) => c === 5 || c === 6)).toBe(true);
      expect(Array.from(m.t).some((c) => c === 8)).toBe(true);
    }
  });

  it("paints each town in every season at 8 px per tile", () => {
    for (const city of CITIES) {
      for (const season of ["spring", "summer", "autumn", "winter"] as const) {
        const canvas = renderMap(city, 0, season);
        expect(canvas.width).toBe(MAP_W * TILE_PX);
        expect(canvas.height).toBe(MAP_H * TILE_PX);
      }
    }
  });

  it("places each town's control points back within a few tiles", () => {
    for (const city of CITIES) {
      for (const [lat, lng, x, y] of city.geo) {
        const t = geoToTile(city, lat, lng);
        expect(Math.hypot(t.x - x, t.y - y)).toBeLessThan(7);
      }
    }
  });

  it("finds the town a coordinate belongs to", () => {
    expect(cityForGeo(CITIES, 35.6556, 139.339)?.city.id).toBe("hachioji");
    expect(cityForGeo(CITIES, 49.2734, -123.1038)?.city.id).toBe("vancouver");
    expect(cityForGeo(CITIES, 45.5579, -73.5515)?.city.id).toBe("montreal");
    expect(cityForGeo(CITIES, 35.6329, 139.8804)?.city.id).toBe("ichikawa");
    expect(cityForGeo(CITIES, 37.0666, 138.8809)?.city.id).toBe("minamiuonuma");
  });

  it("reports a far-away coordinate as outside every map", () => {
    const match = cityForGeo(CITIES, 48.8584, 2.2945);
    expect(match?.inside).toBe(false);
    expect(match?.outside).toBeGreaterThan(100);
  });

  it("derives a pin's position from its coordinates when it has them", () => {
    const hachioji = cityById("hachioji")!;
    const fromGeo = pinPosition(hachioji, {
      x: 0,
      y: 0,
      lat: 35.6556,
      lng: 139.339,
    });
    expect(fromGeo.x).toBeCloseTo(28 / MAP_W, 1);
    expect(fromGeo.y).toBeCloseTo(17 / MAP_H, 1);
    expect(
      pinPosition(hachioji, { x: 0.4, y: 0.6, lat: null, lng: null }),
    ).toEqual({ x: 0.4, y: 0.6 });
  });

  it("renders a data-url sprite per memory kind", () => {
    expect(pinSprite("home")).toMatch(/^data:image\/png;base64,/);
    expect(pinSprite("food")).not.toBe(pinSprite("home"));
  });
});
