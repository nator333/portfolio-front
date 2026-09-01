import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  afterRenderEffect,
  inject,
  input,
  signal,
} from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { Router } from "@angular/router";
import { Title } from "@angular/platform-browser";
import { HttpClientModule } from "@angular/common/http";
import { BlogService, BlogPost } from "../../services/blog.service";
import { pageTitle } from "../../title-strategy";
import { runMermaid } from "../../utils/mermaid.util";
import * as Prism from "prismjs";

@Component({
  selector: "app-blog-post",
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, HttpClientModule],
  template: `
    <section class="section">
      <div class="container">
        <div class="blog-post-container">
          @if (loading()) {
            <div class="has-text-centered">
              <p class="has-text-white">Loading...</p>
            </div>
          } @else if (error()) {
            <div class="has-text-centered">
              <p class="has-text-danger">{{ error() }}</p>
              <button class="button is-primary mt-4" (click)="goBack()">
                Back to Blog
              </button>
            </div>
          } @else if (post(); as p) {
            <div class="blog-post-header">
              @if (p.draft) {
                <span class="tag is-warning mb-2">Draft</span>
              }
              <h1 class="title is-2 has-text-white" [attr.lang]="p.lang">
                {{ p.title }}
              </h1>
              <p class="subtitle is-5 has-text-grey-light">
                {{ p.date | date: "longDate" }}
              </p>
              <div class="tags">
                @for (tag of p.tags; track tag) {
                  <span class="tag is-primary">{{ tag }}</span>
                }
              </div>
            </div>

            @if (p.image) {
              <div class="blog-post-image">
                <figure class="image is-16by9">
                  <img
                    [ngSrc]="p.image"
                    [alt]="p.title"
                    fill
                    priority
                    class="eye-catch-image"
                  />
                </figure>
              </div>
            }

            <div
              class="blog-post-content has-text-white-bis"
              [attr.lang]="p.lang"
            >
              <!-- Using innerHTML to render pre-generated HTML content -->
              <div [innerHTML]="p.content"></div>
            </div>

            <div class="has-text-centered mt-6">
              <button class="button is-primary" (click)="goBack()">
                Back to Blog
              </button>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./blog-post.component.scss",
})
export class BlogPostComponent implements OnInit {
  /** The `:url` route segment, bound from the router via component input binding. */
  readonly url = input<string>();

  readonly post = signal<BlogPost | undefined>(undefined);
  readonly loading = signal(true);
  readonly error = signal("");

  private router = inject(Router);
  private blogService = inject(BlogService);
  private title = inject(Title);

  constructor() {
    // Highlight code and render Mermaid diagrams once the post's content is in
    // the DOM. afterRenderEffect re-runs after render when `post` changes —
    // replacing an ngAfterViewChecked that fired on every change-detection pass.
    afterRenderEffect(() => {
      if (this.post()) {
        Prism.highlightAll();
        void runMermaid(document.body);
      }
    });
  }

  ngOnInit(): void {
    // Scrolling on navigation is handled by the router's scrollPositionRestoration.

    const url = this.url();
    if (!url) {
      this.error.set("Blog post not found");
      this.loading.set(false);
      this.title.setTitle(pageTitle("Post not found"));
      return;
    }

    // Get the blog post by URL
    this.blogService.getPostByUrl(`/blog/${url}`).subscribe({
      next: (post) => {
        if (post) {
          this.post.set(post);
          this.loading.set(false);
          // The route carries no static title; brand the post's own.
          this.title.setTitle(pageTitle(post.title));
        } else {
          this.error.set("Blog post not found");
          this.loading.set(false);
          this.title.setTitle(pageTitle("Post not found"));
        }
      },
      error: (err) => {
        console.error("Error loading blog post:", err);
        this.error.set("Error loading blog post");
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(["/blog"]);
  }
}
