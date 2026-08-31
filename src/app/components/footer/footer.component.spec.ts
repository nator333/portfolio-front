import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { FooterComponent } from "./footer.component";
import { AuthService } from "../../services/auth.service";

describe("FooterComponent", () => {
  let fixture: ComponentFixture<FooterComponent>;
  let authState: BehaviorSubject<boolean>;

  beforeEach(async () => {
    authState = new BehaviorSubject<boolean>(false);
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: { isAuthenticated$: authState.asObservable() },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
  });

  const loginLink = (): HTMLAnchorElement | null =>
    fixture.nativeElement.querySelector('a[href="/login"]');

  it("should show the current year in the copyright notice", () => {
    const text = fixture.nativeElement.querySelector("p")?.textContent ?? "";
    expect(text).toContain(`© ${new Date().getFullYear()}`);
    expect(text).toContain("Hiro Nakamata");
  });

  it("should expose a discreet sign-in link on the © when logged out", () => {
    const link = loginLink();
    expect(link).not.toBeNull();
    expect(link?.textContent?.trim()).toBe("©");
  });

  it("should hide the sign-in link once authenticated", () => {
    authState.next(true);
    fixture.detectChanges();
    expect(loginLink()).toBeNull();
  });
});
