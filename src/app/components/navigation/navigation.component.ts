import { Component, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { CommonModule } from "@angular/common";
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
  imports: [RouterLink, RouterLinkActive, CommonModule, FaIconComponent],
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
  styleUrl: "./navigation.component.scss",
})
export class NavigationComponent {
  private authService = inject(AuthService);

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
}
