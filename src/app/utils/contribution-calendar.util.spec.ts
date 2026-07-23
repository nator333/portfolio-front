import {
  buildCalendarModel,
  toDailyContributions,
  toIsoDate,
} from "./contribution-calendar.util";

describe("toIsoDate", () => {
  it("should format a local date as YYYY-MM-DD without timezone shift", () => {
    // Local midnight; toIsoDate must not roll back a day via UTC conversion.
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(toIsoDate(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("toDailyContributions", () => {
  it("should count one contribution per event date", () => {
    const result = toDailyContributions([
      new Date(2026, 0, 5),
      new Date(2026, 0, 6),
    ]);
    expect(result).toEqual([
      { date: "2026-01-05", count: 1 },
      { date: "2026-01-06", count: 1 },
    ]);
  });

  it("should sum multiple events that fall on the same day", () => {
    const result = toDailyContributions([
      new Date(2026, 0, 5, 9),
      new Date(2026, 0, 5, 18),
    ]);
    expect(result).toEqual([{ date: "2026-01-05", count: 2 }]);
  });

  it("should return an empty list for no events", () => {
    expect(toDailyContributions([])).toEqual([]);
  });

  it("should stay additive when several sources are concatenated", () => {
    // The intended merge path: concat sources, let buildCalendarModel sum.
    const blog = toDailyContributions([new Date(2026, 6, 20)]);
    const gym = toDailyContributions([new Date(2026, 6, 20)]);
    const model = buildCalendarModel([...blog, ...gym], {
      end: new Date(2026, 6, 23),
      weeks: 4,
    });
    const cell = model.weeks
      .flatMap((w) => w.days)
      .find((c) => c.date === "2026-07-20");
    expect(cell?.count).toBe(2);
  });
});

describe("buildCalendarModel", () => {
  // A fixed Thursday so week alignment is deterministic across runs.
  const end = new Date(2026, 6, 23); // 2026-07-23, getDay() === 4

  it("should build weeks columns of seven days each", () => {
    const model = buildCalendarModel([], { end, weeks: 10 });
    expect(model.weeks.length).toBe(10);
    for (const week of model.weeks) {
      expect(week.days.length).toBe(7);
    }
  });

  it("should default to a full 53-week year", () => {
    const model = buildCalendarModel([], { end });
    expect(model.weeks.length).toBe(53);
  });

  it("should place end in the last column and mark later days out of range", () => {
    const model = buildCalendarModel([], { end, weeks: 4 });
    const lastWeek = model.weeks[model.weeks.length - 1];
    // Thursday (index 4) is `end`; Fri/Sat are future padding.
    expect(lastWeek.days[4].date).toBe("2026-07-23");
    expect(lastWeek.days[4].inRange).toBeTrue();
    expect(lastWeek.days[5].inRange).toBeFalse();
    expect(lastWeek.days[6].inRange).toBeFalse();
  });

  it("should start each week on Sunday", () => {
    const model = buildCalendarModel([], { end, weeks: 4 });
    const firstDay = new Date(model.weeks[0].days[0].date + "T00:00:00");
    expect(firstDay.getDay()).toBe(0);
  });

  it("should sum counts within range into the total", () => {
    const model = buildCalendarModel(
      [
        { date: "2026-07-20", count: 2 },
        { date: "2026-07-22", count: 1 },
        // Outside the 4-week window: ignored.
        { date: "2020-01-01", count: 9 },
      ],
      { end, weeks: 4 },
    );
    expect(model.total).toBe(3);
    expect(model.maxCount).toBe(9);
  });

  it("should map counts straight to levels when the max is small", () => {
    const model = buildCalendarModel(
      [
        { date: "2026-07-20", count: 1 },
        { date: "2026-07-21", count: 3 },
      ],
      { end, weeks: 4 },
    );
    const byDate = new Map(
      model.weeks.flatMap((w) => w.days).map((c) => [c.date, c]),
    );
    expect(byDate.get("2026-07-20")?.level).toBe(1);
    expect(byDate.get("2026-07-21")?.level).toBe(3);
    expect(byDate.get("2026-07-22")?.level).toBe(0);
  });

  it("should aggregate duplicate dates before bucketing", () => {
    const model = buildCalendarModel(
      [
        { date: "2026-07-20", count: 1 },
        { date: "2026-07-20", count: 1 },
      ],
      { end, weeks: 4 },
    );
    const cell = model.weeks
      .flatMap((w) => w.days)
      .find((c) => c.date === "2026-07-20");
    expect(cell?.count).toBe(2);
    expect(model.total).toBe(2);
  });

  it("should drop the leading month label when its column stub is too short", () => {
    // 2026-04-05 is a Sunday, so a window ending here starts on a Sunday whose
    // month (the window start) yields only a stub before the next month.
    const model = buildCalendarModel([], {
      end: new Date(2026, 6, 5), // Sun 2026-07-05
      weeks: 15,
    });
    // First column is Sun 2026-03-22 (March stub, 2 columns), so March may or
    // may not survive; whichever labels remain must not sit within 2 columns.
    for (let i = 1; i < model.months.length; i++) {
      expect(model.months[i].weekIndex - model.months[i - 1].weekIndex).toBeGreaterThanOrEqual(2);
    }
  });

  it("should keep a leading month label that spans enough columns", () => {
    // A window whose first column is early in a month keeps that first label.
    const model = buildCalendarModel([], { end: new Date(2026, 6, 23), weeks: 53 });
    expect(model.months[0].weekIndex).toBe(0);
  });

  it("should label each distinct month once, in column order", () => {
    const model = buildCalendarModel([], { end, weeks: 53 });
    expect(model.months.length).toBeGreaterThan(0);
    const indices = model.months.map((m) => m.weekIndex);
    const sorted = [...indices].sort((a, b) => a - b);
    expect(indices).toEqual(sorted);
    // No two consecutive labels repeat a month.
    const labels = model.months.map((m) => m.label);
    for (let i = 1; i < labels.length; i++) {
      expect(labels[i]).not.toBe(labels[i - 1]);
    }
  });
});
