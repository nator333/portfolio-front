import { TestBed } from "@angular/core/testing";
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from "@angular/router";
import { authGuard } from "./auth.guard";
import { AuthService } from "../services/auth.service";

describe("authGuard", () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>("AuthService", [
      "isAuthenticated",
    ]);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
      ],
    });
    router = TestBed.inject(Router);
  });

  const runGuard = (url: string): boolean | UrlTree =>
    TestBed.runInInjectionContext(() =>
      authGuard({} as ActivatedRouteSnapshot, { url } as RouterStateSnapshot),
    ) as boolean | UrlTree;

  it("should allow access when authenticated", () => {
    authService.isAuthenticated.and.returnValue(true);

    expect(runGuard("/cv-editor")).toBeTrue();
  });

  it("should redirect to /login with a return url when unauthenticated", () => {
    authService.isAuthenticated.and.returnValue(false);

    const result = runGuard("/cv-editor");

    expect(result).toBeInstanceOf(UrlTree);
    expect(router.serializeUrl(result as UrlTree)).toBe(
      "/login?returnUrl=%2Fcv-editor",
    );
  });
});
