import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  signal,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";

import { HeroComponent } from "../../components/hero/hero.component";
import { CvService } from "../../services/cv.service";
import { downloadCvPdf } from "../../utils/cv-pdf.util";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [HeroComponent],
  template: `
    <app-hero
      title="Profile"
      subtitle="About Hiro Nakamata"
      [showContent]="true"
    >
      <button
        class="button is-primary"
        type="button"
        [disabled]="downloadingCv()"
        (click)="downloadCv()"
      >
        Download CV (PDF)
      </button>
      @if (downloadError()) {
        <p class="has-text-danger">{{ downloadError() }}</p>
      }
    </app-hero>

    <section class="section profile-section">
      <div class="container">
        @if (summary()) {
          <div class="profile-block">
            <h2 class="title is-3 has-text-centered">Summary</h2>
            <p class="has-text-centered summary-text">{{ summary() }}</p>
          </div>
        }

        @if (skillCategories().length) {
          <div class="profile-block">
            <h2 class="title is-3 has-text-centered">Technical Skills</h2>
            <div class="columns is-multiline">
              @for (category of skillCategories(); track category.category) {
                <div class="column is-half">
                  <div class="skillBox">
                    <h3 class="subtitle is-5 has-text-centered">
                      {{ category.category }}
                    </h3>
                    <div class="skill-list">
                      @for (skill of category.skills; track skill) {
                        <span class="skill-tag">{{ skill }}</span>
                      }
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        @if (experience().length) {
          <div class="profile-block">
            <h2 class="title is-3 has-text-centered">Experience</h2>
            @for (entry of experience(); track $index) {
              <div class="timeline-entry">
                <div class="entry-head">
                  <span class="entry-role">{{ entry.role }}</span>
                  <span class="entry-company">{{ entry.company }}</span>
                </div>
                <p class="entry-dates">
                  {{ entry.startDate }} – {{ entry.endDate }}
                </p>
                @if (entry.bullets.length) {
                  <ul class="entry-bullets">
                    @for (bullet of entry.bullets; track bullet) {
                      <li>{{ bullet }}</li>
                    }
                  </ul>
                }
                @if (entry.techstack) {
                  <p class="entry-techstack">
                    <span class="techstack-label">Techstack:</span>
                    {{ entry.techstack }}
                  </p>
                }
              </div>
            }
          </div>
        }

        @if (education().length) {
          <div class="profile-block">
            <h2 class="title is-3 has-text-centered">Education</h2>
            @for (entry of education(); track $index) {
              <div class="timeline-entry">
                <div class="entry-head">
                  <span class="entry-role">{{ entry.degree }}</span>
                  <span class="entry-company">{{ entry.institution }}</span>
                </div>
                <p class="entry-dates">
                  {{ entry.startDate }} – {{ entry.endDate }}
                </p>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./profile.component.scss",
})
export class ProfileComponent {
  private cvService = inject(CvService);

  /**
   * The CV document, fetched through the service (which keeps its
   * sessionStorage quota-cache) and exposed as a signal resource; the sections
   * below derive from it.
   */
  private readonly cvResource = rxResource({
    stream: () => this.cvService.getCv(),
  });

  // Resolved CV, or null while loading or on error (value() throws when the
  // resource has errored, so guard the reads with hasValue()).
  private readonly cv = computed(() =>
    this.cvResource.hasValue() ? this.cvResource.value() : null,
  );

  readonly summary = computed(() => this.cv()?.summary ?? "");
  readonly skillCategories = computed(() => this.cv()?.technicalSkills ?? []);
  readonly experience = computed(() => this.cv()?.experience ?? []);
  readonly education = computed(() => this.cv()?.education ?? []);

  readonly downloadingCv = signal(false);
  readonly downloadError = signal("");

  downloadCv(): void {
    this.downloadingCv.set(true);
    this.downloadError.set("");
    this.cvService.getCv().subscribe({
      next: (data) => {
        downloadCvPdf(data).finally(() => this.downloadingCv.set(false));
      },
      error: () => {
        this.downloadError.set("Could not download CV right now.");
        this.downloadingCv.set(false);
      },
    });
  }
}
