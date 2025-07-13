import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HeroComponent } from "../../components/hero/hero.component";

@Component({
  selector: "app-projects",
  standalone: true,
  imports: [CommonModule, HeroComponent],
  template: `
    <app-hero title="Projects" subtitle="My Work & Contributions"> </app-hero>

    <section class="section">
      <div class="container">
        <div class="columns is-multiline">
          @for (project of projects; track project.id) {
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
  styleUrl: "./projects.component.scss",
})
export class ProjectsComponent {
  projects = [
    {
      id: 1,
      title: "E-Commerce Platform",
      tech: "Spring Boot, React, PostgreSQL",
      description:
        "A full-stack e-commerce solution with microservices architecture.",
      image: "assets/public/projects/elementscpr.png",
      tags: ["Java", "Spring Boot", "React", "PostgreSQL"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
    {
      id: 2,
      title: "Real-time Chat Application",
      tech: "Node.js, Socket.io, MongoDB",
      description: "A real-time messaging app with WebSocket connectivity.",
      image: "assets/public/projects/SilverBullet.png",
      tags: ["Node.js", "Socket.io", "MongoDB", "WebSockets"],
      liveUrl: "https://example.com",
      githubUrl: "https://github.com",
    },
    {
      id: 3,
      title: "API Gateway Service",
      tech: "Kotlin, Ktor, Redis",
      description:
        "High-performance API gateway with rate limiting and caching.",
      image: "assets/public/projects/portfolio.png",
      tags: ["Kotlin", "Ktor", "Redis", "Microservices"],
      githubUrl: "https://github.com",
    },
  ];
}
