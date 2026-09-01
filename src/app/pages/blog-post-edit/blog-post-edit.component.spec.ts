import { ComponentFixture, TestBed } from "@angular/core/testing";
import { Router } from "@angular/router";
import { of, throwError } from "rxjs";
import { BlogPostEditComponent } from "./blog-post-edit.component";
import { BlogService } from "../../services/blog.service";
import { AuthService } from "../../services/auth.service";
import { MediaService } from "../../services/media.service";
import { BlogData } from "../../models/blog-data";

const savedBlog: BlogData = {
  posts: [
    {
      title: "Older Post",
      date: "2023-01-01T00:00:00.000Z",
      summary: "The older one.",
      tags: ["Angular"],
      url: "/blog/older-post",
      content: "## Older",
    },
    {
      title: "Newer Post",
      date: "2024-06-01T00:00:00.000Z",
      summary: "The newer one.",
      tags: ["AWS", "DynamoDB"],
      url: "/blog/newer-post",
      image: "assets/blog/newer.png",
      content: "## Newer",
      createdAt: "2024-05-01T09:00:00.000Z",
      updatedAt: "2024-06-01T09:00:00.000Z",
    },
  ],
};

describe("BlogPostEditComponent", () => {
  let blogService: jasmine.SpyObj<BlogService>;
  let router: jasmine.SpyObj<Router>;

  async function setup(slug: string | null): Promise<BlogPostEditComponent> {
    blogService = jasmine.createSpyObj<BlogService>("BlogService", [
      "getBlogData",
      "updateBlog",
    ]);
    blogService.getBlogData.and.returnValue(of(savedBlog));
    blogService.updateBlog.and.callFake((data) => of(data));
    router = jasmine.createSpyObj<Router>("Router", ["navigateByUrl"]);

    await TestBed.configureTestingModule({
      imports: [BlogPostEditComponent],
      providers: [
        { provide: BlogService, useValue: blogService },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { logout: () => undefined } },
        { provide: MediaService, useValue: { list: () => of([]) } },
      ],
    }).compileComponents();

    const fixture: ComponentFixture<BlogPostEditComponent> =
      TestBed.createComponent(BlogPostEditComponent);
    // The `slug` route param is bound as a component input in production; set it
    // directly here since there is no router to bind it.
    fixture.componentRef.setInput("slug", slug ?? undefined);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  it("should start empty in new mode", async () => {
    const component = await setup(null);
    expect(component.isNew).toBe(true);
    expect(component.form.get("title")?.value).toBe("");
  });

  it("should prefill the form for an existing post", async () => {
    const component = await setup("newer-post");
    expect(component.isNew).toBe(false);
    expect(component.form.get("title")?.value).toBe("Newer Post");
    expect(component.form.get("tags")?.value).toBe("AWS, DynamoDB");
    expect(component.form.get("url")?.value).toBe("/blog/newer-post");
  });

  it("should flag a missing post", async () => {
    const component = await setup("does-not-exist");
    expect(component.notFound()).toBe(true);
  });

  it("should replace the edited post and keep the others, then navigate back", async () => {
    const component = await setup("newer-post");
    component.form.get("title")?.setValue("Renamed");
    component.save();

    const saved = blogService.updateBlog.calls.mostRecent().args[0];
    expect(saved.posts.length).toBe(2);
    const renamed = saved.posts.find((p) => p.url === "/blog/newer-post");
    expect(renamed?.title).toBe("Renamed");
    // The untouched post survives.
    expect(saved.posts.some((p) => p.url === "/blog/older-post")).toBe(true);
    expect(router.navigateByUrl).toHaveBeenCalledWith("/blog-edit");
  });

  it("should prepend a new post to the document", async () => {
    const component = await setup(null);
    component.form.reset({
      title: "Brand New",
      date: "2025-01-01",
      summary: "",
      tags: "Angular",
      url: "/blog/brand-new",
      image: "",
      content: "Body",
      draft: false,
    });
    component.save();

    const saved = blogService.updateBlog.calls.mostRecent().args[0];
    expect(saved.posts.length).toBe(3);
    expect(saved.posts[0].url).toBe("/blog/brand-new");
    expect(saved.posts[0].draft).toBeUndefined();
  });

  it("should omit lang when it is the default", async () => {
    const component = await setup(null);
    component.form.reset({
      title: "Default Lang",
      date: "2025-01-01",
      summary: "",
      tags: "",
      url: "/blog/default-lang",
      image: "",
      content: "Body",
      draft: false,
      lang: "en",
    });
    component.save();

    const saved = blogService.updateBlog.calls.mostRecent().args[0];
    expect(saved.posts[0].lang).toBeUndefined();
  });

  it("should stamp createdAt and updatedAt together on a new post", async () => {
    const component = await setup(null);
    const before = Date.now();
    component.form.reset({
      title: "Timestamped",
      date: "2025-01-01",
      summary: "",
      tags: "",
      url: "/blog/timestamped",
      image: "",
      content: "Body",
      draft: false,
      lang: "en",
    });
    component.save();

    const saved = blogService.updateBlog.calls.mostRecent().args[0];
    const created = saved.posts[0].createdAt as string;
    const updated = saved.posts[0].updatedAt as string;
    // A brand-new post is created and updated at the same instant.
    expect(created).toBe(updated);
    expect(Date.parse(created)).toBeGreaterThanOrEqual(before);
  });

  it("should preserve createdAt but refresh updatedAt when editing", async () => {
    const component = await setup("newer-post");
    component.form.get("title")?.setValue("Renamed");
    component.save();

    const saved = blogService.updateBlog.calls.mostRecent().args[0];
    const edited = saved.posts.find((p) => p.url === "/blog/newer-post");
    // createdAt carries over from the stored post; updatedAt moves forward.
    expect(edited?.createdAt).toBe("2024-05-01T09:00:00.000Z");
    expect(edited?.updatedAt).not.toBe("2024-06-01T09:00:00.000Z");
    expect(Date.parse(edited?.updatedAt as string)).toBeGreaterThan(
      Date.parse("2024-06-01T09:00:00.000Z"),
    );
  });

  it("should persist a non-default post language", async () => {
    const component = await setup(null);
    component.form.reset({
      title: "日本語の投稿",
      date: "2025-01-01",
      summary: "",
      tags: "",
      url: "/blog/nihongo",
      image: "",
      content: "本文",
      draft: false,
      lang: "ja",
    });
    component.save();

    const saved = blogService.updateBlog.calls.mostRecent().args[0];
    expect(saved.posts[0].lang).toBe("ja");
  });

  it("should reject a url that collides with another post", async () => {
    const component = await setup("newer-post");
    component.form.get("url")?.setValue("/blog/older-post");
    component.save();

    expect(blogService.updateBlog).not.toHaveBeenCalled();
    expect(component.errorMessage()).toBe("Another post already uses that URL.");
  });

  it("should require a confirm click before deleting", async () => {
    const component = await setup("newer-post");
    component.delete();
    expect(component.confirmingDelete()).toBe(true);
    expect(blogService.updateBlog).not.toHaveBeenCalled();

    component.delete();
    const saved = blogService.updateBlog.calls.mostRecent().args[0];
    expect(saved.posts.map((p) => p.url)).toEqual(["/blog/older-post"]);
    expect(router.navigateByUrl).toHaveBeenCalledWith("/blog-edit");
  });

  it("should block saving when the document failed to load", async () => {
    blogService = jasmine.createSpyObj<BlogService>("BlogService", [
      "getBlogData",
      "updateBlog",
    ]);
    blogService.getBlogData.and.returnValue(of(null));
    router = jasmine.createSpyObj<Router>("Router", ["navigateByUrl"]);
    await TestBed.configureTestingModule({
      imports: [BlogPostEditComponent],
      providers: [
        { provide: BlogService, useValue: blogService },
        { provide: Router, useValue: router },
        { provide: AuthService, useValue: { logout: () => undefined } },
        { provide: MediaService, useValue: { list: () => of([]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(BlogPostEditComponent);
    // No slug input => new-post mode, matching the previous empty paramMap.
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.form.get("title")?.setValue("x");
    component.form.get("url")?.setValue("/blog/x");
    component.save();

    expect(blogService.updateBlog).not.toHaveBeenCalled();
    expect(component.loadFailed()).toBe(true);
  });

  it("should surface a save failure without navigating", async () => {
    const component = await setup("newer-post");
    blogService.updateBlog.and.returnValue(throwError(() => new Error("nope")));
    component.save();
    expect(component.errorMessage()).toBe("Could not save the post.");
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
