import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ActivityFiltersComponent } from "./activity-filters.component";
import { ActivityType } from "../../models/activity-data";

describe("ActivityFiltersComponent", () => {
  let fixture: ComponentFixture<ActivityFiltersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityFiltersComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ActivityFiltersComponent);
  });

  function setInputs(
    types: ActivityType[],
    active: ActivityType[],
  ): void {
    fixture.componentRef.setInput("types", types);
    fixture.componentRef.setInput("active", active);
    fixture.detectChanges();
  }

  const badges = (): HTMLButtonElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll(".filter-badge"));

  it("should render a badge per offered type, labelled", () => {
    setInputs(["blog", "gym", "github"], ["blog", "gym", "github"]);
    expect(badges().map((b) => b.textContent?.trim())).toEqual([
      "Blog",
      "Gym",
      "GitHub",
    ]);
  });

  it("should mark active types with is-active and aria-pressed", () => {
    setInputs(["blog", "gym"], ["blog"]);
    const [blog, gym] = badges();
    expect(blog.classList).toContain("is-active");
    expect(blog.getAttribute("aria-pressed")).toBe("true");
    expect(gym.classList).not.toContain("is-active");
    expect(gym.getAttribute("aria-pressed")).toBe("false");
  });

  it("should emit the tapped type", () => {
    setInputs(["blog", "gym"], ["blog", "gym"]);
    let emitted: ActivityType | undefined;
    fixture.componentInstance.toggled.subscribe((t) => (emitted = t));
    badges()[1].click();
    expect(emitted).toBe("gym");
  });
});
