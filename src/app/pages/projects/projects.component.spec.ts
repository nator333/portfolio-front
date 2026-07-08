import { TestBed } from "@angular/core/testing";
import { ProjectsComponent } from "./projects.component";

describe("ProjectsComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
    }).compileComponents();
  });

  it("should render the hero with the Projects title", () => {
    const fixture = TestBed.createComponent(ProjectsComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("app-hero h1")?.textContent).toContain("Projects");
  });
});
