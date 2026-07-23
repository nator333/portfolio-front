import { Component, OnInit, ChangeDetectionStrategy } from "@angular/core";

import { HeroComponent } from "../../components/hero/hero.component";
import { ProjectsService } from "../../services/projects.service";
import { ProjectEntry } from "../../models/project-data";

@Component({
  selector: "app-projects",
  standalone: true,
  imports: [HeroComponent],
  template: `
    <app-hero title="Projects" subtitle="My Work & Contributions"> </app-hero>

    <section class="section">
      <div class="container">
        <div class="columns is-multiline">
          @for (project of projects; track $index) {
            <div class="column is-one-third">
              <div class="card project-card">
                <div class="card-image">
                  <figure class="image is-4by3">
                    <img [src]="project.image" [alt]="project.title" />
                  </figure>
                </div>
                <div class="card-content">
                  <div class="media">
                    <div class="media-content">
                      <p class="title is-4 has-text-white">
                        {{ project.title }}
                      </p>
                      <p class="subtitle is-6 has-text-grey-light">
                        {{ project.tech }}
                      </p>
                    </div>
                  </div>
                  <div class="content has-text-white-bis">
                    {{ project.description }}
                    <br />
                    <div class="tags">
                      @for (tag of project.tags; track tag) {
                        <span class="tag is-primary">{{ tag }}</span>
                      }
                    </div>
                  </div>
                </div>
                <footer class="card-footer">
                  @if (project.liveUrl) {
                    <a
                      [href]="project.liveUrl"
                      target="_blank"
                      class="card-footer-item has-text-primary"
                    >
                      Live Demo
                    </a>
                  }
                  @if (project.githubUrl) {
                    <a
                      [href]="project.githubUrl"
                      target="_blank"
                      class="card-footer-item has-text-primary"
                    >
                      GitHub
                    </a>
                  }
                </footer>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./projects.component.scss",
})
export class ProjectsComponent implements OnInit {
  projects: ProjectEntry[] = [];

  constructor(private projectsService: ProjectsService) {}

  ngOnInit(): void {
    this.projectsService.getProjects().subscribe({
      next: (data) => {
        this.projects = data.projects ?? [];
      },
      // Leave the list empty on error.
      error: () => undefined,
    });
  }
}
