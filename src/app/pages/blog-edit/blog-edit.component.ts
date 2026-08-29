import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";

import { DatePipe } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { HeroComponent } from "../../components/hero/hero.component";
import { AuthService } from "../../services/auth.service";
import { BlogService } from "../../services/blog.service";
import { BlogPostEntry } from "../../models/blog-data";
import { blogSlug } from "./blog-edit.util";

/**
 * Blog admin landing page: lists the saved posts and links each to the
 * dedicated editor. Editing and creation live on /blog-edit/:slug and
 * /blog-edit/new respectively.
 */
@Component({
  selector: "app-blog-edit",
  standalone: true,
  imports: [DatePipe, RouterLink, HeroComponent],
  templateUrl: "./blog-edit.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./blog-edit.component.scss",
})
export class BlogEditComponent implements OnInit {
  private authService = inject(AuthService);
  private blogService = inject(BlogService);
  private router = inject(Router);

  loading = false;
  loadFailed = false;
  posts: BlogPostEntry[] = [];

  ngOnInit(): void {
    this.loadBlog();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl("/home");
  }

  /** The route param the editor uses to locate this post. */
  slugOf(post: BlogPostEntry): string {
    return blogSlug(post.url);
  }

  private loadBlog(): void {
    this.loading = true;
    this.blogService.getBlogData().subscribe((data) => {
      if (!data) {
        this.loadFailed = true;
        this.loading = false;
        return;
      }
      this.loadFailed = false;
      // Newest first, matching the public list order.
      this.posts = [...data.posts].sort(
        (a, b) => Date.parse(b.date) - Date.parse(a.date),
      );
      this.loading = false;
    });
  }
}
