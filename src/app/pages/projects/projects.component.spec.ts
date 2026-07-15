import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ProjectsComponent } from "./projects.component";
import { environment } from "../../../environments/environment";

describe("ProjectsComponent", () => {
  let fixture: ComponentFixture<ProjectsComponent>;
  let component: ProjectsComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProjectsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProjectsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  function flushProjects(projects: unknown): void {
    httpMock.expectOne(`${environment.apiBaseUrl}/projects`).flush({ projects });
    fixture.detectChanges();
  }

  function failProjects(): void {
    httpMock
      .expectOne(`${environment.apiBaseUrl}/projects`)
      .flush({ message: "quota exceeded" }, { status: 429, statusText: "Too Many Requests" });
    fixture.detectChanges();
  }

  it("should render the hero with the Projects title", () => {
    flushProjects([]);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("app-hero h1")?.textContent).toContain("Projects");
  });

  it("should render projects from the API", () => {
    flushProjects([
      {
        title: "My App",
        tech: "Angular, AWS",
        description: "Does things.",
        image: "assets/projects/app.png",
        tags: ["Angular", "AWS"],
        liveUrl: "https://example.com",
        githubUrl: "",
      },
    ]);

    const cards = fixture.nativeElement.querySelectorAll(".project-card");
    expect(cards.length).toBe(1);
    const card = cards[0] as HTMLElement;
    expect(card.querySelector(".title")?.textContent).toContain("My App");
    expect(card.querySelector(".subtitle")?.textContent).toContain("Angular, AWS");
    expect(card.querySelectorAll(".tag").length).toBe(2);
  });

  it("should render one card per project with title, tech and tags", () => {
    flushProjects([]);
    const cards = fixture.nativeElement.querySelectorAll(".project-card");
    expect(cards.length).toBe(component.projects.length);

    component.projects.forEach((project, i) => {
      const card = cards[i] as HTMLElement;
      expect(card.querySelector(".title")?.textContent).toContain(project.title);
      expect(card.querySelector(".subtitle")?.textContent).toContain(project.tech);
      expect(card.querySelectorAll(".tag").length).toBe(project.tags.length);
      const img = card.querySelector("img") as HTMLImageElement;
      expect(img.getAttribute("src")).toBe(project.image);
      expect(img.getAttribute("alt")).toBe(project.title);
    });
  });

  it("should only render footer links for urls the project defines", () => {
    flushProjects([]);
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

  it("should keep fallback projects when the API returns none", () => {
    flushProjects([]);
    const cards = fixture.nativeElement.querySelectorAll(".project-card");
    expect(cards.length).toBeGreaterThan(0);
  });

  it("should keep fallback projects when the API fails", () => {
    failProjects();
    const cards = fixture.nativeElement.querySelectorAll(".project-card");
    expect(cards.length).toBeGreaterThan(0);
  });
});
