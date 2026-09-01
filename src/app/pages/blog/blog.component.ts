import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
} from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { RouterLink } from "@angular/router";
import { HttpClientModule } from "@angular/common/http";
import { HeroComponent } from "../../components/hero/hero.component";
import { BlogService } from "../../services/blog.service";

@Component({
  selector: "app-blog",
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    RouterLink,
    HttpClientModule,
    HeroComponent,
  ],
  template: `
    <app-hero title="Blog" subtitle="My Thoughts"> </app-hero>

    <section class="section">
      <div class="container">
        @if (blogResource.isLoading()) {
          <div class="has-text-centered">
            <p class="has-text-white">Loading blog posts...</p>
          </div>
        } @else if (blogResource.error()) {
          <div class="has-text-centered">
            <p class="has-text-danger">
              Couldn't load blog posts. Please try again later.
            </p>
          </div>
        } @else {
          <div class="columns is-multiline">
            @for (post of blogPosts(); track post.id) {
              <div class="column is-one-third">
                <div class="card blog-card">
                  @if (post.image) {
                    <div class="card-image">
                      <figure class="image is-4by3">
                        <img [ngSrc]="post.image" [alt]="post.title" fill />
                      </figure>
                    </div>
                  }
                  <div class="card-content">
                    <div class="media">
                      <div class="media-content">
                        <p class="title is-4 has-text-white" [attr.lang]="post.lang">
                          @if (post.draft) {
                            <span class="tag is-warning mr-2">Draft</span>
                          }
                          {{ post.title }}
                        </p>
                        <p class="subtitle is-6 has-text-grey-light">
                          {{ post.date | date: "mediumDate" }}
                        </p>
                      </div>
                    </div>
                    <div class="content has-text-white-bis">
                      <span [attr.lang]="post.lang">{{ post.summary }}</span>
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./blog.component.scss",
})
export class BlogComponent {
  private blogService = inject(BlogService);

  /**
   * Blog posts fetched through the service (which keeps its sessionStorage
   * quota-cache), exposed as a signal resource so the template reads its
   * loading/value states directly instead of a manual subscription.
   */
  readonly blogResource = rxResource({
    stream: () => this.blogService.getAllPosts(),
  });

  readonly blogPosts = computed(() => this.blogResource.value() ?? []);
}
