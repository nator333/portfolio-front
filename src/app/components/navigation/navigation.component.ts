import {
  Component,
  inject,
  signal,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
} from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink, RouterLinkActive } from "@angular/router";

import { AuthService } from "../../services/auth.service";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";
import {
  faGithub,
  faFacebook,
  faXTwitter,
} from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: "app-navigation",
  standalone: true,
  imports: [RouterLink, RouterLinkActive, FaIconComponent],
  template: `
    <nav
      class="navbar is-fixed-top"
      role="navigation"
      aria-label="main navigation"
    >
      <div class="navbar-brand">
        <a class="navbar-item brand-text" routerLink="/home">
          <strong>NAKAMATA.TECH</strong>
        </a>
        <a
          role="button"
          class="navbar-burger burger"
          [class.is-active]="isMenuOpen()"
          aria-label="menu"
          aria-expanded="false"
          data-target="navbarBasicExample"
          (click)="toggleMenu()"
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </a>
      </div>

      <div
        id="navbarBasicExample"
        class="navbar-menu"
        [class.is-active]="isMenuOpen()"
        (click)="closeMenu()"
      >
        <div class="navbar-start">
          <!-- Social Media Icons -->
          <div class="navbar-item social-icons">
            <a href="https://github.com" target="_blank" class="social-link">
              <fa-icon [icon]="githubIcon"></fa-icon>
            </a>
            <a href="https://facebook.com" target="_blank" class="social-link">
              <fa-icon [icon]="facebookIcon"></fa-icon>
            </a>
            <a href="https://twitter.com" target="_blank" class="social-link">
              <fa-icon [icon]="twitterIcon"></fa-icon>
            </a>
          </div>
        </div>

        <div class="navbar-end">
          <a
            class="navbar-item nav-link"
            routerLink="/home"
            routerLinkActive="is-active"
          >
            Home
          </a>
          <a
            class="navbar-item nav-link"
            routerLink="/projects"
            routerLinkActive="is-active"
          >
            Projects
          </a>
          <a
            class="navbar-item nav-link"
            routerLink="/blog"
            routerLinkActive="is-active"
          >
            Blog
          </a>
          <a
            class="navbar-item nav-link"
            routerLink="/profile"
            routerLinkActive="is-active"
          >
            Profile
          </a>
          @if (isAuthenticated()) {
            <a
              class="navbar-item nav-link"
              routerLink="/home-edit"
              routerLinkActive="is-active"
            >
              Home Edit
            </a>
            <a
              class="navbar-item nav-link"
              routerLink="/cv-editor"
              routerLinkActive="is-active"
            >
              CV Editor
            </a>
            <a
              class="navbar-item nav-link"
              routerLink="/projects-edit"
              routerLinkActive="is-active"
            >
              Projects Edit
            </a>
            <a
              class="navbar-item nav-link"
              routerLink="/blog-edit"
              routerLinkActive="is-active"
            >
              Blog Edit
            </a>
            <a
              class="navbar-item nav-link"
              routerLink="/cv-agent"
              routerLinkActive="is-active"
            >
              CV Agent
            </a>
          }
        </div>
      </div>
    </nav>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./navigation.component.scss",
})
export class NavigationComponent {
  private authService = inject(AuthService);
  private host = inject(ElementRef<HTMLElement>);

  isMenuOpen = signal(false);
  isAuthenticated = toSignal(this.authService.isAuthenticated$, {
    initialValue: false,
  });

  // FontAwesome icons
  githubIcon = faGithub;
  facebookIcon = faFacebook;
  twitterIcon = faXTwitter;

  toggleMenu(): void {
    this.isMenuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  /**
   * Dismiss the open mobile menu when tapping anywhere outside the navbar.
   * Taps on the burger (which toggles) and on menu links (which close via the
   * menu's own handler) live inside the navbar, so they are left alone here.
   */
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isMenuOpen()) {
      return;
    }
    const navbar = this.host.nativeElement.querySelector(".navbar");
    if (navbar && !navbar.contains(event.target as Node)) {
      this.closeMenu();
    }
  }
}
