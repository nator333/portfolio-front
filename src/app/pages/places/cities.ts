/**
 * The five towns: each a hand-built 48×32 tile world (shapes softened with
 * noise), place-name labels, fixed landmark sprites, seasonal exceptions and
 * the control points that tie the stylised map to real coordinates.
 *
 * North is up. Positions are rough: the maps are drawn to read as a picture
 * of each town, not as cartography — the geo control points absorb the
 * distortion when a pin is placed from a Google Maps link.
 */
import { CityDef, T } from "./pixel-map";

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
      m.poly(
        [
          [-1, -1],
          [49, -1],
          [49, 6.2],
          [36, 6.6],
          [26, 5.6],
          [16, 5.1],
          [8, 5.6],
          [-1, 5],
        ],
        T.forest,
        { r: 0.8 },
      );
      m.when(
        (x, y, c) => c === T.forest && y + m.n(x, y) * 4 < 3.2,
        T.mountain,
      );
      m.when(
        (x, y, c) => c === T.mountain && y + m.n(x, y, 2) * 4 < 1.6,
        T.snowPeak,
      );
      m.ellipse(24, 4.4, 7.5, 1, T.urban, { on: [T.forest] });
      m.poly(
        [
          [-1, 15],
          [6, 14],
          [13, 15.6],
          [24, 14.2],
          [24, 8.3],
          [49, 8.3],
          [49, 33],
          [-1, 33],
        ],
        T.urban,
        { r: 0.8 },
      );
      m.poly(
        [
          [8, 7.6],
          [13, 6.4],
          [20, 7.6],
          [24, 8.3],
          [26, 10],
          [25, 13.3],
          [19, 13.4],
          [14, 13],
          [10, 11],
        ],
        T.urban,
        { r: 0.5 },
      );
      m.band(
        [
          [12, 14.2],
          [18, 14.4],
          [24.5, 13.9],
        ],
        1.1,
        T.water,
      );
      m.ellipse(11.3, 8.6, 3.6, 2.4, T.forest, { r: 0.4, on: [T.urban] });
      m.ellipse(19.4, 10.6, 4.4, 2.5, T.downtown, { on: [T.urban] });
      m.ellipse(4.5, 21.5, 3.6, 4.2, T.forest, { r: 0.5, on: [T.urban] });
      m.ellipse(2.4, 16.6, 2.2, 1.5, T.campus, { on: [T.urban, T.forest] });
      m.ellipse(23.6, 21.2, 1.6, 1.1, T.park, { on: [T.urban] });
      m.ellipse(44, 20, 2, 2.4, T.park, { on: [T.urban] });
      m.band(
        [
          [-1, 29.2],
          [16, 29.7],
          [32, 29],
          [49, 28],
        ],
        1.9,
        T.river,
        { r: 0.3 },
      );
      m.when((x, y, c) => c === T.urban && y > 30, T.field);
      m.beach();
      m.road([
        [15, 8],
        [15, 29],
      ]);
      m.road([
        [21, 10],
        [21, 28],
      ]);
      m.road([
        [27, 9],
        [27, 28],
      ]);
      m.road([
        [34, 9],
        [34, 28],
      ]);
      m.road([
        [4, 18],
        [48, 18],
      ]);
      m.road([
        [6, 24],
        [48, 24],
      ]);
      m.road([
        [24, 10],
        [48, 10],
      ]);
      m.road([
        [11, 10],
        [11, 6],
        [12, 3],
      ]);
      m.rail([
        [20, 9],
        [25, 12],
        [30, 15],
        [40, 16],
        [48, 17],
      ]);
    },
    labels: [
      ["North Shore", 30, 2.2, "mtn"],
      ["Burrard Inlet", 39, 7.4, "water"],
      ["Stanley Park", 10.4, 7.4],
      ["Downtown", 19.6, 12.2],
      ["English Bay", 4.6, 10.6, "water"],
      ["False Creek", 19.5, 15.1, "water minor"],
      ["Kitsilano", 10, 16.8],
      ["Mount Pleasant", 24.5, 16.3, "minor"],
      ["Commercial Dr", 37.5, 21.2, "minor"],
      ["Fraser River", 30, 31, "water"],
    ],
    landmarks: [
      { kind: "airport", x: 13, y: 30, label: "YVR Airport", labelAbove: true },
      { kind: "dome", x: 25, y: 12, label: "Science World" },
      { kind: "port", x: 19, y: 7, label: "Canada Place" },
      { kind: "university", x: 3, y: 19, label: "UBC" },
    ],
    geo: [
      [49.2888, -123.1111, 20, 8],
      [49.2734, -123.1038, 26, 13],
      [49.2606, -123.246, 4, 20],
      [49.1947, -123.1792, 14.5, 31],
      [49.275, -123.155, 10, 16],
      [49.296, -123.14, 12, 8.5],
    ],
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
    build(m) {
      m.fill(T.water);
      m.poly(
        [
          [-1, -1],
          [22, -1],
          [-1, 3],
        ],
        T.grass,
        { r: 0.6 },
      );
      m.poly(
        [
          [-1, 6.5],
          [14, 4.2],
          [30, 1.6],
          [49, 0.4],
          [49, 8],
          [40, 14],
          [34, 19],
          [28, 25],
          [18, 29.2],
          [-1, 30.5],
        ],
        T.urban,
        { r: 0.8 },
      );
      m.poly(
        [
          [49, 16],
          [49, 33],
          [25, 33],
          [36, 24],
        ],
        T.urban,
        { r: 0.8 },
      );
      m.ellipse(20, 14, 4.6, 3.6, T.forest, { r: 0.5, on: [T.urban] });
      m.ellipse(19.8, 13.4, 2.6, 2, T.mountain, { r: 0.3, on: [T.forest] });
      m.ellipse(25, 19.4, 3.4, 2.3, T.downtown, { on: [T.urban] });
      m.ellipse(28.6, 12.6, 1.6, 1.1, T.park, { on: [T.urban] });
      m.ellipse(35.2, 22.2, 1.6, 1.2, T.park);
      m.band(
        [
          [30.5, 24.8],
          [33, 21.5],
        ],
        0.8,
        T.park,
        { on: [T.urban] },
      );
      m.band(
        [
          [2, 28.4],
          [14, 25.6],
          [24, 24.6],
          [28.5, 25],
        ],
        0.8,
        T.river,
      );
      m.when((x, y, c) => c === T.urban && x + y * 1.2 > 79, T.grass);
      m.road([
        [2, 24],
        [44, 8],
      ]);
      m.road([
        [25, 25],
        [27, 0],
      ]);
      m.road([
        [31, 18],
        [35, 21],
        [43, 21],
      ]);
      m.road([
        [10, 26],
        [10, 4],
      ]);
    },
    labels: [
      ["Mont Royal", 20, 11.6, "mtn"],
      ["Centre-ville", 25, 22.2],
      ["Vieux-Montréal", 28.4, 26.6],
      ["Plateau", 31, 11],
      ["Mile End", 22.6, 6.6],
      ["Fleuve Saint-Laurent", 41, 26.4, "water"],
      ["Rivière des Prairies", 10.5, 2.6, "water minor"],
      ["Parc Jean-Drapeau", 39, 19.6, "minor"],
      ["Canal de Lachine", 10, 24.4, "water minor"],
      ["Longueuil", 44, 29.6, "minor"],
    ],
    landmarks: [
      { kind: "airport", x: 3, y: 16, label: "YUL Airport" },
      { kind: "stadium", x: 41, y: 4, label: "Olympic Stadium" },
      { kind: "university", x: 22, y: 17, label: "McGill University" },
      { kind: "dome", x: 34, y: 21, label: "Biosphère" },
    ],
    geo: [
      [45.5041, -73.5747, 23, 18],
      [45.4578, -73.7498, 4.5, 17],
      [45.5579, -73.5515, 42, 5],
      [45.5141, -73.5313, 35, 22],
      [45.5077, -73.5533, 28.5, 26],
      [45.5225, -73.595, 23, 7],
    ],
  },
];

export function cityById(id: string): CityDef | undefined {
  return CITIES.find((c) => c.id === id);
}
