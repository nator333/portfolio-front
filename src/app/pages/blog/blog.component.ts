import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { HttpClientModule } from "@angular/common/http";
import { HeroComponent } from "../../components/hero/hero.component";
import { BlogService, BlogPost } from "../../services/blog.service";

@Component({
  selector: "app-blog",
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule, HeroComponent],
  template: `
    <app-hero title="Blog" subtitle="My Thoughts & Insights"> </app-hero>

    <section class="section">
      <div class="container">
        @if (loading) {
          <div class="has-text-centered">
            <p class="has-text-white">Loading blog posts...</p>
          </div>
        } @else if (error) {
          <div class="has-text-centered">
            <p class="has-text-danger">{{ error }}</p>
          </div>
        } @else {
          <div class="columns is-multiline">
            @for (post of blogPosts; track post.id) {
              <div class="column is-one-third">
                <div class="card blog-card">
                  <div class="card-image">
                    <figure class="image is-4by3">
                      <img [src]="post.image" [alt]="post.title" />
                    </figure>
                  </div>
                  <div class="card-content">
                    <div class="media">
                      <div class="media-content">
                        <p class="title is-4 has-text-white">
                          {{ post.title }}
                        </p>
                        <p class="subtitle is-6 has-text-grey-light">
                          {{ post.date | date:'mediumDate' }}
                        </p>
                      </div>
                    </div>
                    <div class="content has-text-white-bis">
                      {{ post.summary }}
                      <br />
                      <div class="tags">
                        @for (tag of post.tags; track tag) {
                          <span class="tag is-primary">{{ tag }}</span>
                        }
                      </div>
                    </div>
                  </div>
                  <footer class="card-footer">
                    <a
                      [routerLink]="[post.url]"
                      class="card-footer-item has-text-primary"
                    >
                      Read More
                    </a>
                  </footer>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styleUrl: "./blog.component.scss",
})
export class BlogComponent implements OnInit {
  blogPosts: BlogPost[] = [];
  loading = true;
  error = '';

  constructor(private blogService: BlogService) {}

  ngOnInit(): void {
    this.blogService.getAllPosts().subscribe({
      next: (posts) => {
        this.blogPosts = posts;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading blog posts:', err);
        this.error = 'Error loading blog posts. Please try again later.';
        this.loading = false;
      }
    });
  }
}
