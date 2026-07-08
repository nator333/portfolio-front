import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ProjectsComponent } from "./projects.component";

describe("ProjectsComponent", () => {
  let fixture: ComponentFixture<ProjectsComponent>;
  let component: ProjectsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should render the hero with the Projects title", () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("app-hero h1")?.textContent).toContain("Projects");
  });

  it("should render one card per project with title, tech and tags", () => {
    const cards = fixture.nativeElement.querySelectorAll(".project-card");
    expect(cards.length).toBe(component.projects.length);

    component.projects.forEach((project, i) => {
      const card = cards[i] as HTMLElement;
      expect(card.querySelector(".title")?.textContent).toContain(
        project.title,
      );
      expect(card.querySelector(".subtitle")?.textContent).toContain(
        project.tech,
      );
      expect(card.querySelectorAll(".tag").length).toBe(project.tags.length);
      const img = card.querySelector("img") as HTMLImageElement;
      expect(img.getAttribute("src")).toBe(project.image);
      expect(img.getAttribute("alt")).toBe(project.title);
    });
  });

  it("should only render footer links for urls the project defines", () => {
    const cards = fixture.nativeElement.querySelectorAll(".project-card");
    component.projects.forEach((project, i) => {
      const links = Array.from(
        (cards[i] as HTMLElement).querySelectorAll(".card-footer a"),
      ) as HTMLAnchorElement[];
      const labels = links.map((l) => l.textContent?.trim());
      expect(labels.includes("Live Demo")).toBe(!!project.liveUrl);
      expect(labels.includes("GitHub")).toBe(!!project.githubUrl);
      for (const link of links) {
        expect(link.getAttribute("target")).toBe("_blank");
      }
    });
  });
});
