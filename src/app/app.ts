import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NavigationComponent } from "./components/navigation/navigation.component";
import { FooterComponent } from "./components/footer/footer.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterOutlet, NavigationComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-navigation></app-navigation>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styleUrl: "./app.scss",
})
export class AppComponent {
  title = "Masahiro Nakamata Portfolio";
}
