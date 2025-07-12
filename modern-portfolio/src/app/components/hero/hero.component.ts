import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero is-fullheight" [class]="heroClass()">
      <div class="hero-body">
        <div class="container has-text-centered">
          <h1 class="title is-1 has-text-white gold-text gold-underline">
            {{ title() }}
          </h1>
          @if (subtitle()) {
            <h2 class="subtitle is-3 has-text-white-ter">
              {{ subtitle() }}
            </h2>
          }
          @if (showContent()) {
            <div class="content has-text-white-bis">
              <ng-content></ng-content>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styleUrl: './hero.component.scss'
})
export class HeroComponent {
  title = input<string>('');
  subtitle = input<string>('');
  heroClass = input<string>('is-primary');
  showContent = input<boolean>(false);
}