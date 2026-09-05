import { Component, ChangeDetectionStrategy } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { NavigationComponent } from "./components/navigation/navigation.component";
import { FooterComponent } from "./components/footer/footer.component";
import { ChatWidgetComponent } from "./components/chat-widget/chat-widget.component";
import { LoadingBarComponent } from "./components/loading-bar/loading-bar.component";
import { SwipeNavigationDirective } from "./directives/swipe-navigation.directive";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    RouterOutlet,
    NavigationComponent,
    FooterComponent,
    ChatWidgetComponent,
    LoadingBarComponent,
    SwipeNavigationDirective,
  ],
  template: `
    <app-loading-bar></app-loading-bar>
    <div class="app-container">
      <app-navigation></app-navigation>
      <!--
        On phones a horizontal swipe over the page body steps through the main
        pages in navbar order. Inert on desktop, where touch events never fire.
      -->
      <main class="main-content" appSwipeNavigation>
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
      <!--
        The chat widget (and its ChatService + icons) is not needed for first
        paint on any page, so defer it until the browser is idle. It ships in
        its own lazy chunk instead of the initial bundle.
      -->
      @defer (on idle) {
        <app-chat-widget></app-chat-widget>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./app.scss",
})
export class AppComponent {
  title = "Hiro Nakamata Portfolio";
}
