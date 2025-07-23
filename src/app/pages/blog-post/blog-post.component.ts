import { Component, OnInit, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { BlogService, BlogPost } from '../../services/blog.service';
import * as Prism from 'prismjs';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
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
              <h1 class="title is-2 has-text-white">{{ post.title }}</h1>
              <p class="subtitle is-5 has-text-grey-light">
                {{ post.date | date:'longDate' }}
              </p>
              <div class="tags">
                @for (tag of post.tags; track tag) {
                  <span class="tag is-primary">{{ tag }}</span>
                }
              </div>
            </div>

            <!-- Eye-catch image -->
            <div class="blog-post-image">
              <figure class="image is-16by9">
                <img [src]="post.image" [alt]="post.title" class="eye-catch-image" />
              </figure>
            </div>

            <div class="blog-post-content has-text-white-bis">
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
  styleUrl: './blog-post.component.scss',
})
export class BlogPostComponent implements OnInit, AfterViewChecked {
  post: BlogPost | undefined;
  loading = true;
  error = '';
  private highlightedCode = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private blogService: BlogService
  ) {}

  ngOnInit(): void {
    // Scroll to top when component initializes
    window.scrollTo(0, 0);

    // Get the URL parameter
    const url = this.route.snapshot.paramMap.get('url');
    if (!url) {
      this.error = 'Blog post not found';
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
          this.error = 'Blog post not found';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading blog post:', err);
        this.error = 'Error loading blog post';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/blog']);
  }

  // Initialize Prism.js after the view is rendered
  ngAfterViewChecked(): void {
    if (this.post && !this.loading && !this.highlightedCode) {
      // Highlight all code blocks
      Prism.highlightAll();
      this.highlightedCode = true;
    }
  }
}
