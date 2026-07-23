import { TestBed } from "@angular/core/testing";
import { provideHttpClient, withXhr } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { BlogService, BlogPost } from "./blog.service";
import { AuthService } from "./auth.service";
import { BlogData } from "../models/blog-data";
import { environment } from "../../environments/environment";

const apiDocument: BlogData = {
  posts: [
    {
      title: "Older Post",
      date: "2023-01-01T00:00:00.000Z",
      summary: "The older one.",
      tags: ["Angular"],
      url: "/blog/older-post",
      content: "## Older\n\nBody text.",
    },
    {
      title: "Newer Post",
      date: "2024-06-01T00:00:00.000Z",
      summary: "The newer one.",
      tags: ["AWS"],
      url: "/blog/newer-post",
      content: "Some *markdown* here.\n\n```bash\nnpm ci\n```",
    },
  ],
};

describe("BlogService", () => {
  let service: BlogService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: { getIdToken: () => "test-id-token" },
        },
      ],
    });
    service = TestBed.inject(BlogService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it("should load posts from the API, newest first, with markdown rendered to HTML", () => {
    let posts: BlogPost[] = [];
    service.getAllPosts().subscribe((p) => (posts = p));

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/blog`);
    expect(req.request.method).toBe("GET");
    expect(req.request.headers.get("X-Api-Key")).toBe(environment.apiKey);
    req.flush(apiDocument);

    expect(posts.length).toBe(2);
    expect(posts[0].title).toBe("Newer Post");
    expect(posts[0].date instanceof Date).toBe(true);
    expect(posts[0].content).toContain("<em>markdown</em>");
    expect(posts[0].content).toContain('<pre class="line-numbers"');
    expect(posts[0].content).toContain('<code class="language-bash">');
  });

  it("should serve subsequent reads from the session cache without another API call", () => {
    service.getAllPosts().subscribe();
    httpMock.expectOne(`${environment.apiBaseUrl}/blog`).flush(apiDocument);

    let posts: BlogPost[] = [];
    service.getAllPosts().subscribe((p) => (posts = p));

    httpMock.expectNone(`${environment.apiBaseUrl}/blog`);
    expect(posts.length).toBe(2);
  });

  it("should render an empty list when the API fails", () => {
    // The service logs the failure; keep the expected error out of CI output,
    // where it reads like a real request burning the API quota.
    const consoleError = spyOn(console, "error");
    let posts: BlogPost[] | undefined;
    service.getAllPosts().subscribe((p) => (posts = p));

    httpMock
      .expectOne(`${environment.apiBaseUrl}/blog`)
      .flush(
        { message: "quota exceeded" },
        { status: 429, statusText: "Too Many Requests" },
      );

    expect(posts).toEqual([]);
    expect(consoleError).toHaveBeenCalled();
  });

  it("should render an empty list when the API has no posts yet", () => {
    let posts: BlogPost[] | undefined;
    service.getAllPosts().subscribe((p) => (posts = p));

    httpMock.expectOne(`${environment.apiBaseUrl}/blog`).flush({ posts: [] });

    expect(posts).toEqual([]);
  });

  it("should resolve an API post by url with content already rendered", () => {
    let post: BlogPost | undefined;
    service.getPostByUrl("/blog/newer-post").subscribe((p) => (post = p));

    httpMock.expectOne(`${environment.apiBaseUrl}/blog`).flush(apiDocument);

    expect(post?.title).toBe("Newer Post");
    expect(post?.content).toContain("<em>markdown</em>");
  });

  it("should resolve undefined for an unknown url", () => {
    let post: BlogPost | undefined = apiDocument.posts[0] as never;
    service.getPostByUrl("/blog/does-not-exist").subscribe((p) => (post = p));

    httpMock.expectOne(`${environment.apiBaseUrl}/blog`).flush(apiDocument);

    expect(post).toBeUndefined();
  });

  it("should PUT the blog document with the raw Cognito id token", () => {
    const data: BlogData = { posts: [] };
    service.updateBlog(data).subscribe();

    const req = httpMock.expectOne(`${environment.apiBaseUrl}/blog`);
    expect(req.request.method).toBe("PUT");
    expect(req.request.headers.get("Authorization")).toBe("test-id-token");
    expect(req.request.headers.get("X-Api-Key")).toBe(environment.apiKey);
    req.flush(data);
  });
});
