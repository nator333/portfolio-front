import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { NgOptimizedImage } from "@angular/common";

import { HeroComponent } from "../../components/hero/hero.component";
import { ProjectsService } from "../../services/projects.service";

@Component({
  selector: "app-projects",
  standalone: true,
  imports: [HeroComponent, NgOptimizedImage],
  template: `
    <app-hero title="Projects" subtitle="My Work & Contributions"> </app-hero>

    <section class="section">
      <div class="container">
        @if (projectsResource.isLoading()) {
          <p class="has-text-white has-text-centered">Loading projects…</p>
        } @else if (projectsResource.error()) {
          <p class="has-text-danger has-text-centered">
            Couldn't load projects. Please try again later.
          </p>
        } @else {
          <div class="columns is-multiline">
            @for (project of projects(); track $index) {
            <div class="column is-one-third">
              <div class="card project-card">
                @if (project.image) {
                  <div class="card-image">
                    <figure class="image is-4by3">
                      <img [ngSrc]="project.image" [alt]="project.title" fill />
                    </figure>
                  </div>
                }
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
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./projects.component.scss",
})
export class ProjectsComponent {
  private projectsService = inject(ProjectsService);

  /**
   * Projects fetched through the service (which keeps its sessionStorage
   * quota-cache), exposed as a signal resource: the template reads its
   * loading/error/value states directly instead of a manual subscription.
   */
  readonly projectsResource = rxResource({
    stream: () => this.projectsService.getProjects(),
  });

  readonly projects = computed(
    () => this.projectsResource.value()?.projects ?? [],
  );
}
