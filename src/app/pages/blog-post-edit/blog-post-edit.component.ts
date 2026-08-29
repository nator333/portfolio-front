import {
  Component,
  inject,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";

import { ActivatedRoute, Router } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { HeroComponent } from "../../components/hero/hero.component";
import { ImageUploadComponent } from "../../components/image-upload/image-upload.component";
import { MarkdownEditorComponent } from "../../components/markdown-editor/markdown-editor.component";
import { AuthService } from "../../services/auth.service";
import { BlogService } from "../../services/blog.service";
import { MediaAsset, MediaService } from "../../services/media.service";
import { BlogData, BlogPostEntry } from "../../models/blog-data";
import { blogUrlFromSlug } from "../blog-edit/blog-edit.util";

/**
 * Dedicated editor for a single blog post, new or existing. The blog is stored
 * as one document with no per-post endpoint, so this loads the whole document,
 * edits (or appends) one post, and PUTs the merged result — leaving every other
 * post untouched.
 */
@Component({
  selector: "app-blog-post-edit",
  standalone: true,
  imports: [
    ReactiveFormsModule,
    HeroComponent,
    ImageUploadComponent,
    MarkdownEditorComponent,
  ],
  templateUrl: "./blog-post-edit.component.html",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./blog-post-edit.component.scss",
})
export class BlogPostEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private blogService = inject(BlogService);
  private mediaService = inject(MediaService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  /** Saved images offered in the eye-catch picker. */
  mediaAssets: MediaAsset[] = [];

  loading = false;
  saving = false;
  deleting = false;
  confirmingDelete = false;
  /**
   * Saving replaces the whole stored document, so it stays blocked until the
   * current document has actually been loaded — otherwise a failed load
   * followed by Save would wipe the existing posts.
   */
  loadFailed = false;
  notFound = false;
  errorMessage = "";
  successMessage = "";

  isNew = false;
  /** The url of the post being edited, to locate it on save. Empty when new. */
  private originalUrl = "";
  /** Every stored post, so the ones we are not editing survive the save. */
  private allPosts: BlogPostEntry[] = [];

  form: FormGroup = this.fb.group({
    title: ["", Validators.required],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    summary: [""],
    tags: [""],
    url: ["", [Validators.required, Validators.pattern(/^\/blog\/\S+$/)]],
    image: [""],
    content: [""],
    draft: [false],
  });

  ngOnInit(): void {
    this.loadMedia();
    this.loadBlog();
  }

  get heroSubtitle(): string {
    return this.isNew ? "New post" : "Edit post";
  }

  private loadMedia(): void {
    // Best-effort: the picker just has no saved options if this fails.
    this.mediaService.list().subscribe({
      next: (assets) => (this.mediaAssets = assets),
      error: () => (this.mediaAssets = []),
    });
  }

  private loadBlog(): void {
    const slug = this.route.snapshot.paramMap.get("slug");
    this.isNew = !slug;
    this.loading = true;

    this.blogService.getBlogData().subscribe((data) => {
      if (!data) {
        this.loadFailed = true;
        this.errorMessage = "Could not load the saved blog.";
        this.loading = false;
        return;
      }
      this.loadFailed = false;
      this.allPosts = data.posts;

      if (!this.isNew) {
        this.originalUrl = blogUrlFromSlug(slug as string);
        const existing = data.posts.find((p) => p.url === this.originalUrl);
        if (!existing) {
          this.notFound = true;
          this.loading = false;
          return;
        }
        this.fillForm(existing);
      }
      this.loading = false;
    });
  }

  private fillForm(entry: BlogPostEntry): void {
    this.form.reset({
      title: entry.title,
      // The date input works with plain yyyy-MM-dd values.
      date: entry.date.slice(0, 10),
      summary: entry.summary,
      tags: entry.tags.join(", "),
      url: entry.url,
      image: entry.image ?? "",
      content: entry.content,
      draft: entry.draft ?? false,
    });
  }

  /** Prefills the url from the title for a new post, once the title is typed. */
  suggestUrl(): void {
    if (!this.isNew) {
      return;
    }
    const url = (this.form.get("url")?.value as string) ?? "";
    const title = (this.form.get("title")?.value as string) ?? "";
    if (url || !title) {
      return;
    }
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    if (slug) {
      this.form.get("url")?.setValue(`/blog/${slug}`);
    }
  }

  save(): void {
    if (this.loadFailed) {
      this.errorMessage =
        "Reload the page first — the saved blog could not be loaded.";
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = "Fix the highlighted fields before saving.";
      return;
    }

    const entry = this.buildEntry();
    if (this.urlCollides(entry.url)) {
      this.errorMessage = "Another post already uses that URL.";
      return;
    }

    this.saving = true;
    this.errorMessage = "";
    this.successMessage = "";
    this.blogService.updateBlog(this.mergedDocument(entry)).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigateByUrl("/blog-edit");
      },
      error: () => {
        this.saving = false;
        this.errorMessage = "Could not save the post.";
      },
    });
  }

  delete(): void {
    if (this.isNew || this.loadFailed) {
      return;
    }
    if (!this.confirmingDelete) {
      this.confirmingDelete = true;
      return;
    }
    this.deleting = true;
    this.errorMessage = "";
    const remaining = this.allPosts.filter((p) => p.url !== this.originalUrl);
    this.blogService.updateBlog({ posts: remaining }).subscribe({
      next: () => {
        this.deleting = false;
        this.router.navigateByUrl("/blog-edit");
      },
      error: () => {
        this.deleting = false;
        this.confirmingDelete = false;
        this.errorMessage = "Could not delete the post.";
      },
    });
  }

  cancel(): void {
    this.router.navigateByUrl("/blog-edit");
  }

  /** True when `url` belongs to a different existing post. */
  private urlCollides(url: string): boolean {
    return this.allPosts.some(
      (p) => p.url === url && p.url !== this.originalUrl,
    );
  }

  private mergedDocument(entry: BlogPostEntry): BlogData {
    if (this.isNew) {
      // Newest on top, matching the list order.
      return { posts: [entry, ...this.allPosts] };
    }
    return {
      posts: this.allPosts.map((p) =>
        p.url === this.originalUrl ? entry : p,
      ),
    };
  }

  private buildEntry(): BlogPostEntry {
    const value = this.form.value as {
      title: string;
      date: string;
      summary: string;
      tags: string;
      url: string;
      image: string;
      content: string;
      draft: boolean;
    };
    return {
      title: value.title.trim(),
      date: value.date,
      summary: value.summary.trim(),
      tags: value.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      url: value.url.trim(),
      // Omitted when blank so the stored document stays clean.
      image: value.image.trim() || undefined,
      content: value.content,
      // Omitted when false so published posts stay clean.
      draft: value.draft || undefined,
    };
  }
}
