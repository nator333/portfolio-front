import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { NavigationComponent } from "./navigation.component";

describe("NavigationComponent", () => {
  let fixture: ComponentFixture<NavigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(NavigationComponent);
    fixture.detectChanges();
  });

  it("should render links to home, projects and profile", () => {
    const el: HTMLElement = fixture.nativeElement;
    const hrefs = Array.from(el.querySelectorAll("a[href]")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/home");
    expect(hrefs).toContain("/projects");
    expect(hrefs).toContain("/profile");
  });

  it("should open social links in a new tab", () => {
    const social = Array.from(
      fixture.nativeElement.querySelectorAll("a.social-link"),
    ) as HTMLAnchorElement[];
    expect(social.length).toBe(3);
    for (const link of social) {
      expect(link.getAttribute("target")).toBe("_blank");
    }
  });

  it("should open and close the menu when the burger is clicked", () => {
    const el: HTMLElement = fixture.nativeElement;
    const burger = el.querySelector(".navbar-burger") as HTMLElement;
    const menu = el.querySelector(".navbar-menu") as HTMLElement;

    expect(menu.classList).not.toContain("is-active");

    burger.click();
    fixture.detectChanges();
    expect(menu.classList).toContain("is-active");
    expect(burger.classList).toContain("is-active");

    burger.click();
    fixture.detectChanges();
    expect(menu.classList).not.toContain("is-active");
    expect(burger.classList).not.toContain("is-active");
  });
});
