import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { ActivityFeedComponent } from "./activity-feed.component";
import { ActivityEntry } from "../../models/activity-data";

describe("ActivityFeedComponent", () => {
  let fixture: ComponentFixture<ActivityFeedComponent>;

  const entries: ActivityEntry[] = [
    { date: "2026-07-20", type: "blog", title: "Older post", url: "/blog/older" },
    { date: "2026-07-22", type: "blog", title: "Newer post", url: "/blog/newer" },
    { date: "2026-07-21", type: "github", title: "External thing", url: "https://example.com" },
    { date: "2026-07-19", type: "gym", title: "Leg day" },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityFeedComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ActivityFeedComponent);
  });

  function setEntries(list: ActivityEntry[]): void {
    fixture.componentRef.setInput("entries", list);
    fixture.detectChanges();
  }

  const itemTitles = (): string[] =>
    Array.from(
      fixture.nativeElement.querySelectorAll(".feed-item .feed-title"),
    ).map((el) => (el as HTMLElement).textContent?.trim() ?? "");

  it("should show an empty message when there are no entries", () => {
    setEntries([]);
    expect(fixture.nativeElement.querySelector(".feed-empty")).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll(".feed-item").length).toBe(0);
  });

  it("should list entries newest first", () => {
    setEntries(entries);
    expect(itemTitles()).toEqual([
      "Newer post", // 07-22
      "External thing", // 07-21
      "Older post", // 07-20
      "Leg day", // 07-19
    ]);
  });

  it("should render a type badge per entry", () => {
    setEntries(entries);
    const badges = Array.from(
      fixture.nativeElement.querySelectorAll(".feed-badge"),
    ).map((el) => (el as HTMLElement).textContent?.trim());
    expect(badges).toContain("Blog");
    expect(badges).toContain("GitHub");
    expect(badges).toContain("Gym");
  });

  it("should link internal urls with routerLink and external urls with target=_blank", () => {
    setEntries(entries);
    const links = Array.from(
      fixture.nativeElement.querySelectorAll("a.feed-title"),
    ) as HTMLAnchorElement[];
    const external = links.find((a) => a.textContent?.includes("External"));
    const internal = links.find((a) => a.textContent?.includes("Newer"));
    expect(external?.getAttribute("target")).toBe("_blank");
    expect(external?.getAttribute("rel")).toContain("noopener");
    // routerLink renders the resolved href without a new-tab target.
    expect(internal?.getAttribute("href")).toBe("/blog/newer");
    expect(internal?.getAttribute("target")).toBeNull();
  });

  it("should render a non-link title when no url is present", () => {
    setEntries([{ date: "2026-07-19", type: "blog", title: "Draft" }]);
    const title = fixture.nativeElement.querySelector(".feed-title");
    expect(title.tagName.toLowerCase()).toBe("span");
  });

  it("should link linkless gym entries to the training page", () => {
    setEntries([{ date: "2026-07-19", type: "gym", title: "Leg day" }]);
    const title = fixture.nativeElement.querySelector(
      "a.feed-title",
    ) as HTMLAnchorElement | null;
    expect(title?.getAttribute("href")).toBe("/workout");
    expect(title?.getAttribute("target")).toBeNull();
  });

  it("should highlight entries on the selected date", () => {
    setEntries(entries);
    fixture.componentRef.setInput("selectedDate", "2026-07-22");
    fixture.detectChanges();
    const selected = fixture.nativeElement.querySelectorAll(
      ".feed-item.is-selected",
    );
    expect(selected.length).toBe(1);
    expect(selected[0].textContent).toContain("Newer post");
  });

  describe("daily GitHub summaries", () => {
    const githubDay: ActivityEntry[] = [
      { date: "2026-07-21", type: "github", title: "octo/a: 3 pushes" },
      { date: "2026-07-21", type: "github", title: "octo/b: 1 push" },
      { date: "2026-07-20", type: "blog", title: "A post" },
    ];

    function setSummaries(): void {
      fixture.componentRef.setInput("summaries", [
        { date: "2026-07-21", summary: "Built the thing.", repos: ["octo/a"] },
        { date: "2026-07-20", summary: "No GitHub entry shown.", repos: [] },
      ]);
    }

    const summaries = (): HTMLElement[] =>
      Array.from(fixture.nativeElement.querySelectorAll(".feed-summary"));

    it("shows a day's summary once, under its first GitHub entry", () => {
      setSummaries();
      setEntries(githubDay);
      const shown = summaries();
      expect(shown.length).toBe(1);
      expect(shown[0].textContent).toContain("Built the thing.");
      expect(shown[0].closest(".feed-item")?.textContent).toContain(
        "octo/a: 3 pushes",
      );
    });

    it("expands and collapses on toggle", () => {
      setSummaries();
      setEntries(githubDay);
      const toggle = fixture.nativeElement.querySelector(
        ".feed-summary-toggle",
      ) as HTMLButtonElement;
      expect(summaries()[0].classList).not.toContain("is-expanded");
      toggle.click();
      fixture.detectChanges();
      expect(summaries()[0].classList).toContain("is-expanded");
      expect(toggle.getAttribute("aria-expanded")).toBe("true");
      toggle.click();
      fixture.detectChanges();
      expect(summaries()[0].classList).not.toContain("is-expanded");
    });

    it("expands the summary of the day selected on the calendar", () => {
      setSummaries();
      setEntries(githubDay);
      fixture.componentRef.setInput("selectedDate", "2026-07-21");
      fixture.detectChanges();
      expect(summaries()[0].classList).toContain("is-expanded");
    });
  });
});
