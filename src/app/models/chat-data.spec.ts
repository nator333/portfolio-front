import { chatContextForUrl } from "./chat-data";

describe("chatContextForUrl", () => {
  it("maps the main pages to their own context", () => {
    expect(chatContextForUrl("/home")).toEqual({ page: "home" });
    expect(chatContextForUrl("/profile")).toEqual({ page: "profile" });
    expect(chatContextForUrl("/projects")).toEqual({ page: "projects" });
    expect(chatContextForUrl("/blog")).toEqual({ page: "blog" });
    expect(chatContextForUrl("/workout?version=3")).toEqual({ page: "workout" });
  });

  it("maps a blog post to its decoded slug", () => {
    expect(chatContextForUrl("/blog/my-post#intro")).toEqual({
      page: "blog-post",
      slug: "my-post",
    });
    expect(chatContextForUrl("/blog/%E6%97%A5%E6%9C%AC")).toEqual({
      page: "blog-post",
      slug: "日本",
    });
  });

  it("falls back to the profile scope elsewhere", () => {
    expect(chatContextForUrl("/cv-editor")).toEqual({ page: "profile" });
    expect(chatContextForUrl("/blog-edit/new")).toEqual({ page: "profile" });
    expect(chatContextForUrl("/")).toEqual({ page: "profile" });
  });
});
