import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeroComponent } from '../../components/hero/hero.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeroComponent],
  template: `
    <app-hero 
      title="KEEP ASKING YOURSELF WHY" 
      subtitle="Backend Engineer"
      [showContent]="true">
      <div class="home-content">
        <div class="columns is-vcentered">
          <div class="column is-half">
            <div class="content is-large">
              <p class="is-size-4 has-text-weight-semibold gold-text gold-underline">
                STAY CONSTRUCTIVE
              </p>
              <p class="is-size-4 has-text-weight-semibold gold-text gold-underline">
                REPRESENT 21ST CENTURY WORLD
              </p>
            </div>
          </div>
          <div class="column is-half has-text-centered">
            <div class="signature-container">
              <img src="https://nakamata.tech/assets/home/my_name_gold.png" alt="Masahiro Nakamata Signature" class="signature" />
            </div>
            <div class="profile-info">
              <h3 class="is-size-3 has-text-white">Hi, I'm Masahiro Nakamata</h3>
              <p class="is-size-5 has-text-white-ter">Backend Engineer</p>
              <p class="is-size-6 has-text-grey-light">
                The name art was made by <a href="#" class="has-text-warning">&#64;ToshimuX</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </app-hero>
  `,
  styleUrl: './home.component.scss'
})
export class HomeComponent {}