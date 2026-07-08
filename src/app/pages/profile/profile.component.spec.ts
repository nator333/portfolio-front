import { TestBed } from "@angular/core/testing";
import { ProfileComponent } from "./profile.component";

describe("ProfileComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
    }).compileComponents();
  });

  it("should render the hero with the Profile title", () => {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("app-hero h1")?.textContent).toContain("Profile");
  });
});
