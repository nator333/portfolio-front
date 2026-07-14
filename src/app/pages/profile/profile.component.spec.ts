import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ProfileComponent } from "./profile.component";

describe("ProfileComponent", () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let component: ProfileComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should render the hero with the Profile title", () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("app-hero h1")?.textContent).toContain("Profile");
  });

  it("should render the skill category headings", () => {
    const headings = Array.from(
      fixture.nativeElement.querySelectorAll(".skill-category .title"),
    ).map((h) => (h as HTMLElement).textContent?.trim());
    expect(headings).toContain("Languages");
    expect(headings).toContain("Database");
    expect(headings).toContain("Tools");
  });

  it("should list the frontend and backend languages", () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    for (const lang of component.frontendLanguages) {
      expect(text).withContext(`frontend language ${lang}`).toContain(lang);
    }
    for (const lang of component.backendLanguages) {
      expect(text).withContext(`backend language ${lang}`).toContain(lang);
    }
  });
});
