import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";

import { Router } from "@angular/router";
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { HeroComponent } from "../../components/hero/hero.component";
import { AuthService } from "../../services/auth.service";
import { BlogService } from "../../services/blog.service";
import { BlogData, BlogPostEntry } from "../../models/blog-data";
import { renderBlogMarkdown } from "../../utils/blog-markdown.util";

@Component({
  selector: "app-blog-edit",
  standalone: true,
  imports: [ReactiveFormsModule, HeroComponent],
  templateUrl: "./blog-edit.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./blog-edit.component.scss",
})
export class BlogEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private blogService = inject(BlogService);
  private router = inject(Router);

  loading = false;
  saving = false;
  /**
   * Saving replaces the whole stored document, so it stays blocked until the
   * current document has actually been loaded — otherwise a failed load
   * followed by Save would wipe the existing posts.
   */
  loadFailed = false;
  errorMessage = "";
  successMessage = "";

  blogForm: FormGroup = this.fb.group({
    posts: this.fb.array([]),
  });

  // Keyed by form group (not index) so open previews survive removals.
  private openPreviews = new Set<FormGroup>();

  ngOnInit(): void {
    this.loadBlog();
  }

  get postControls(): FormGroup[] {
    return (this.blogForm.get("posts") as FormArray).controls as FormGroup[];
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl("/home");
  }

  addPost(): void {
    // Newest posts go on top in the editor, matching the public list order.
    (this.blogForm.get("posts") as FormArray).insert(0, this.createPostGroup());
  }

  removePost(index: number): void {
    const posts = this.blogForm.get("posts") as FormArray;
    this.openPreviews.delete(posts.at(index) as FormGroup);
    posts.removeAt(index);
  }

  /** Prefills the url from the title for new posts, once the title is typed. */
  suggestUrl(group: FormGroup): void {
    const url = (group.get("url")?.value as string) ?? "";
    const title = (group.get("title")?.value as string) ?? "";
    if (url || !title) {
      return;
    }
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (slug) {
      group.get("url")?.setValue(`/blog/${slug}`);
    }
  }

  togglePreview(group: FormGroup): void {
    if (this.openPreviews.has(group)) {
      this.openPreviews.delete(group);
    } else {
      this.openPreviews.add(group);
    }
  }

  isPreviewOpen(group: FormGroup): boolean {
    return this.openPreviews.has(group);
  }

  previewHtml(group: FormGroup): string {
    return renderBlogMarkdown((group.get("content")?.value as string) ?? "");
  }

  save(): void {
    if (this.loadFailed) {
      this.errorMessage =
        "Reload the page first — the saved blog could not be loaded.";
      return;
    }
    if (this.blogForm.invalid) {
      this.blogForm.markAllAsTouched();
      this.errorMessage = "Fix the highlighted fields before saving.";
      return;
    }
    this.saving = true;
    this.errorMessage = "";
    this.successMessage = "";
    this.blogService.updateBlog(this.buildBlogData()).subscribe({
      next: () => {
        this.saving = false;
        this.successMessage = "Blog saved.";
      },
      error: () => {
        this.saving = false;
        this.errorMessage = "Could not save the blog.";
      },
    });
  }

  private createPostGroup(entry?: BlogPostEntry): FormGroup {
    return this.fb.group({
      title: [entry?.title ?? "", Validators.required],
      // The date input works with plain yyyy-MM-dd values.
      date: [
        (entry?.date ?? new Date().toISOString()).slice(0, 10),
        Validators.required,
      ],
      summary: [entry?.summary ?? ""],
      tags: [entry?.tags?.join(", ") ?? ""],
      url: [
        entry?.url ?? "",
        [Validators.required, Validators.pattern(/^\/blog\/\S+$/)],
      ],
      image: [entry?.image ?? ""],
      content: [entry?.content ?? ""],
    });
  }

  private loadBlog(): void {
    this.loading = true;
    this.blogService.getBlogData().subscribe((data) => {
      if (!data) {
        this.loadFailed = true;
        this.errorMessage = "Could not load the saved blog.";
        this.loading = false;
        return;
      }
      this.loadFailed = false;
      const posts = this.blogForm.get("posts") as FormArray;
      posts.clear();
      [...data.posts]
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .forEach((entry) => posts.push(this.createPostGroup(entry)));
      this.loading = false;
    });
  }

  private buildBlogData(): BlogData {
    const value = this.blogForm.value as {
      posts: {
        title: string;
        date: string;
        summary: string;
        tags: string;
        url: string;
        image: string;
        content: string;
      }[];
    };
    return {
      posts: value.posts.map((entry) => ({
        title: entry.title.trim(),
        date: entry.date,
        summary: entry.summary.trim(),
        tags: entry.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        url: entry.url.trim(),
        // Omitted when blank so the stored document stays clean.
        image: entry.image.trim() || undefined,
        content: entry.content,
      })),
    };
  }
}
