import {
  Component,
  inject,
  input,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";

import { Router } from "@angular/router";
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
import {
  BlogData,
  BlogPostEntry,
  DEFAULT_BLOG_LANG,
} from "../../models/blog-data";
import { blogUrlFromSlug } from "../blog-edit/blog-edit.util";

/** Languages offered in the editor's post-language picker. */
export const BLOG_LANG_OPTIONS: ReadonlyArray<{ code: string; label: string }> =
  [
    { code: "en", label: "English" },
    { code: "ja", label: "日本語 (Japanese)" },
    { code: "fr", label: "Français (French)" },
  ];

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

  /** The `:slug` route segment (absent on the /new route), bound via component input binding. */
  readonly slug = input<string>();

  // These status fields are set from the async media/blog fetches and the
  // save/delete callbacks, so signals keep the view in sync under zoneless
  // change detection.

  /** Saved images offered in the eye-catch picker. */
  readonly mediaAssets = signal<MediaAsset[]>([]);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);
  readonly confirmingDelete = signal(false);
  /**
   * Saving replaces the whole stored document, so it stays blocked until the
   * current document has actually been loaded — otherwise a failed load
   * followed by Save would wipe the existing posts.
   */
  readonly loadFailed = signal(false);
  readonly notFound = signal(false);
  readonly errorMessage = signal("");
  readonly successMessage = signal("");

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
    lang: [DEFAULT_BLOG_LANG],
  });

  /** Options for the post-language `<select>`. */
  readonly langOptions = BLOG_LANG_OPTIONS;

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
      next: (assets) => this.mediaAssets.set(assets),
      error: () => this.mediaAssets.set([]),
    });
  }

  private loadBlog(): void {
    const slug = this.slug();
    this.isNew = !slug;
    this.loading.set(true);

    this.blogService.getBlogData().subscribe((data) => {
      if (!data) {
        this.loadFailed.set(true);
        this.errorMessage.set("Could not load the saved blog.");
        this.loading.set(false);
        return;
      }
      this.loadFailed.set(false);
      this.allPosts = data.posts;

      if (!this.isNew) {
        this.originalUrl = blogUrlFromSlug(slug as string);
        const existing = data.posts.find((p) => p.url === this.originalUrl);
        if (!existing) {
          this.notFound.set(true);
          this.loading.set(false);
          return;
        }
        this.fillForm(existing);
      }
      this.loading.set(false);
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
      lang: entry.lang ?? DEFAULT_BLOG_LANG,
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
    if (this.loadFailed()) {
      this.errorMessage.set(
        "Reload the page first — the saved blog could not be loaded.",
      );
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set("Fix the highlighted fields before saving.");
      return;
    }

    const entry = this.buildEntry();
    if (this.urlCollides(entry.url)) {
      this.errorMessage.set("Another post already uses that URL.");
      return;
    }

    this.saving.set(true);
    this.errorMessage.set("");
    this.successMessage.set("");
    this.blogService.updateBlog(this.mergedDocument(entry)).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigateByUrl("/blog-edit");
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set("Could not save the post.");
      },
    });
  }

  delete(): void {
    if (this.isNew || this.loadFailed()) {
      return;
    }
    if (!this.confirmingDelete()) {
      this.confirmingDelete.set(true);
      return;
    }
    this.deleting.set(true);
    this.errorMessage.set("");
    const remaining = this.allPosts.filter((p) => p.url !== this.originalUrl);
    this.blogService.updateBlog({ posts: remaining }).subscribe({
      next: () => {
        this.deleting.set(false);
        this.router.navigateByUrl("/blog-edit");
      },
      error: () => {
        this.deleting.set(false);
        this.confirmingDelete.set(false);
        this.errorMessage.set("Could not delete the post.");
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
      lang: string;
    };
    // Audit timestamps are managed here, not in the form: createdAt is carried
    // over from the existing post (backfilled for older posts that predate it),
    // and updatedAt is stamped fresh on every save.
    const now = new Date().toISOString();
    const existing = this.allPosts.find((p) => p.url === this.originalUrl);
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
      // Omitted when it matches the site default so existing docs stay clean.
      lang: value.lang !== DEFAULT_BLOG_LANG ? value.lang : undefined,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  }
}
