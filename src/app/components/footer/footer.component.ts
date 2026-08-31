import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink } from "@angular/router";

import { AuthService } from "../../services/auth.service";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer has-background-dark">
      <div class="content has-text-centered">
        <p class="has-text-warning">
          <!--
            The © doubles as the discreet admin sign-in entry point: the
            installed PWA has no address bar, so /login needs a way in that
            isn't advertised in the main nav. Anyone who finds it still can't
            get past the pool's admin-only pre-signup trigger. Hidden once
            signed in (sign-out lives in the navbar).
          -->
          @if (isAuthenticated()) {
            ©
          } @else {
            <a routerLink="/login" class="admin-login" aria-label="Admin sign in"
              >©</a
            >
          }
          {{ currentYear }} Hiro Nakamata. All rights reserved.
        </p>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./footer.component.scss",
})
export class FooterComponent {
  private authService = inject(AuthService);

  isAuthenticated = toSignal(this.authService.isAuthenticated$, {
    initialValue: false,
  });
  currentYear = new Date().getFullYear();
}
