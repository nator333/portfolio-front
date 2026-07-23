import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NavigationComponent } from "./components/navigation/navigation.component";
import { FooterComponent } from "./components/footer/footer.component";
import { ChatWidgetComponent } from "./components/chat-widget/chat-widget.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    NavigationComponent,
    FooterComponent,
    ChatWidgetComponent,
  ],
  template: `
    <div class="app-container">
      <app-navigation></app-navigation>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      <app-chat-widget></app-chat-widget>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./app.scss",
})
export class AppComponent {
  title = "Hiro Nakamata Portfolio";
}
