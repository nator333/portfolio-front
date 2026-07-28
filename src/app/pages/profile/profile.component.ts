import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";

import { HeroComponent } from "../../components/hero/hero.component";
import { CvService } from "../../services/cv.service";
import {
  CvEducationEntry,
  CvExperienceEntry,
  CvSkillCategory,
} from "../../models/cv-data";
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
        [disabled]="downloadingCv"
        (click)="downloadCv()"
      >
        Download CV (PDF)
      </button>
      @if (downloadError) {
        <p class="has-text-danger">{{ downloadError }}</p>
      }
    </app-hero>

    <section class="section profile-section">
      <div class="container">
        @if (summary) {
          <div class="profile-block">
            <h2 class="title is-3 has-text-centered">Summary</h2>
            <p class="has-text-centered summary-text">{{ summary }}</p>
          </div>
        }

        @if (skillCategories.length) {
          <div class="profile-block">
            <h2 class="title is-3 has-text-centered">Technical Skills</h2>
            <div class="columns is-multiline">
              @for (category of skillCategories; track category.category) {
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

        @if (experience.length) {
          <div class="profile-block">
            <h2 class="title is-3 has-text-centered">Experience</h2>
            @for (entry of experience; track $index) {
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

        @if (education.length) {
          <div class="profile-block">
            <h2 class="title is-3 has-text-centered">Education</h2>
            @for (entry of education; track $index) {
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
export class ProfileComponent implements OnInit {
  downloadingCv = false;
  downloadError = "";
  summary = "";
  skillCategories: CvSkillCategory[] = [];
  experience: CvExperienceEntry[] = [];
  education: CvEducationEntry[] = [];

  constructor(private cvService: CvService) {}

  ngOnInit(): void {
    this.cvService.getCv().subscribe({
      next: (data) => {
        this.skillCategories = data.technicalSkills ?? [];
        this.summary = data.summary ?? "";
        this.experience = data.experience ?? [];
        this.education = data.education ?? [];
      },
      error: () => undefined,
    });
  }

  downloadCv(): void {
    this.downloadingCv = true;
    this.downloadError = "";
    this.cvService.getCv().subscribe({
      next: (data) => {
        downloadCvPdf(data).finally(() => (this.downloadingCv = false));
      },
      error: () => {
        this.downloadError = "Could not download CV right now.";
        this.downloadingCv = false;
      },
    });
  }
}
