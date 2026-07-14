import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
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
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  function flushCv(technicalSkills: unknown, summary = ""): void {
    httpMock.expectOne(`${environment.apiBaseUrl}/cv`).flush({
      personalInfo: {
        fullName: "Hiro Nakamata",
        title: "",
        email: "hiro@example.com",
        phone: "",
        links: {},
      },
      summary,
      technicalSkills,
      experience: [],
      qualifications: [],
      education: [],
    });
    fixture.detectChanges();
  }

  it("should render the hero with the Profile title", () => {
    flushCv([]);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("app-hero h1")?.textContent).toContain("Profile");
  });

  it("should render skill categories from the CV API", () => {
    flushCv([
      { category: "Languages", skills: ["TypeScript", "Kotlin"] },
      { category: "Cloud & DevOps", skills: ["AWS", "Terraform"] },
    ]);

    const headings = Array.from(
      fixture.nativeElement.querySelectorAll(".skill-category .title"),
    ).map((h) => (h as HTMLElement).textContent?.trim());
    expect(headings).toEqual(["Languages", "Cloud & DevOps"]);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    for (const skill of ["TypeScript", "Kotlin", "AWS", "Terraform"]) {
      expect(text).withContext(`skill ${skill}`).toContain(skill);
    }
  });

  it("should render the summary section when the CV has one", () => {
    flushCv([], "Engineer who ships end to end.");
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("Engineer who ships end to end.");
  });

  it("should fall back to static skill categories when the API fails", () => {
    httpMock
      .expectOne(`${environment.apiBaseUrl}/cv`)
      .flush({ message: "quota exceeded" }, { status: 429, statusText: "Too Many Requests" });
    fixture.detectChanges();

    const headings = Array.from(
      fixture.nativeElement.querySelectorAll(".skill-category .title"),
    ).map((h) => (h as HTMLElement).textContent?.trim());
    expect(headings).toContain("Languages");
    expect(headings).toContain("Database");
    expect(headings).toContain("Tools");
  });

  it("should keep fallback categories when the CV has no technical skills yet", () => {
    flushCv([]);
    const headings = Array.from(
      fixture.nativeElement.querySelectorAll(".skill-category .title"),
    ).map((h) => (h as HTMLElement).textContent?.trim());
    expect(headings).toContain("Languages");
    expect(headings).toContain("Tools");
  });
});
