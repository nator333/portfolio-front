import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from "@angular/router";
import { of, throwError } from "rxjs";
import { LoginComponent } from "./login.component";
import { AuthService } from "../../services/auth.service";

const RETURN_URL_STORAGE_KEY = "cv-editor-return-url";

describe("LoginComponent", () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: Router;

  const createComponent = (
    queryParams: Record<string, string>,
  ): ComponentFixture<LoginComponent> => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(queryParams) },
          },
        },
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, "navigateByUrl");
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(() => {
    authService = jasmine.createSpyObj<AuthService>("AuthService", [
      "isAuthenticated",
      "signInWithGoogle",
      "handleRedirectCallback",
    ]);
    authService.isAuthenticated.and.returnValue(false);
  });

  afterEach(() => {
    sessionStorage.removeItem(RETURN_URL_STORAGE_KEY);
  });

  it("should show the sign-in button when logged out", () => {
    const fixture = createComponent({});

    const button = fixture.nativeElement.querySelector("button");
    expect(button.textContent).toContain("Sign in with Google");
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it("should store the return url and start sign-in on click", () => {
    const fixture = createComponent({ returnUrl: "/projects-edit" });

    fixture.nativeElement.querySelector("button").click();

    expect(sessionStorage.getItem(RETURN_URL_STORAGE_KEY)).toBe(
      "/projects-edit",
    );
    expect(authService.signInWithGoogle).toHaveBeenCalled();
  });

  it("should exchange the code and navigate to the stored return url", () => {
    sessionStorage.setItem(RETURN_URL_STORAGE_KEY, "/cv-agent");
    authService.handleRedirectCallback.and.returnValue(of(undefined));

    createComponent({ code: "auth-code" });

    expect(authService.handleRedirectCallback).toHaveBeenCalledWith(
      "auth-code",
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith("/cv-agent", {
      replaceUrl: true,
    });
    expect(sessionStorage.getItem(RETURN_URL_STORAGE_KEY)).toBeNull();
  });

  it("should show an error when the code exchange fails", () => {
    authService.handleRedirectCallback.and.returnValue(
      throwError(() => new Error("exchange failed")),
    );

    const fixture = createComponent({ code: "bad-code" });

    expect(fixture.nativeElement.textContent).toContain(
      "Sign-in failed. Please try again.",
    );
    const button = fixture.nativeElement.querySelector("button");
    expect(button.textContent).toContain("Sign in with Google");
  });

  it("should redirect straight to the return url when already authenticated", () => {
    authService.isAuthenticated.and.returnValue(true);

    createComponent({ returnUrl: "/cv-editor" });

    expect(router.navigateByUrl).toHaveBeenCalledWith("/cv-editor", {
      replaceUrl: true,
    });
  });
});
