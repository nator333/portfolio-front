import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { NavigationComponent } from "./navigation.component";

describe("NavigationComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it("should render links to home, projects and profile", () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    const hrefs = Array.from(el.querySelectorAll("a[href]")).map((a) =>
      a.getAttribute("href"),
    );
    expect(hrefs).toContain("/home");
    expect(hrefs).toContain("/projects");
    expect(hrefs).toContain("/profile");
  });

  it("should toggle the burger menu", () => {
    const fixture = TestBed.createComponent(NavigationComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isMenuOpen()).toBeFalse();
    component.toggleMenu();
    expect(component.isMenuOpen()).toBeTrue();

    fixture.detectChanges();
    const menu = fixture.nativeElement.querySelector(".navbar-menu");
    expect(menu.classList).toContain("is-active");
  });
});
