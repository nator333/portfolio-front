import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HeroComponent } from "../../components/hero/hero.component";
import { CvService } from "../../services/cv.service";
import { CvSkillCategory } from "../../models/cv-data";
import { downloadCvPdf } from "../../utils/cv-pdf.util";

// Shown when the CV API is unavailable (e.g. monthly quota exhausted), so the
// page never renders empty.
const FALLBACK_SUMMARY = "";
const FALLBACK_SKILLS: CvSkillCategory[] = [
  {
    category: "Languages",
    skills: ["HTML5", "SASS", "TypeScript", "JavaScript", "Kotlin", "Java", "Swift", "Objective-C"],
  },
  {
    category: "Frameworks",
    skills: ["Angular", "React", "Vue.js", "Node.js", "Spring Boot", "Ktor"],
  },
  {
    category: "Cloud Computing Platform",
    skills: ["EC2", "S3", "Lambda", "API Gateway", "Kinesis", "Redshift", "GCE", "Firebase"],
  },
  { category: "Database", skills: ["MySQL", "PostgreSQL", "SQLite", "Neo4j", "DynamoDB"] },
  {
    category: "Tools",
    skills: ["npm", "Gradle", "Maven", "Docker", "IntelliJ Ultimate", "Visual Studio Code", "Git"],
  },
];

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [CommonModule, HeroComponent],
  template: `
    <app-hero title="Profile" subtitle="About Hiro Nakamata" [showContent]="true">
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

    @if (summary) {
      <section class="section summary-section">
        <div class="container">
          <div class="skill-category">
            <h2 class="title is-3 has-text-centered has-text-white">Summary</h2>
            <p class="has-text-centered has-text-white summary-text">{{ summary }}</p>
          </div>
        </div>
      </section>
    }

    <section class="section skills-section">
      <div class="container">
        @for (category of skillCategories; track category.category) {
          <div class="skill-category">
            <h2 class="title is-3 has-text-centered has-text-white">
              {{ category.category }}
            </h2>
            <div class="skillBox has-text-centered">
              <div class="skill-list">
                @for (skill of category.skills; track skill) {
                  <span class="skill-tag">{{ skill }}</span>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: "./profile.component.scss",
})
export class ProfileComponent implements OnInit {
  downloadingCv = false;
  downloadError = "";
  summary = FALLBACK_SUMMARY;
  skillCategories: CvSkillCategory[] = FALLBACK_SKILLS;

  constructor(private cvService: CvService) {}

  ngOnInit(): void {
    this.cvService.getCv().subscribe({
      next: (data) => {
        if (data.technicalSkills?.length) {
          this.skillCategories = data.technicalSkills;
        }
        this.summary = data.summary || FALLBACK_SUMMARY;
      },
      // Keep the fallback content on error.
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
