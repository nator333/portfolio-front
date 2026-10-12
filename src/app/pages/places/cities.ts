/**
 * The five towns: each a 48×32 tile world (shapes softened with noise),
 * place-name labels, fixed landmark sprites, seasonal exceptions and the
 * control points that tie the map to real coordinates.
 *
 * North is up. Minamiuonuma, Hachioji and Ichikawa are drawn as pictures of
 * each town, and their control points absorb the distortion when a pin is
 * placed from a Google Maps link. Vancouver and Montréal are drawn true to
 * scale inside a real latitude/longitude frame (see `frame`), so a pasted
 * coordinate lands exactly where the drawing shows it.
 */
import {
  CityDef,
  GeoControlPoint,
  LANDMARK_SPRITES,
  Landmark,
  LandmarkKind,
  LabelClass,
  MAP_H,
  MAP_W,
  MapLabel,
  Point,
  TILE_PX,
  T,
} from "./pixel-map";

type LatLng = [number, number];

/**
 * A true-to-scale frame: the map spans this box of real coordinates, mapped
 * linearly onto the 48×32 tiles (pick the box so tiles come out square).
 * Shapes, landmarks and labels are written in latitude/longitude and placed
 * through it, and its corners are the town's geo control points, so the
 * Google Maps fit reproduces the drawing exactly.
 */
function frame(north: number, south: number, west: number, east: number) {
  const at = ([lat, lng]: LatLng): Point => [
    ((lng - west) / (east - west)) * MAP_W,
    ((north - lat) / (north - south)) * MAP_H,
  ];
  const geo: GeoControlPoint[] = [
    [north, west, 0, 0],
    [north, east, MAP_W, 0],
    [south, west, 0, MAP_H],
    [south, east, MAP_W, MAP_H],
  ];
  return {
    at,
    geo,
    /** A polyline or polygon given in real coordinates. */
    path: (...points: LatLng[]): Point[] => points.map(at),
    /** A landmark sprite centred on a real place. */
    landmark: (
      kind: LandmarkKind,
      place: LatLng,
      label: string,
      extra: Partial<Landmark> = {},
    ): Landmark => {
      const [x, y] = at(place);
      const sprite = LANDMARK_SPRITES[kind];
      return {
        kind,
        x: Math.round(x - sprite.w / TILE_PX / 2),
        y: Math.round(y - sprite.h / TILE_PX / 2),
        label,
        ...extra,
      };
    },
    /** A place-name label centred on a real place. */
    label: (text: string, place: LatLng, cls?: LabelClass): MapLabel => {
      const [x, y] = at(place);
      return cls ? [text, x, y, cls] : [text, x, y];
    },
  };
}

// Vancouver from Point Grey to Burnaby, the North Shore mountains to the
// Fraser: 28.3 × 18.9 km, 0.59 km a tile.
const VAN = frame(49.365, 49.195, -123.27, -122.88);

// Montréal from Côte-des-Neiges to Longueuil, Verdun to the Olympic Stadium:
// 15.9 × 10.6 km, 0.33 km a tile.
const MTL = frame(45.565, 45.47, -73.685, -73.481);

