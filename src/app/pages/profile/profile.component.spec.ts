import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient, withXhr } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ProfileComponent } from "./profile.component";
import { environment } from "../../../environments/environment";

describe("ProfileComponent", () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideHttpClient(withXhr()), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  function flushCv(overrides: {
    technicalSkills?: unknown;
    summary?: string;
    experience?: unknown;
    education?: unknown;
  }): void {
    httpMock.expectOne(`${environment.apiBaseUrl}/cv`).flush({
      personalInfo: {
        fullName: "Hiro Nakamata",
        title: "",
        email: "hiro@example.com",
        phone: "",
        links: {},
      },
      summary: overrides.summary ?? "",
      technicalSkills: overrides.technicalSkills ?? [],
      experience: overrides.experience ?? [],
      qualifications: [],
      education: overrides.education ?? [],
    });
    fixture.detectChanges();
  }

  function sectionTitles(): (string | undefined)[] {
    return Array.from(
      fixture.nativeElement.querySelectorAll(".profile-block > .title"),
    ).map((h) => (h as HTMLElement).textContent?.trim());
  }

  it("should render the hero with the Profile title", () => {
    flushCv({});
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("app-hero h1")?.textContent).toContain("Profile");
  });

  it("should render skill categories from the CV API", () => {
    flushCv({
      technicalSkills: [
        { category: "Languages", skills: ["TypeScript", "Kotlin"] },
        { category: "Cloud & DevOps", skills: ["AWS", "Terraform"] },
      ],
    });

    const categoryNames = Array.from(
      fixture.nativeElement.querySelectorAll(".skillBox .subtitle"),
    ).map((h) => (h as HTMLElement).textContent?.trim());
    expect(categoryNames).toEqual(["Languages", "Cloud & DevOps"]);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    for (const skill of ["TypeScript", "Kotlin", "AWS", "Terraform"]) {
      expect(text).withContext(`skill ${skill}`).toContain(skill);
    }
  });

  it("should render the summary section when the CV has one", () => {
    flushCv({ summary: "Engineer who ships end to end." });
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("Engineer who ships end to end.");
  });

  it("should render experience entries with bullets and techstack", () => {
    flushCv({
      experience: [
        {
          company: "Example Corp",
          role: "Senior Engineer",
          startDate: "January 2022",
          endDate: "Present",
          bullets: ["Led a migration", "Cut costs 40%"],
          techstack: "TypeScript, AWS",
        },
      ],
    });

    expect(sectionTitles()).toContain("Experience");
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("Senior Engineer");
    expect(text).toContain("Example Corp");
    expect(text).toContain("January 2022 – Present");
    expect(text).toContain("Led a migration");
    expect(text).toContain("TypeScript, AWS");
  });

  it("should render education entries", () => {
    flushCv({
      education: [
        {
          institution: "Example University",
          degree: "B.S. Computer Science",
          startDate: "2014",
          endDate: "2018",
        },
      ],
    });

    expect(sectionTitles()).toContain("Education");
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("B.S. Computer Science");
    expect(text).toContain("Example University");
    expect(text).toContain("2014 – 2018");
  });

  it("should omit experience and education sections when the CV has none", () => {
    flushCv({});
    const titles = sectionTitles();
    expect(titles).not.toContain("Experience");
    expect(titles).not.toContain("Education");
  });

  it("should fall back to static skill categories when the API fails", () => {
    httpMock
      .expectOne(`${environment.apiBaseUrl}/cv`)
      .flush(
        { message: "quota exceeded" },
        { status: 429, statusText: "Too Many Requests" },
      );
    fixture.detectChanges();

    const categoryNames = Array.from(
      fixture.nativeElement.querySelectorAll(".skillBox .subtitle"),
    ).map((h) => (h as HTMLElement).textContent?.trim());
    expect(categoryNames).toContain("Languages");
    expect(categoryNames).toContain("Database");
    expect(categoryNames).toContain("Tools");
  });

  it("should keep fallback categories when the CV has no technical skills yet", () => {
    flushCv({});
    const categoryNames = Array.from(
      fixture.nativeElement.querySelectorAll(".skillBox .subtitle"),
    ).map((h) => (h as HTMLElement).textContent?.trim());
    expect(categoryNames).toContain("Languages");
    expect(categoryNames).toContain("Tools");
  });
});
