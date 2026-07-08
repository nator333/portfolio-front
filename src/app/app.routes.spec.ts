import { TestBed } from "@angular/core/testing";
import { provideRouter, Router } from "@angular/router";
import { RouterTestingHarness } from "@angular/router/testing";
import { routes } from "./app.routes";
import { HomeComponent } from "./pages/home/home.component";
import { ProjectsComponent } from "./pages/projects/projects.component";
import { ProfileComponent } from "./pages/profile/profile.component";

describe("routes (configuration)", () => {
  it("should redirect the empty path to /home", () => {
    const redirect = routes.find((r) => r.path === "");
    expect(redirect?.redirectTo).toBe("/home");
  });

  it("should define home, projects and profile routes", () => {
    const paths = routes.map((r) => r.path);
    expect(paths).toContain("home");
    expect(paths).toContain("projects");
    expect(paths).toContain("profile");
  });

  it("should redirect unknown paths to /home", () => {
    const wildcard = routes.find((r) => r.path === "**");
    expect(wildcard?.redirectTo).toBe("/home");
  });
});

describe("routes (navigation behavior)", () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  it("should land on HomeComponent when navigating to the root url", async () => {
    const component = await harness.navigateByUrl("/");
    expect(router.url).toBe("/home");
    expect(component).toBeInstanceOf(HomeComponent);
  });

  it("should render ProjectsComponent on /projects", async () => {
    const component = await harness.navigateByUrl("/projects");
    expect(component).toBeInstanceOf(ProjectsComponent);
  });

  it("should lazy-load ProfileComponent on /profile", async () => {
    const component = await harness.navigateByUrl("/profile");
    expect(component).toBeInstanceOf(ProfileComponent);
  });

  it("should redirect an unknown url to /home", async () => {
    const component = await harness.navigateByUrl("/does-not-exist");
    expect(router.url).toBe("/home");
    expect(component).toBeInstanceOf(HomeComponent);
  });
});
