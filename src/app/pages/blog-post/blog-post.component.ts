import {
  Component,
  OnInit,
  AfterViewChecked,
  ChangeDetectionStrategy,
  inject,
  input,
} from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { Router } from "@angular/router";
import { HttpClientModule } from "@angular/common/http";
import { BlogService, BlogPost } from "../../services/blog.service";
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
          @if (loading) {
            <div class="has-text-centered">
              <p class="has-text-white">Loading...</p>
            </div>
          } @else if (error) {
            <div class="has-text-centered">
              <p class="has-text-danger">{{ error }}</p>
              <button class="button is-primary mt-4" (click)="goBack()">
                Back to Blog
              </button>
            </div>
          } @else if (post) {
            <div class="blog-post-header">
              @if (post.draft) {
                <span class="tag is-warning mb-2">Draft</span>
              }
              <h1 class="title is-2 has-text-white" [attr.lang]="post.lang">
                {{ post.title }}
              </h1>
              <p class="subtitle is-5 has-text-grey-light">
                {{ post.date | date: "longDate" }}
              </p>
              <div class="tags">
                @for (tag of post.tags; track tag) {
                  <span class="tag is-primary">{{ tag }}</span>
                }
              </div>
            </div>

            @if (post.image) {
              <div class="blog-post-image">
                <figure class="image is-16by9">
                  <img
                    [ngSrc]="post.image"
                    [alt]="post.title"
                    fill
                    priority
                    class="eye-catch-image"
                  />
                </figure>
              </div>
            }

            <div
              class="blog-post-content has-text-white-bis"
              [attr.lang]="post.lang"
            >
              <!-- Using innerHTML to render pre-generated HTML content -->
              <div [innerHTML]="post.content"></div>
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
export class BlogPostComponent implements OnInit, AfterViewChecked {
  /** The `:url` route segment, bound from the router via component input binding. */
  readonly url = input<string>();

  post: BlogPost | undefined;
  loading = true;
  error = "";
  private highlightedCode = false;

  private router = inject(Router);
  private blogService = inject(BlogService);

  ngOnInit(): void {
    // Scrolling on navigation is handled by the router's scrollPositionRestoration.

    const url = this.url();
    if (!url) {
      this.error = "Blog post not found";
      this.loading = false;
      return;
    }

    // Get the blog post by URL
    this.blogService.getPostByUrl(`/blog/${url}`).subscribe({
      next: (post) => {
        if (post) {
          this.post = post;
          this.loading = false;
        } else {
          this.error = "Blog post not found";
          this.loading = false;
        }
      },
      error: (err) => {
        console.error("Error loading blog post:", err);
        this.error = "Error loading blog post";
        this.loading = false;
      },
    });
  }

  goBack(): void {
    this.router.navigate(["/blog"]);
  }

  // Highlight code and render Mermaid diagrams once the content is in the DOM.
  ngAfterViewChecked(): void {
    if (this.post && !this.loading && !this.highlightedCode) {
      Prism.highlightAll();
      void runMermaid(document.body);
      this.highlightedCode = true;
    }
  }
}