export const CITIES: readonly CityDef[] = [
  {
    id: "minamiuonuma",
    name: "Minamiuonuma",
    region: "Niigata, Japan",
    seed: 11,
    roofs: ["#4d5f86", "#7b3f35", "#5f6670"],
    // The Uono valley runs south-west to north-east: Shiozawa and the Ishiuchi
    // slopes lie down-valley, Urasa and Mt. Hakkai up-valley.
    build(m) {
      m.fill(T.grass);
      m.rect(9, -2, 37, 34, T.field, { r: 5 });
      m.when((x, y) => x + m.n(x, y) * 6 < 8, T.forest);
      m.when(
        (x, y, c) => c === T.forest && x + m.n(x, y, 2) * 4 < 4,
        T.mountain,
      );
      m.when((x, y) => x + m.n(x, y) * 7 > 34.5, T.forest);
      m.when((x, y) => x + m.n(x, y) * 7 > 37.5, T.mountain);
      m.when(
        (x, y, c) => c === T.mountain && x + m.n(x, y, 4) * 6 > 42.5,
        T.snowPeak,
      );
      m.ellipse(41, 9, 3.6, 3.4, T.snowPeak, { r: 0.6 });
      m.ellipse(34.5, 27.5, 2.2, 1.6, T.snowPeak, { r: 0.5 });
      m.ellipse(17, 29, 6, 3.5, T.forest, { r: 0.6 });
      m.ellipse(16, 30.5, 4, 2.2, T.mountain, { r: 0.4 });
      m.band(
        [
          [38, 18],
          [32, 17.5],
          [24.5, 17],
        ],
        1,
        T.river,
        { r: 0.3 },
      );
      m.band(
        [
          [26, 33],
          [25, 26],
          [23.3, 21],
          [24, 16.5],
          [24.5, 12],
          [27, 7],
          [30, -1],
        ],
        1.7,
        T.river,
        { r: 0.4 },
      );
      m.ellipse(28, 14.6, 3.6, 2.6, T.urban, {
        r: 0.8,
        on: [T.field, T.grass],
      });
      m.ellipse(26.6, 23.5, 2.6, 1.8, T.urban, {
        r: 0.7,
        on: [T.field, T.grass],
      });
      m.ellipse(32, 4.5, 2.6, 1.8, T.urban, { r: 0.7, on: [T.field, T.grass] });
      m.scatter(T.urban, 0.05, [T.field]);
      m.road([
        [30, 32],
        [29.5, 24],
        [30, 16],
        [29, 8],
        [32, 0],
      ]);
      m.road([
        [30, 14],
        [14, 14],
      ]);
      m.road([
        [30, 12],
        [38, 10],
      ]);
      m.rail([
        [24, 32],
        [27, 24],
        [27.5, 16],
        [28, 10],
        [30, 6],
        [31, 0],
      ]);
    },
    labels: [
      ["Uono River", 21, 11, "water"],
      ["Mt. Hakkai", 43, 13.5, "mtn"],
      ["Muikamachi", 33.5, 20],
      ["Shiozawa", 29.7, 24.6],
      ["Urasa", 35, 3.6],
      ["Joetsu Line", 25.4, 29.2, "minor"],
      ["Echigo Sanzan", 44, 24, "mtn minor"],
      ["Uonuma Hills", 4, 16, "mtn minor"],
    ],
    landmarks: [
      { kind: "ski", x: 18, y: 28, label: "Ishiuchi Maruyama" },
      { kind: "ski", x: 35, y: 10, label: "Hakkaisan Ski" },
      { kind: "mall", x: 31, y: 13, label: "AEON Muikamachi" },
      { kind: "station", x: 27, y: 15, label: "Muikamachi Sta." },
      { kind: "station", x: 31, y: 4, label: "Urasa Sta." },
    ],
    geo: [
      [37.0666, 138.8809, 28, 16],
      [37.1626, 138.9196, 32, 5],
      [36.956, 138.806, 19, 29],
      [37.108, 138.964, 36, 11],
      [37.037, 138.848, 26.5, 23],
    ],
  },
  {
    id: "hachioji",
    name: "Hachioji",
    region: "Tokyo, Japan",
    seed: 23,
    roofs: ["#5a5e78", "#8a4a3a", "#3f6b6b"],
    // Only a few snow days a year: dormant tan ground, dark evergreens, snow on
    // the Okutama ridges only, streets left bare.
    paint: {
      winter: {
        snow: false,
        snowPeaks: true,
        grass: "#a9a179",
        grassD: "#8d866a",
        grassL: "#c4bb92",
        park: "#a39c78",
        forest: "#6b6850",
        crown: "#355a30",
        crownL: "#4d7a45",
        field: "#b7ab80",
        fieldD: "#9a9070",
        fieldL: "#cfc49c",
        mtn: "#6a5a48",
        mtnL: "#8c7a62",
        mtnD: "#4f4336",
        water: "#2a5a9c",
        waterL: "#4f82c4",
        foam: "#9fc2e6",
        flowerY: "#a39c78",
        flowerP: "#a39c78",
        pave: "#b9aa8c",
        dtGround: "#8e8f9c",
        road: "#dcc792",
        roadE: "#a88f5c",
      },
    },
    build(m) {
      m.fill(T.grass);
      m.rect(11, 7, 50, 25, T.urban, { r: 4 });
      m.when((x, y) => y + m.n(x, y) * 6 < 5.5, T.forest);
      m.when((x, y) => x + m.n(x, y, 2) * 6 < 11, T.forest);
      m.when(
        (x, y, c) => c === T.forest && x + m.n(x, y, 4) * 5 < 6.5,
        T.mountain,
      );
      m.ellipse(5, 21.5, 3, 2.6, T.mountain, { r: 0.5 });
      m.when((x, y) => y + m.n(x, y, 6) * 6 > 25.5, T.forest);
      m.ellipse(18, 27.6, 2.6, 1.6, T.campus, { on: [T.forest, T.grass] });
      m.ellipse(33, 28.5, 2.4, 1.5, T.campus, { on: [T.forest, T.grass] });
      m.ellipse(42, 26.8, 2.2, 1.4, T.campus, { on: [T.forest, T.grass] });
      m.ellipse(28.5, 14.5, 4.2, 2.4, T.downtown, { on: [T.urban] });
      m.band(
        [
          [7, 21],
          [13, 16.5],
          [19, 12.2],
        ],
        1,
        T.river,
        { r: 0.3 },
      );
      m.band(
        [
          [9, 12],
          [18, 12],
          [26, 10.8],
          [34, 10.6],
          [42, 11.6],
          [49, 12.6],
        ],
        1.4,
        T.river,
        { r: 0.4 },
      );
      m.road([
        [0, 17],
        [12, 16],
        [20, 14],
        [48, 13.5],
      ]);
      m.road([
        [32, 0],
        [31, 16],
        [30, 32],
      ]);
      m.rail([
        [0, 21],
        [10, 20],
        [18, 17],
        [28, 16],
        [38, 16],
        [48, 15.5],
      ]);
      m.rail([
        [28, 16],
        [34, 20],
        [40, 25],
        [46, 32],
      ]);
    },
    labels: [
      ["Mt. Takao", 4, 27.5, "mtn"],
      ["Asakawa River", 37, 9.6, "water"],
      ["Tama Hills", 24.5, 30.2, "mtn minor"],
      ["Koshu Kaido", 16, 13.6, "minor"],
      ["Jinba / Oku-Takao", 4, 6, "mtn minor"],
      ["Route 16", 34.4, 4.6, "minor"],
    ],
    landmarks: [
      { kind: "station", x: 27, y: 16, label: "JR Hachioji Sta." },
      { kind: "station", x: 30, y: 13, label: "Keio-Hachioji Sta." },
      { kind: "university", x: 24, y: 3, label: "Soka University" },
      { kind: "station", x: 9, y: 19, label: "Takao Sta." },
      { kind: "station", x: 7, y: 23, label: "Takaosanguchi Sta." },
    ],
    geo: [
      [35.6556, 139.339, 28, 17],
      [35.6598, 139.344, 30, 15],
      [35.6423, 139.2822, 10, 20],
      [35.6325, 139.2698, 8, 24],
      [35.6914, 139.3186, 25, 4],
    ],
  },
  {
    id: "ichikawa",
    name: "Ichikawa",
    region: "Chiba, Japan",
    seed: 37,
    roofs: ["#6b6e80", "#94503f", "#4f6b8c"],
    // On Tokyo Bay: winters are dry and almost never white.
    paint: {
      winter: {
        snow: false,
        grass: "#a9a179",
        grassD: "#8d866a",
        grassL: "#c4bb92",
        park: "#a39c78",
        forest: "#6b6850",
        crown: "#355a30",
        crownL: "#4d7a45",
        field: "#b7ab80",
        fieldD: "#9a9070",
        fieldL: "#cfc49c",
        water: "#2a5a9c",
        waterL: "#4f82c4",
        foam: "#9fc2e6",
        flowerY: "#a39c78",
        flowerP: "#a39c78",
        pave: "#b9aa8c",
        dtGround: "#8e8f9c",
        road: "#dcc792",
        roadE: "#a88f5c",
        sand: "#d8cba0",
        sandD: "#bcae82",
      },
    },
    // The Edo River on the west, the bay to the south; Urayasu (Disneyland)
    // sits south-west between the old Edo River and the floodway.
    build(m) {
      m.fill(T.urban);
      m.band(
        [
          [7, -1],
          [7, 10],
          [8, 18],
          [9.2, 26],
          [10, 33],
        ],
        5.6,
        T.grass,
        { r: 0.5 },
      );
      m.band(
        [
          [7, -1],
          [7, 10],
          [8, 18],
          [9.2, 26],
          [10, 33],
        ],
        2.6,
        T.river,
        { r: 0.4 },
      );
      m.band(
        [
          [8, 18],
          [4, 22],
          [2, 27],
          [1.5, 33],
        ],
        1.5,
        T.river,
        { r: 0.3 },
      );
      m.poly(
        [
          [-1, 27.5],
          [20, 26.5],
          [49, 24],
          [49, 33],
          [-1, 33],
        ],
        T.water,
        { r: 1 },
      );
      m.ellipse(11, 4, 3.6, 3, T.forest, { r: 0.6, on: [T.urban] });
      m.ellipse(10.6, 2, 2, 1.4, T.park, { on: [T.forest] });
      m.rect(29, -1, 49, 7.5, T.orchard, { r: 4 });
      m.ellipse(13, 12.3, 2.2, 1.4, T.downtown, { on: [T.urban] });
      m.ellipse(24, 12.3, 2.6, 1.5, T.downtown, { on: [T.urban] });
      m.ellipse(36, 17, 2.2, 1.6, T.park, { on: [T.urban] });
      m.road([
        [0, 11],
        [48, 11],
      ]);
      m.road([
        [26, 0],
        [27, 23],
      ]);
      m.rail([
        [0, 9],
        [12, 9.6],
        [24, 9.6],
        [48, 8.8],
      ]);
      m.rail([
        [0, 13],
        [48, 13],
      ]);
      m.rail([
        [0, 20.5],
        [16, 20],
        [30, 19],
        [48, 18],
      ]);
      m.rail([
        [0, 26.4],
        [12, 25.6],
        [20, 24],
        [48, 22],
      ]);
    },
    labels: [
      ["Edo River", 4, 6, "water"],
      ["Tokyo Bay", 32, 29.5, "water"],
      ["Konodai", 14.6, 4.6],
      ["Pear orchards", 38, 3.6],
      ["Tokyo", 2.4, 15, "minor"],
      ["Keiyo Line", 31, 23.4, "minor"],
    ],
    landmarks: [
      { kind: "themepark", x: 4, y: 23, label: "Tokyo Disneyland" },
      { kind: "station", x: 12, y: 12, label: "Ichikawa Sta." },
      { kind: "station", x: 23, y: 12, label: "Motoyawata Sta." },
      { kind: "station", x: 15, y: 19, label: "Gyotoku Sta." },
    ],
    geo: [
      [35.729, 139.9078, 13, 13],
      [35.7212, 139.928, 24, 13],
      [35.6833, 139.915, 16, 20],
      [35.6329, 139.8804, 5.5, 24],
      [35.743, 139.905, 14, 5],
    ],
  },
  {
    id: "vancouver",
    name: "Vancouver",
    region: "British Columbia, Canada",
    seed: 51,
    roofs: ["#a0523d", "#3d5a80", "#6f6250"],
    // Wet winters, not white: a dark rain-soaked green with snow only on the
    // North Shore peaks.
    paint: {
      winter: {
        snow: false,
        snowPeaks: true,
        grass: "#3d7a36",
        grassD: "#2d5f2a",
        grassL: "#4f9445",
        park: "#3f8238",
        forest: "#2b5a28",
        crown: "#234b22",
        crownL: "#36703a",
        field: "#4e8a40",
        fieldD: "#3c6e33",
        fieldL: "#5f9c4f",
        mtn: "#6a5a48",
        mtnL: "#8c7a62",
        mtnD: "#4f4336",
        water: "#2a5a9c",
        waterL: "#4f82c4",
        foam: "#9fc2e6",
        sand: "#cfc3a2",
        sandD: "#b0a482",
        pave: "#a39a8c",
        dtGround: "#7f8390",
        road: "#c9b887",
        roadE: "#8f7a52",
        flowerY: "#3f8238",
        flowerP: "#3f8238",
      },
    },
    build(m) {
      m.fill(T.water);
      // North Shore: forest rising to the mountains, West and North Vancouver
      // along the water.
      m.poly(
        VAN.path(
          [49.38, -123.29],
          [49.38, -122.86],
          [49.308, -122.86],
          [49.306, -122.9],
          [49.304, -122.95],
          [49.302, -122.99],
          [49.301, -123.025],
          [49.305, -123.045],
          [49.31, -123.083],
          [49.318, -123.12],
          [49.323, -123.139],
          [49.327, -123.16],
          [49.331, -123.2],
          [49.336, -123.24],
          [49.339, -123.29],
        ),
        T.forest,
        { r: 0.6 },
      );
      m.when(
        (x, y, c) => c === T.forest && y + m.n(x, y) * 4 < 3.4,
        T.mountain,
      );
      m.when(
        (x, y, c) => c === T.mountain && y + m.n(x, y, 2) * 3 < 1.4,
        T.snowPeak,
      );
      m.poly(
        VAN.path(
          [49.329, -123.2],
          [49.334, -123.1],
          [49.331, -123.02],
          [49.318, -122.97],
          [49.304, -122.98],
          [49.302, -123.03],
          [49.31, -123.083],
          [49.322, -123.137],
          [49.327, -123.16],
        ),
        T.urban,
        { r: 0.5, on: [T.forest] },
      );
      // The mainland: Point Grey, Kitsilano, downtown's peninsula, east to
      // Burnaby and south to the Fraser and Richmond.
      m.poly(
        VAN.path(
          [49.274, -123.264],
          [49.278, -123.225],
          [49.272, -123.2],
          [49.274, -123.17],
          [49.276, -123.155],
          [49.278, -123.146],
          [49.274, -123.138],
          [49.271, -123.134],
          [49.268, -123.12],
          [49.27, -123.105],
          [49.2734, -123.1],
          [49.276, -123.108],
          [49.276, -123.12],
          [49.279, -123.135],
          [49.282, -123.141],
          [49.286, -123.145],
          [49.29, -123.15],
          [49.296, -123.156],
          [49.303, -123.157],
          [49.31, -123.152],
          [49.3135, -123.1414],
          [49.307, -123.126],
          [49.3, -123.118],
          [49.292, -123.124],
          [49.289, -123.11],
          [49.286, -123.095],
          [49.287, -123.06],
          [49.289, -123.03],
          [49.292, -123.02],
          [49.288, -122.99],
          [49.29, -122.95],
          [49.292, -122.86],
          [49.18, -122.86],
          [49.18, -123.205],
          [49.215, -123.217],
          [49.235, -123.228],
          [49.25, -123.255],
          [49.262, -123.263],
        ),
        T.urban,
        { r: 0.4 },
      );
      // The Fraser's north arm, with Richmond's fields beyond.
      m.band(
        VAN.path(
          [49.217, -123.225],
          [49.208, -123.18],
          [49.205, -123.14],
          [49.204, -123.1],
          [49.202, -123.06],
          [49.199, -123.02],
          [49.197, -122.97],
          [49.193, -122.86],
        ),
        1.4,
        T.river,
        { r: 0.3 },
      );
      m.when((x, y, c) => c === T.urban && y > 31, T.field);
      m.poly(
        VAN.path(
          [49.3135, -123.142],
          [49.31, -123.153],
          [49.297, -123.156],
          [49.292, -123.148],
          [49.293, -123.128],
          [49.3, -123.12],
          [49.307, -123.128],
        ),
        T.forest,
        { r: 0.3, on: [T.urban] },
      );
      m.poly(
        VAN.path(
          [49.29, -123.128],
          [49.287, -123.1],
          [49.277, -123.105],
          [49.276, -123.125],
          [49.283, -123.137],
        ),
        T.downtown,
        { on: [T.urban] },
      );
      // Pacific Spirit's forest and the UBC campus on Point Grey.
      m.poly(
        VAN.path(
          [49.272, -123.222],
          [49.268, -123.19],
          [49.235, -123.19],
          [49.23, -123.215],
          [49.245, -123.235],
        ),
        T.forest,
        { r: 0.4, on: [T.urban] },
      );
      m.poly(
        VAN.path(
          [49.274, -123.26],
          [49.27, -123.235],
          [49.253, -123.233],
          [49.248, -123.25],
          [49.262, -123.262],
        ),
        T.campus,
        { on: [T.urban, T.forest] },
      );
      m.ellipse(...VAN.at([49.2418, -123.1126]), 1.3, 1, T.park, {
        on: [T.urban],
      });
      m.ellipse(...VAN.at([49.2565, -123.064]), 1, 0.8, T.park, {
        on: [T.urban],
      });
      m.ellipse(...VAN.at([49.229, -123.017]), 1.6, 1.2, T.park, {
        on: [T.urban],
      });
      m.ellipse(...VAN.at([49.2265, -123.0]), 1.3, 0.9, T.downtown, {
        on: [T.urban],
      });
      // Burnaby Mountain at the east edge.
      m.ellipse(...VAN.at([49.279, -122.917]), 2.6, 2.2, T.forest, {
        r: 0.5,
        on: [T.urban],
      });
      m.beach();
      // Granville, Cambie, Main and Commercial; Broadway, 41st and Hastings;
      // the Lions Gate causeway and the Second Narrows.
      m.road(
        VAN.path(
          [49.285, -123.118],
          [49.276, -123.132],
          [49.265, -123.139],
          [49.206, -123.139],
        ),
      );
      m.road(
        VAN.path([49.278, -123.115], [49.266, -123.115], [49.207, -123.117]),
      );
      m.road(VAN.path([49.285, -123.1], [49.205, -123.101]));
      m.road(VAN.path([49.284, -123.069], [49.222, -123.069]));
      m.road(
        VAN.path(
          [49.264, -123.245],
          [49.263, -123.1],
          [49.262, -123.02],
          [49.266, -122.88],
        ),
      );
      m.road(VAN.path([49.234, -123.215], [49.234, -123.02]));
      m.road(VAN.path([49.285, -123.11], [49.281, -123.02], [49.281, -122.88]));
      m.road(
        VAN.path(
          [49.291, -123.134],
          [49.3, -123.138],
          [49.314, -123.139],
          [49.326, -123.139],
        ),
      );
      m.road(VAN.path([49.289, -123.025], [49.304, -123.026]));
      // SkyTrain: the Expo Line east to Metrotown, the Canada Line south.
      m.rail(
        VAN.path(
          [49.2856, -123.1116],
          [49.273, -123.1],
          [49.2626, -123.0692],
          [49.238, -123.032],
          [49.226, -123.004],
          [49.204, -122.912],
        ),
      );
      m.rail(
        VAN.path(
          [49.2856, -123.1116],
          [49.275, -123.121],
          [49.266, -123.112],
          [49.208, -123.114],
        ),
      );
    },
    labels: [
      VAN.label("North Shore", [49.357, -123.08], "mtn"),
      VAN.label("Burrard Inlet", [49.296, -123.06], "water"),
      VAN.label("Stanley Park", [49.307, -123.153]),
      VAN.label("Downtown", [49.283, -123.138]),
      VAN.label("English Bay", [49.3, -123.22], "water"),
      VAN.label("Kitsilano", [49.267, -123.168]),
      VAN.label("Pacific Spirit", [49.243, -123.205], "mtn minor"),
      VAN.label("Mount Pleasant", [49.251, -123.1], "minor"),
      VAN.label("Commercial Dr", [49.245, -123.055], "minor"),
      VAN.label("Burnaby", [49.248, -122.97], "minor"),
      VAN.label("Fraser River", [49.2055, -123.05], "water"),
    ],
    landmarks: [
      VAN.landmark("port", [49.2888, -123.1111], "Canada Place", {
        labelAbove: true,
      }),
      VAN.landmark("dome", [49.2734, -123.1038], "Science World"),
      VAN.landmark("university", [49.2606, -123.246], "UBC"),
    ],
    geo: VAN.geo,
  },
  {
    id: "montreal",
    name: "Montréal",
    region: "Québec, Canada",
    seed: 67,
    roofs: ["#8c4434", "#5a4f6e", "#3f6a5a"],
    // No cherry blossoms on Mont Royal: spring is fresh light green. Winter is
    // deep snow and the rivers freeze over.
    paint: {
      spring: { blossom: 0, crown: "#5aa048", crownL: "#8ccb64" },
      winter: { frozen: true },
    },
    // True north: the Saint Lawrence runs up the east side, so the city's own
    // "north" (along Saint-Laurent Boulevard) points north-west here.
    build(m) {
      m.fill(T.urban);
      // The Saint Lawrence between the island and Longueuil.
      m.poly(
        MTL.path(
          [45.46, -73.557],
          [45.475, -73.549],
          [45.485, -73.546],
          [45.497, -73.543],
          [45.503, -73.549],
          [45.51, -73.546],
          [45.52, -73.545],
          [45.535, -73.539],
          [45.548, -73.532],
          [45.56, -73.525],
          [45.575, -73.518],
          [45.575, -73.488],
          [45.555, -73.493],
          [45.535, -73.503],
          [45.52, -73.51],
          [45.505, -73.512],
          [45.49, -73.509],
          [45.475, -73.505],
          [45.46, -73.503],
        ),
        T.water,
        { r: 0.5 },
      );
      // Parc Jean-Drapeau: Île Sainte-Hélène and Île Notre-Dame.
      m.poly(
        MTL.path(
          [45.512, -73.538],
          [45.522, -73.533],
          [45.525, -73.527],
          [45.516, -73.524],
          [45.509, -73.53],
        ),
        T.park,
        { r: 0.3 },
      );
      m.poly(
        MTL.path(
          [45.509, -73.531],
          [45.505, -73.521],
          [45.497, -73.522],
          [45.5, -73.531],
        ),
        T.park,
        { r: 0.3 },
      );
      // Rivière des Prairies in the north-west corner, Laval beyond.
      m.poly(
        MTL.path([45.58, -73.7], [45.58, -73.645], [45.546, -73.7]),
        T.grass,
        { r: 0.4 },
      );
      m.band(
        MTL.path(
          [45.544, -73.7],
          [45.553, -73.675],
          [45.561, -73.663],
          [45.572, -73.648],
        ),
        1.6,
        T.river,
        { r: 0.3 },
      );
      // Mont Royal with its cemeteries, and the summit.
      m.poly(
        MTL.path(
          [45.497, -73.597],
          [45.502, -73.583],
          [45.508, -73.579],
          [45.514, -73.588],
          [45.515, -73.606],
          [45.508, -73.616],
          [45.5, -73.612],
        ),
        T.forest,
        { r: 0.5, on: [T.urban] },
      );
      m.ellipse(...MTL.at([45.5055, -73.59]), 1.8, 1.4, T.mountain, {
        r: 0.3,
        on: [T.forest],
      });
      m.poly(
        MTL.path(
          [45.49, -73.58],
          [45.497, -73.585],
          [45.504, -73.577],
          [45.509, -73.566],
          [45.506, -73.56],
          [45.499, -73.561],
          [45.493, -73.57],
        ),
        T.downtown,
        { on: [T.urban] },
      );
      // The Old Port's promenade, Parc La Fontaine, Jarry, and the Botanical
      // Garden beside the Olympic Stadium.
      m.band(MTL.path([45.5, -73.552], [45.512, -73.5465]), 0.8, T.park, {
        on: [T.urban],
      });
      m.ellipse(...MTL.at([45.5268, -73.5692]), 1.3, 1, T.park, {
        on: [T.urban],
      });
      m.ellipse(...MTL.at([45.5345, -73.6285]), 1.2, 0.9, T.park, {
        on: [T.urban],
      });
      m.ellipse(...MTL.at([45.5605, -73.5625]), 2.6, 1.4, T.park, {
        on: [T.urban],
      });
      m.band(
        MTL.path(
          [45.46, -73.632],
          [45.469, -73.606],
          [45.478, -73.584],
          [45.486, -73.566],
          [45.494, -73.555],
          [45.497, -73.551],
        ),
        0.8,
        T.river,
      );
      // Sherbrooke, Saint-Laurent and Décarie; the Jacques Cartier and
      // Victoria bridges.
      m.road(
        MTL.path(
          [45.47, -73.628],
          [45.4885, -73.5875],
          [45.5045, -73.576],
          [45.5115, -73.5685],
          [45.5257, -73.56],
          [45.5536, -73.545],
          [45.566, -73.54],
        ),
      );
      m.road(
        MTL.path(
          [45.506, -73.554],
          [45.511, -73.564],
          [45.523, -73.59],
          [45.536, -73.616],
          [45.548, -73.64],
          [45.566, -73.668],
        ),
      );
      m.road(
        MTL.path(
          [45.47, -73.603],
          [45.49, -73.63],
          [45.515, -73.656],
          [45.53, -73.672],
        ),
      );
      m.road(
        MTL.path(
          [45.5195, -73.549],
          [45.5205, -73.54],
          [45.522, -73.53],
          [45.525, -73.512],
          [45.527, -73.5],
        ),
      );
      m.road(
        MTL.path([45.4868, -73.5452], [45.49, -73.525], [45.4925, -73.508]),
      );
    },
    labels: [
      MTL.label("Mont Royal", [45.511, -73.597], "mtn"),
      MTL.label("Centre-ville", [45.494, -73.574]),
      MTL.label("Vieux-Montréal", [45.5068, -73.555]),
      MTL.label("Plateau", [45.523, -73.578]),
      MTL.label("Mile End", [45.527, -73.604]),
      MTL.label("Outremont", [45.519, -73.616], "minor"),
      MTL.label("Fleuve Saint-Laurent", [45.48, -73.525], "water"),
      MTL.label("Rivière des Prairies", [45.5625, -73.652], "water minor"),
      MTL.label("Parc Jean-Drapeau", [45.497, -73.527], "minor"),
      MTL.label("Canal de Lachine", [45.475, -73.583], "water minor"),
      MTL.label("Longueuil", [45.54, -73.497], "minor"),
    ],
    landmarks: [
      MTL.landmark("stadium", [45.5579, -73.5515], "Olympic Stadium"),
      MTL.landmark("university", [45.5048, -73.5772], "McGill University"),
      MTL.landmark("dome", [45.5141, -73.5313], "Biosphère"),
    ],
    geo: MTL.geo,
  },
];

export function cityById(id: string): CityDef | undefined {
  return CITIES.find((c) => c.id === id);
}
