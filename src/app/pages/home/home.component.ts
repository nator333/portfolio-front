import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="hero is-fullheight">
      <div class="hero-body">
        <div class="container">
          <div class="columns is-vcentered">
            <!-- Left Column - Text Content -->
            <div class="column is-half">
              <div class="motto-section">
                <h1 class="motto-line">KEEP ASKING YOURSELF WHY</h1>
                <h2 class="motto-line">STAY CONSTRUCTIVE</h2>
                <h3 class="motto-line">REPRESENT 21ST CENTURY WORLD</h3>
              </div>
            </div>

            <!-- Right Column - Signature and Profile -->
            <div class="column is-half">
              <div class="profile-section has-text-centered">
                <div class="signature-container">
                  <img
                    src="assets/home/my_name_gold.png"
                    alt="Hiro Nakamata Signature"
                    class="signature-image"
                  />
                </div>

                <div class="profile-info">
                  <h3 class="profile-name">Hi, I'm Hiro Nakamata</h3>
                  <p class="profile-title">Backend Engineer</p>
                  <p class="credit-line">
                    The name art was made by
                    <a href="#" class="artist-link">&#64;ToshimuX</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styleUrl: "./home.component.scss",
})
export class HomeComponent {}
