import { activityToContributions, ActivityEntry } from "./activity-data";

describe("activityToContributions", () => {
  const entry = (
    date: string,
    title = "x",
  ): ActivityEntry => ({ date, type: "blog", title });

  it("should count one contribution per entry", () => {
    const result = activityToContributions([
      entry("2026-07-20"),
      entry("2026-07-22"),
    ]);
    expect(result).toEqual([
      { date: "2026-07-20", count: 1 },
      { date: "2026-07-22", count: 1 },
    ]);
  });

  it("should sum entries that share a date", () => {
    const result = activityToContributions([
      entry("2026-07-20", "a"),
      entry("2026-07-20", "b"),
      entry("2026-07-20", "c"),
    ]);
    expect(result).toEqual([{ date: "2026-07-20", count: 3 }]);
  });

  it("should stay additive across concatenated sources", () => {
    const blog: ActivityEntry[] = [{ date: "2026-07-20", type: "blog", title: "post" }];
    const gym: ActivityEntry[] = [{ date: "2026-07-20", type: "gym", title: "leg day" }];
    expect(activityToContributions([...blog, ...gym])).toEqual([
      { date: "2026-07-20", count: 2 },
    ]);
  });

  it("should ignore entries without a date", () => {
    const result = activityToContributions([
      { date: "", type: "blog", title: "no date" },
      entry("2026-07-20"),
    ]);
    expect(result).toEqual([{ date: "2026-07-20", count: 1 }]);
  });

  it("should return an empty list for no entries", () => {
    expect(activityToContributions([])).toEqual([]);
  });
});
