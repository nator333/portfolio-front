import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withXhr } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideRouter, Router } from "@angular/router";
import { AppComponent } from "./app";
import { routes } from "./app.routes";

describe("AppComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter(routes),
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should render navigation, router outlet and footer", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("app-navigation")).toBeTruthy();
    expect(el.querySelector("router-outlet")).toBeTruthy();
    expect(el.querySelector("app-footer")).toBeTruthy();
  });

  it("should render the home page inside the shell after initial navigation", async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    await router.navigateByUrl("/");
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(router.url).toBe("/home");
    expect(el.querySelector("app-home")).toBeTruthy();
    // Shell stays intact around the routed page
    expect(el.querySelector("app-navigation")).toBeTruthy();
    expect(el.querySelector("app-footer")).toBeTruthy();
  });

  it("should swap the routed page when navigating to /projects", async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    await router.navigateByUrl("/projects");
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector("app-projects")).toBeTruthy();
    expect(el.querySelector("app-home")).toBeNull();
  });
});
