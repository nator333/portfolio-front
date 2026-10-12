import {
  Memory,
  inSeason,
  mapsUrlFor,
  parseMapsLink,
  seasonOf,
} from "./places-data";

const memory: Memory = {
  id: "m_1",
  city: "vancouver",
  x: 0.2,
  y: 0.3,
  name: "Stanley Park seawall",
  kind: "play",
  period: "",
  text: "",
  seasons: ["summer", "autumn"],
  photos: [],
  mapsUrl: "",
  lat: 49.3,
  lng: -123.14,
  createdAt: 1,
};

describe("seasonOf", () => {
  it("uses meteorological seasons", () => {
    expect(seasonOf(new Date(2026, 0, 15))).toBe("winter");
    expect(seasonOf(new Date(2026, 2, 1))).toBe("spring");
    expect(seasonOf(new Date(2026, 7, 31))).toBe("summer");
    expect(seasonOf(new Date(2026, 9, 10))).toBe("autumn");
    expect(seasonOf(new Date(2026, 11, 1))).toBe("winter");
  });
});

describe("inSeason", () => {
  it("shows a memory with no seasons all year", () => {
    expect(inSeason({ ...memory, seasons: [] }, "winter")).toBe(true);
  });

  it("hides a seasonal memory outside its seasons", () => {
    expect(inSeason(memory, "summer")).toBe(true);
    expect(inSeason(memory, "winter")).toBe(false);
  });
});

describe("mapsUrlFor", () => {
  it("prefers the pasted link", () => {
    const url = "https://www.google.com/maps/place/x/@49.3,-123.14,15z";
    expect(mapsUrlFor({ ...memory, mapsUrl: url })).toBe(url);
  });

  it("falls back to a search for the coordinates", () => {
    expect(mapsUrlFor(memory)).toBe(
      "https://www.google.com/maps/search/?api=1&query=49.3,-123.14",
    );
  });

  it("is empty for a hand-placed pin", () => {
    expect(mapsUrlFor({ mapsUrl: "", lat: null, lng: null })).toBe("");
  });
});

describe("parseMapsLink", () => {
  it("reads the place's own coordinates and name from a place link", () => {
    const link =
      "https://www.google.com/maps/place/Hachi%C5%8Dji+Station/@35.6556,139.339,17z/data=!3m1!4b1!4m6!3m5!8m2!3d35.6556!4d139.3390";
    expect(parseMapsLink(link)).toEqual({
      lat: 35.6556,
      lng: 139.339,
      name: "Hachiōji Station",
    });
  });

  it("reads q=, ll= and query= links", () => {
    expect(
      parseMapsLink("https://www.google.com/maps?q=37.0666,138.8809"),
    ).toEqual({
      lat: 37.0666,
      lng: 138.8809,
      name: "",
    });
    expect(
      parseMapsLink("https://maps.google.com/?ll=49.2734,-123.1038&z=15"),
    ).toEqual({
      lat: 49.2734,
      lng: -123.1038,
      name: "",
    });
    expect(
      parseMapsLink(
        "https://www.google.com/maps/search/?api=1&query=45.5579%2C-73.5515",
      ),
    ).toEqual({ lat: 45.5579, lng: -73.5515, name: "" });
  });

  it("accepts a bare 'lat, lng'", () => {
    expect(parseMapsLink("35.6329, 139.8804")).toEqual({
      lat: 35.6329,
      lng: 139.8804,
      name: "",
    });
  });

  it("flags short links, which carry no coordinates", () => {
    expect(parseMapsLink("https://maps.app.goo.gl/abc123")).toBe("short");
  });

  it("returns null for text without coordinates", () => {
    expect(parseMapsLink("")).toBeNull();
    expect(parseMapsLink("https://example.com/not-a-map")).toBeNull();
    expect(
      parseMapsLink("https://www.google.com/maps?q=123.0,139.0"),
    ).toBeNull();
  });

  it("does not take a coordinate path segment as a name", () => {
    expect(
      parseMapsLink(
        "https://www.google.com/maps/place/35.6,139.3/@35.6,139.3,15z",
      ),
    ).toEqual({
      lat: 35.6,
      lng: 139.3,
      name: "",
    });
  });
});
