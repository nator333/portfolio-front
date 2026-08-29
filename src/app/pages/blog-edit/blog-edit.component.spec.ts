import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { BlogEditComponent } from "./blog-edit.component";
import { BlogService } from "../../services/blog.service";
import { AuthService } from "../../services/auth.service";
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
      draft: true,
    },
  ],
};

describe("BlogEditComponent (list)", () => {
  let fixture: ComponentFixture<BlogEditComponent>;
  let component: BlogEditComponent;
  let blogService: jasmine.SpyObj<BlogService>;

  beforeEach(async () => {
    blogService = jasmine.createSpyObj<BlogService>("BlogService", [
      "getBlogData",
    ]);
    blogService.getBlogData.and.returnValue(of(savedBlog));

    await TestBed.configureTestingModule({
      imports: [BlogEditComponent],
      providers: [
        provideRouter([]),
        { provide: BlogService, useValue: blogService },
        { provide: AuthService, useValue: { logout: () => undefined } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BlogEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should list posts newest first", () => {
    expect(component.posts.map((p) => p.title)).toEqual([
      "Newer Post",
      "Older Post",
    ]);
  });

  it("should link each post to its editor by slug", () => {
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll(".post-row"),
    );
    const hrefs = links.map((a) => a.getAttribute("href"));
    expect(hrefs).toContain("/blog-edit/newer-post");
    expect(hrefs).toContain("/blog-edit/older-post");
  });

  it("should offer an add-new link", () => {
    const add = fixture.nativeElement.querySelector(
      'a[href="/blog-edit/new"]',
    ) as HTMLAnchorElement;
    expect(add).toBeTruthy();
  });

  it("should badge draft posts", () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector(".tag.is-warning")?.textContent).toContain("Draft");
  });

  it("should flag a failed load without wiping the list to empty rows", () => {
    blogService.getBlogData.and.returnValue(of(null));
    const failed = TestBed.createComponent(BlogEditComponent);
    failed.detectChanges();
    expect(failed.componentInstance.loadFailed).toBe(true);
    expect(failed.componentInstance.posts).toEqual([]);
  });

  it("should derive the slug from a post url", () => {
    expect(component.slugOf(savedBlog.posts[0])).toBe("older-post");
  });
});
