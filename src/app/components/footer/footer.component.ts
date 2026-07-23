import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [],
  template: `
    <footer class="footer has-background-dark">
      <div class="content has-text-centered">
        <div class="columns is-mobile is-centered">
          <div class="column is-narrow">
            <a href="https://github.com" target="_blank" class="social-link">
              <span class="icon is-large">
                <i class="fab fa-github"></i>
              </span>
            </a>
          </div>
          <div class="column is-narrow">
            <a href="https://twitter.com" target="_blank" class="social-link">
              <span class="icon is-large">
                <i class="fab fa-twitter"></i>
              </span>
            </a>
          </div>
          <div class="column is-narrow">
            <a href="https://youtube.com" target="_blank" class="social-link">
              <span class="icon is-large">
                <i class="fab fa-youtube"></i>
              </span>
            </a>
          </div>
        </div>
        <p class="has-text-warning">
          © {{ currentYear }} Hiro Nakamata. All rights reserved.
        </p>
      </div>
    </footer>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./footer.component.scss",
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
}
