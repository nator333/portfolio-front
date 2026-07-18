import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { NavigationComponent } from "./navigation.component";
import { AuthService } from "../../services/auth.service";

describe("NavigationComponent", () => {
  let fixture: ComponentFixture<NavigationComponent>;
  let authState: BehaviorSubject<boolean>;

  beforeEach(async () => {
    authState = new BehaviorSubject<boolean>(false);
    await TestBed.configureTestingModule({
      imports: [NavigationComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated$: authState.asObservable() },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(NavigationComponent);
    fixture.detectChanges();
  });

  const renderedHrefs = (): (string | null)[] =>
    Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("a[href]"),
    ).map((a) => a.getAttribute("href"));

  it("should render links to home, projects and profile", () => {
    const hrefs = renderedHrefs();
    expect(hrefs).toContain("/home");
    expect(hrefs).toContain("/projects");
    expect(hrefs).toContain("/profile");
  });

  it("should hide edit page links when not authenticated", () => {
    const hrefs = renderedHrefs();
    expect(hrefs).not.toContain("/cv-editor");
    expect(hrefs).not.toContain("/projects-edit");
    expect(hrefs).not.toContain("/cv-agent");
  });

  it("should show all edit page links when authenticated", () => {
    authState.next(true);
    fixture.detectChanges();

    const hrefs = renderedHrefs();
    expect(hrefs).toContain("/cv-editor");
    expect(hrefs).toContain("/projects-edit");
    expect(hrefs).toContain("/cv-agent");
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
