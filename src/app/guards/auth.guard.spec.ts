import { TestBed } from "@angular/core/testing";
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  convertToParamMap,
} from "@angular/router";
import { authGuard } from "./auth.guard";
import { AuthService } from "../services/auth.service";

describe("authGuard", () => {
  let authService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>("AuthService", [
      "isAuthenticated",
      "signInWithGoogle",
    ]);
    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authService }],
    });
  });

  const runGuard = (queryParams: Record<string, string> = {}): boolean => {
    const route = {
      queryParamMap: convertToParamMap(queryParams),
    } as ActivatedRouteSnapshot;
    return TestBed.runInInjectionContext(() =>
      authGuard(route, {} as RouterStateSnapshot),
    ) as boolean;
  };

  it("should allow access when authenticated", () => {
    authService.isAuthenticated.and.returnValue(true);

    expect(runGuard()).toBeTrue();
    expect(authService.signInWithGoogle).not.toHaveBeenCalled();
  });

  it("should let the OAuth callback through when a code param is present", () => {
    authService.isAuthenticated.and.returnValue(false);

    expect(runGuard({ code: "auth-code" })).toBeTrue();
    expect(authService.signInWithGoogle).not.toHaveBeenCalled();
  });

  it("should block access and start sign-in when unauthenticated", () => {
    authService.isAuthenticated.and.returnValue(false);

    expect(runGuard()).toBeFalse();
    expect(authService.signInWithGoogle).toHaveBeenCalled();
  });
});
