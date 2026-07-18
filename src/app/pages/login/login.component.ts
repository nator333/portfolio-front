import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HeroComponent } from '../../components/hero/hero.component';
import { AuthService } from '../../services/auth.service';

const RETURN_URL_STORAGE_KEY = 'cv-editor-return-url';

/**
 * Single sign-in entry point and the registered Cognito OAuth callback.
 * The guard sends unauthenticated visitors here with a ?returnUrl=; the
 * return URL survives the round-trip to the Cognito hosted domain in
 * sessionStorage because Cognito only echoes back the ?code= parameter.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, HeroComponent],
  template: `
    <app-hero title="Sign in" subtitle="Admin access"></app-hero>

    <section class="section">
      <div class="container">
        <div class="box login-box has-text-centered">
          @if (errorMessage) {
            <p class="has-text-danger">{{ errorMessage }}</p>
          }
          @if (signingIn) {
            <p>Completing sign-in...</p>
          } @else {
            <button class="button is-primary" type="button" (click)="signInWithGoogle()">
              <span class="icon"><i class="fab fa-google"></i></span>
              <span>Sign in with Google</span>
            </button>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .login-box {
      max-width: 420px;
      margin: 0 auto;
    }
  `,
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  signingIn = false;
  errorMessage = '';

  ngOnInit(): void {
    // Returning from the Cognito hosted domain after Google sign-in.
    const code = this.route.snapshot.queryParamMap.get('code');
    if (code && !this.authService.isAuthenticated()) {
      this.signingIn = true;
      this.authService.handleRedirectCallback(code).subscribe({
        next: () => {
          this.router.navigateByUrl(consumeReturnUrl(), { replaceUrl: true });
        },
        error: () => {
          this.signingIn = false;
          this.errorMessage = 'Sign-in failed. Please try again.';
          this.router.navigate([], { queryParams: {}, replaceUrl: true });
        },
      });
      return;
    }

    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl(), { replaceUrl: true });
    }
  }

  signInWithGoogle(): void {
    this.errorMessage = '';
    sessionStorage.setItem(RETURN_URL_STORAGE_KEY, this.returnUrl());
    this.authService.signInWithGoogle();
  }

  private returnUrl(): string {
    const url = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/home';
    return url.startsWith('/') ? url : '/home';
  }
}

function consumeReturnUrl(): string {
  const url = sessionStorage.getItem(RETURN_URL_STORAGE_KEY) ?? '/home';
  sessionStorage.removeItem(RETURN_URL_STORAGE_KEY);
  return url.startsWith('/') ? url : '/home';
}
