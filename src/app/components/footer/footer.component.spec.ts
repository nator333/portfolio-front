import { ComponentFixture, TestBed } from "@angular/core/testing";
import { FooterComponent } from "./footer.component";

describe("FooterComponent", () => {
  let fixture: ComponentFixture<FooterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
  });

  it("should open every social link in a new tab", () => {
    const links = Array.from(
      fixture.nativeElement.querySelectorAll("a.social-link"),
    ) as HTMLAnchorElement[];
    expect(links.length).toBe(3);
    for (const link of links) {
      expect(link.getAttribute("target")).toBe("_blank");
      expect(link.getAttribute("href")).toMatch(/^https:\/\//);
    }
  });

  it("should show the current year in the copyright notice", () => {
    const text = fixture.nativeElement.querySelector("p")?.textContent ?? "";
    expect(text).toContain(`© ${new Date().getFullYear()}`);
    expect(text).toContain("Hiro Nakamata");
  });
});
