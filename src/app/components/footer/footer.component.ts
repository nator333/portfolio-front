import { Component, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector: "app-footer",
  standalone: true,
  imports: [],
  template: `
    <footer class="footer has-background-dark">
      <div class="content has-text-centered">
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
