import { renderBlogMarkdown } from "./blog-markdown.util";

describe("renderBlogMarkdown", () => {
  it("should render standard markdown when given headings and emphasis", () => {
    const html = renderBlogMarkdown("# Title\n\nSome **bold** text.");

    expect(html).toContain("<h1");
    expect(html).toContain("Title");
    expect(html).toContain("<strong>bold</strong>");
  });

  it("should emit a Prism-ready pre block when given a fenced code block", () => {
    const html = renderBlogMarkdown("```typescript\nconst a = 1;\n```");

    expect(html).toContain('<pre class="line-numbers">');
    expect(html).toContain('<code class="language-typescript">');
    expect(html).toContain("const a = 1;");
  });

  it("should carry extra info-string tokens onto the pre element", () => {
    const html = renderBlogMarkdown(
      '```bash data-user="user" class="command-line"\nls -la\n```',
    );

    expect(html).toContain("line-numbers");
    expect(html).toContain("command-line");
    expect(html).toContain('data-user="user"');
    expect(html).toContain('<code class="language-bash">');
  });

  it("should escape HTML when given markup inside a code block", () => {
    const html = renderBlogMarkdown("```\n<script>alert(1)</script>\n```");

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });

  it("should omit the language class when given a fence with no language", () => {
    const html = renderBlogMarkdown("```\nplain\n```");

    expect(html).toContain('<code class="">');
  });

  it("should return a string synchronously", () => {
    expect(typeof renderBlogMarkdown("plain text")).toBe("string");
  });
});
